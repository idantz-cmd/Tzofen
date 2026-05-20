/**
 * Shared publish result logic.
 * Used by both the admin panel and the scheduled auto-import handler.
 * Handles: updating match result, scoring predictions, updating streaks, and notifications.
 */
import { getDb } from "../db";
import { updateMatchResult, updateLeaderboardScore, addBonusPoints, createNotification } from "../db";
import { predictions, advancedPredictions, matchAdvancedStats, userStreaks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface PublishInput {
  matchId: number;
  homeScore: number;
  awayScore: number;
  totalCorners?: number;
  totalYellowCards?: number;
  totalRedCards?: number;
}

interface PublishResult {
  success: boolean;
  pointsAwarded: number;
  advancedBonusCount: number;
}

/**
 * Score advanced predictions for a match.
 * Each correct advanced prediction = 3 bonus points.
 */
async function scoreAdvancedPredictions(matchId: number, stats: {
  totalGoals: number;
  totalCorners: number;
  totalYellowCards: number;
  totalRedCards: number;
}) {
  const db = getDb();
  if (!db) return 0;

  const allAdvanced = await db
    .select()
    .from(advancedPredictions)
    .where(eq(advancedPredictions.matchId, matchId));

  let totalBonusAwarded = 0;

  for (const pred of allAdvanced) {
    let bonusPoints = 0;

    if (pred.goalsOverUnder) {
      const actualGoalsOver = stats.totalGoals > 2.5;
      if ((pred.goalsOverUnder === "over" && actualGoalsOver) ||
          (pred.goalsOverUnder === "under" && !actualGoalsOver)) {
        bonusPoints += 3;
      }
    }

    if (pred.cornersOverUnder) {
      const actualCornersOver = stats.totalCorners > 9.5;
      if ((pred.cornersOverUnder === "over" && actualCornersOver) ||
          (pred.cornersOverUnder === "under" && !actualCornersOver)) {
        bonusPoints += 3;
      }
    }

    if (pred.yellowCardsOverUnder) {
      const actualYellowOver = stats.totalYellowCards > 3.5;
      if ((pred.yellowCardsOverUnder === "over" && actualYellowOver) ||
          (pred.yellowCardsOverUnder === "under" && !actualYellowOver)) {
        bonusPoints += 3;
      }
    }

    if (pred.redCardInMatch !== null && pred.redCardInMatch !== undefined) {
      const actualRedCard = stats.totalRedCards > 0;
      if (pred.redCardInMatch === actualRedCard) {
        bonusPoints += 3;
      }
    }

    await db
      .update(advancedPredictions)
      .set({ points: bonusPoints })
      .where(eq(advancedPredictions.id, pred.id));

    if (bonusPoints > 0) {
      await addBonusPoints(pred.userId, bonusPoints);
      totalBonusAwarded++;
    }
  }

  return totalBonusAwarded;
}

/**
 * Publish a match result: update match, score predictions, update streaks, send notifications.
 * This is the single source of truth for result publishing logic.
 */
export async function publishMatchResult(input: PublishInput): Promise<PublishResult> {
  const db = getDb();
  if (!db) throw new Error("Database not available");

  // Determine actual result
  let actualResult: "home_win" | "draw" | "away_win";
  if (input.homeScore > input.awayScore) {
    actualResult = "home_win";
  } else if (input.homeScore < input.awayScore) {
    actualResult = "away_win";
  } else {
    actualResult = "draw";
  }

  // Update match with result (sets resultPublished = true)
  await updateMatchResult(input.matchId, actualResult, input.homeScore, input.awayScore);

  // Get all predictions for this match
  const matchPredictions = await db
    .select()
    .from(predictions)
    .where(eq(predictions.matchId, input.matchId));

  // Calculate scores for each prediction
  let pointsAwarded = 0;
  for (const prediction of matchPredictions) {
    const isCorrect = prediction.prediction === actualResult;
    const points = isCorrect ? 10 : 0;

    // Update prediction record
    await db
      .update(predictions)
      .set({
        isCorrect,
        points,
        updatedAt: new Date(),
      })
      .where(eq(predictions.id, prediction.id));

    // Update leaderboard score
    await updateLeaderboardScore(prediction.userId, points, isCorrect);

    // Update streak
    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, prediction.userId))
      .limit(1);

    if (streak) {
      if (isCorrect) {
        const newCurrent = (streak.currentStreak || 0) + 1;
        const newBest = Math.max(newCurrent, streak.bestStreak || 0);
        await db.update(userStreaks).set({
          currentStreak: newCurrent,
          bestStreak: newBest,
          lastCorrectAt: new Date(),
        }).where(eq(userStreaks.userId, prediction.userId));
      } else {
        await db.update(userStreaks).set({
          currentStreak: 0,
        }).where(eq(userStreaks.userId, prediction.userId));
      }
    } else {
      await db.insert(userStreaks).values({
        userId: prediction.userId,
        currentStreak: isCorrect ? 1 : 0,
        bestStreak: isCorrect ? 1 : 0,
        lastCorrectAt: isCorrect ? new Date() : null,
      });
    }

    // Create notification for user
    await createNotification({
      userId: prediction.userId,
      title: "×”×ª×•×¦××” ×¤×•×¨×¡×ž×”",
      content: `×”×ª×—×–×™×ª ×©×œ×š ${isCorrect ? "×”×™×™×ª×” × ×›×•× ×”! ðŸŽ‰" : "×œ× ×”×™×™×ª×” × ×›×•× ×”"} - ${points} × ×§×•×“×•×ª`,
      type: "result_published",
      relatedMatchId: input.matchId,
    });

    if (isCorrect) pointsAwarded++;
  }

  // Handle advanced stats scoring
  let advancedBonusCount = 0;
  const totalGoals = input.homeScore + input.awayScore;
  const hasAdvancedStats = input.totalCorners !== undefined || input.totalYellowCards !== undefined || input.totalRedCards !== undefined;

  if (hasAdvancedStats) {
    const stats = {
      totalGoals,
      totalCorners: input.totalCorners ?? 0,
      totalYellowCards: input.totalYellowCards ?? 0,
      totalRedCards: input.totalRedCards ?? 0,
    };

    // Save advanced stats
    const [existing] = await db
      .select()
      .from(matchAdvancedStats)
      .where(eq(matchAdvancedStats.matchId, input.matchId))
      .limit(1);

    if (existing) {
      await db.update(matchAdvancedStats).set(stats).where(eq(matchAdvancedStats.matchId, input.matchId));
    } else {
      await db.insert(matchAdvancedStats).values({
        matchId: input.matchId,
        ...stats,
      });
    }

    // Score advanced predictions
    advancedBonusCount = await scoreAdvancedPredictions(input.matchId, stats);
  }

  return { success: true, pointsAwarded, advancedBonusCount };
}

