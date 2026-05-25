import cron from "node-cron";
import { getDb } from "../db";
import { matches, predictions, leaderboardScores } from "../../drizzle/schema";
import { eq, and, lte, isNull, or } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────

type MatchResult = "home_win" | "draw" | "away_win";

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[ResultsSync ${new Date().toISOString()}] ${msg}`);
}

function deriveResult(home: number, away: number): MatchResult {
  if (home > away) return "home_win";
  if (home < away) return "away_win";
  return "draw";
}

// ישראל = UTC+3, משחקים בד"כ שישי-שבת-ראשון 17:00-23:00
const isMatchWindow = (): boolean => {
  const now = new Date();
  const israelHour = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
  ).getHours();
  const day = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
  ).getDay(); // 0=Sun, 5=Fri, 6=Sat

  const isWeekend = [5, 6, 0].includes(day);
  const isActiveHour = israelHour >= 17 && israelHour <= 23;

  return isWeekend && isActiveHour;
};

const POINTS = {
  CORRECT_OUTCOME: 3,
  EXACT_SCORE: 5,
  WRONG: 0,
} as const;

// ── 365scores API ─────────────────────────────────────────────────────────────

const fetch365ScoresResult = async (
  homeTeam: string,
  awayTeam: string,
  matchDate: string
): Promise<{ homeScore: number; awayScore: number } | null> => {
  try {
    const url = `https://webws.365scores.com/web/games/?appTypeId=5&langId=23&startDate=${matchDate}&endDate=${matchDate}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json() as { games?: Array<{ homeCompetitor: { name: string; score: number }; awayCompetitor: { name: string; score: number }; statusGroup: number }> };

    const game = data.games?.find(
      (g) =>
        g.homeCompetitor?.name?.includes(homeTeam) ||
        g.awayCompetitor?.name?.includes(awayTeam)
    );

    if (!game || game.statusGroup !== 4) return null; // 4 = finished

    return {
      homeScore: game.homeCompetitor.score,
      awayScore: game.awayCompetitor.score,
    };
  } catch (err) {
    log(`365scores fetch failed: ${String(err)}`);
    return null;
  }
};

// ── Core: publish result and award points ─────────────────────────────────────

export const publishResult = async (
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<void> => {
  const db = getDb();
  log(`Publishing result for match ${matchId}: ${homeScore}-${awayScore}`);

  const actual = deriveResult(homeScore, awayScore);

  // 1. Update the match
  await db
    .update(matches)
    .set({
      homeTeamScore: homeScore,
      awayTeamScore: awayScore,
      actualResult: actual,
      resultPublished: true,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));

  // 2. Fetch all unscored predictions for this match
  const matchPredictions = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.matchId, matchId),
        or(isNull(predictions.isCorrect), eq(predictions.isCorrect, false)),
      ),
    );

  // 3. Calculate and award points per user
  for (const pred of matchPredictions) {
    const isCorrectOutcome = pred.prediction === actual;
    const isExactScore =
      pred.predictedHomeScore === homeScore &&
      pred.predictedAwayScore === awayScore;

    const points = isExactScore
      ? POINTS.EXACT_SCORE
      : isCorrectOutcome
        ? POINTS.CORRECT_OUTCOME
        : POINTS.WRONG;

    await db
      .update(predictions)
      .set({ points, isCorrect: isCorrectOutcome, updatedAt: new Date() })
      .where(eq(predictions.id, pred.id));

    const existing = await db
      .select()
      .from(leaderboardScores)
      .where(eq(leaderboardScores.userId, pred.userId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (existing) {
      const newCorrect =
        (existing.correctPredictions ?? 0) + (isCorrectOutcome ? 1 : 0);
      const newPreds = (existing.totalPredictions ?? 0) + 1;

      await db
        .update(leaderboardScores)
        .set({
          totalPoints: (existing.totalPoints ?? 0) + points,
          correctPredictions: newCorrect,
          weeklyPoints: (existing.weeklyPoints ?? 0) + points,
          accuracyRate: (newCorrect / newPreds) * 100,
          totalPredictions: newPreds,
          lastUpdated: new Date(),
        })
        .where(eq(leaderboardScores.userId, pred.userId));
    } else {
      await db.insert(leaderboardScores).values({
        userId: pred.userId,
        totalPoints: points,
        totalPredictions: 1,
        correctPredictions: isCorrectOutcome ? 1 : 0,
        accuracyRate: isCorrectOutcome ? 100 : 0,
        weeklyPoints: points,
      });
    }
  }

  log(`Result published for match ${matchId}, awarded points to ${matchPredictions.length} predictions`);
};

// ── Cron: every 5 minutes during match windows ────────────────────────────────

export const startResultsSync = (): void => {
  cron.schedule("*/5 * * * *", async () => {
    if (!isMatchWindow()) return;

    log("Active window — checking live results...");
    const db = getDb();
    const now = new Date();

    const pendingMatches = await db
      .select()
      .from(matches)
      .where(and(eq(matches.resultPublished, false), lte(matches.matchDate, now)));

    for (const match of pendingMatches) {
      try {
        const dateStr = new Date(match.matchDate).toISOString().split("T")[0];

        const result = await fetch365ScoresResult(
          match.homeTeam,
          match.awayTeam,
          dateStr,
        );

        if (result) {
          await publishResult(match.id, result.homeScore, result.awayScore);
        }
      } catch (err) {
        log(`Error syncing match ${match.id}: ${String(err)}`);
      }
    }
  });

  log("Results sync cron started (every 5 min, active Fri/Sat/Sun 17-23)");
};
