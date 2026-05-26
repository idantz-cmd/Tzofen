/**
 * Shared publish result logic.
 * Used by both the admin panel and the scheduled auto-import handler.
 * Handles: updating match result, scoring predictions, updating streaks.
 *
 * NOTE: The advancedPredictions, matchAdvancedStats, notifications, and
 * userStreaks tables have been removed from the schema. Advanced stats
 * scoring and notification dispatch are stubbed out below. Streaks are
 * now persisted on leaderboardScores.
 */
import { getDb } from "../db";
import { updateMatchResult, updateLeaderboardScore } from "../db";
import { predictions, leaderboardScores } from "../../drizzle/schema";
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
 * Publish a match result: update match, score predictions, update streaks.
 * This is the single source of truth for result publishing logic.
 */
export async function publishMatchResult(input: PublishInput): Promise<PublishResult> {
  const db = getDb();
  if (!db) throw new Error("Database not available");

  // Determine actual result
  let actualResult: "home" | "draw" | "away";
  if (input.homeScore > input.awayScore) {
    actualResult = "home";
  } else if (input.homeScore < input.awayScore) {
    actualResult = "away";
  } else {
    actualResult = "draw";
  }

  // Update match with result (sets status = "finished")
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
      })
      .where(eq(predictions.id, prediction.id));

    // Update leaderboard score
    await updateLeaderboardScore(prediction.userId, points, isCorrect);

    // Update streak on leaderboardScores
    const [existing] = await db
      .select()
      .from(leaderboardScores)
      .where(eq(leaderboardScores.userId, prediction.userId))
      .limit(1);

    if (existing) {
      const prevCurrent = existing.currentStreak ?? 0;
      const prevBest = existing.longestStreak ?? 0;
      const nextCurrent = isCorrect ? prevCurrent + 1 : 0;
      const nextBest = Math.max(prevBest, nextCurrent);
      await db
        .update(leaderboardScores)
        .set({
          currentStreak: nextCurrent,
          longestStreak: nextBest,
        })
        .where(eq(leaderboardScores.userId, prediction.userId));
    }

    if (isCorrect) pointsAwarded++;
  }

  // TODO: advancedPredictions and matchAdvancedStats tables were removed
  // from the schema. Advanced bonus scoring is disabled until a new model
  // for advanced predictions is introduced. The corner/card/red inputs on
  // PublishInput are accepted but currently ignored.
  const advancedBonusCount = 0;
  void input.totalCorners;
  void input.totalYellowCards;
  void input.totalRedCards;

  return { success: true, pointsAwarded, advancedBonusCount };
}
