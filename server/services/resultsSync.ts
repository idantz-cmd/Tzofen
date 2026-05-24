import cron from "node-cron";
import { getDb } from "../db";
import { matches, predictions, leaderboardScores } from "../../drizzle/schema";
import { eq, and, lte, isNull, or } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

type MatchResult = "home_win" | "draw" | "away_win";

interface ScoresApiGame {
  id: number;
  homeCompetitor: { score: number };
  awayCompetitor: { score: number };
  statusGroup: number; // 4 = finished
}

interface ScoresApiResponse {
  games?: ScoresApiGame[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[ResultsSync ${new Date().toISOString()}] ${msg}`);
}

function deriveResult(home: number, away: number): MatchResult {
  if (home > away) return "home_win";
  if (home < away) return "away_win";
  return "draw";
}

function calcPoints(
  prediction: MatchResult,
  actual: MatchResult,
): { points: number; isCorrect: boolean } {
  const isCorrect = prediction === actual;
  return { points: isCorrect ? 3 : 0, isCorrect };
}

/**
 * Israel is UTC+3 (summer) / UTC+2 (winter).
 * We use a fixed +3 offset — good enough for scheduling.
 * Active match windows: Fri–Sat 17:00–23:00, Mon 19:00–23:00.
 */
function isActiveMatchWindow(): boolean {
  const now = new Date();
  const israelHour = (now.getUTCHours() + 3) % 24;
  const israelDay = now.getUTCDay(); // 0=Sun,1=Mon,5=Fri,6=Sat

  const isMon = israelDay === 1 && israelHour >= 19 && israelHour <= 23;
  const isFriSat =
    (israelDay === 5 || israelDay === 6) &&
    israelHour >= 17 &&
    israelHour <= 23;

  return isMon || isFriSat;
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ── 365scores API ────────────────────────────────────────────────────────────

// Ligat HaAl = 610, Ligah Leumit = 611
const LEAGUE_IDS: Record<string, number> = {
  ligat_hael: 610,
  ligah_leumit: 611,
};

async function fetch365Scores(
  leagueKey: string,
  date: Date,
): Promise<ScoresApiGame[]> {
  const competitionId = LEAGUE_IDS[leagueKey];
  if (!competitionId) return [];

  const dateStr = fmtDate(date);
  const url =
    `https://webws.365scores.com/web/games/?appTypeId=5&langId=23` +
    `&timezoneName=Asia%2FJerusalem&userCountryId=6` +
    `&startDate=${dateStr}&endDate=${dateStr}` +
    `&sportId=1&competitionIds=${competitionId}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    log(`365scores returned ${res.status} for ${leagueKey}`);
    return [];
  }

  const json = (await res.json()) as ScoresApiResponse;
  return (json.games ?? []).filter((g) => g.statusGroup === 4); // only finished
}

// ── Core: award points for one match ────────────────────────────────────────

export async function awardPointsForMatch(
  matchId: number,
  actual: MatchResult,
): Promise<number> {
  const db = getDb();

  const matchPredictions = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.matchId, matchId),
        or(isNull(predictions.isCorrect), eq(predictions.isCorrect, false)),
      ),
    );

  if (matchPredictions.length === 0) {
    log(`No unscored predictions for match ${matchId}`);
    return 0;
  }

  let awarded = 0;

  for (const pred of matchPredictions) {
    const { points, isCorrect } = calcPoints(
      pred.prediction as MatchResult,
      actual,
    );

    // Update prediction row
    await db
      .update(predictions)
      .set({ points, isCorrect, updatedAt: new Date() })
      .where(eq(predictions.id, pred.id));

    // Update leaderboard
    const existing = await db
      .select()
      .from(leaderboardScores)
      .where(eq(leaderboardScores.userId, pred.userId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (existing) {
      const newTotal = (existing.totalPoints ?? 0) + points;
      const newCorrect = (existing.correctPredictions ?? 0) + (isCorrect ? 1 : 0);
      const newPreds = (existing.totalPredictions ?? 0) + 1;
      const weeklyPts = (existing.weeklyPoints ?? 0) + points;

      await db
        .update(leaderboardScores)
        .set({
          totalPoints: newTotal,
          totalPredictions: newPreds,
          correctPredictions: newCorrect,
          accuracyRate: (newCorrect / newPreds) * 100,
          weeklyPoints: weeklyPts,
          lastUpdated: new Date(),
        })
        .where(eq(leaderboardScores.userId, pred.userId));
    } else {
      await db.insert(leaderboardScores).values({
        userId: pred.userId,
        totalPoints: points,
        totalPredictions: 1,
        correctPredictions: isCorrect ? 1 : 0,
        accuracyRate: isCorrect ? 100 : 0,
        weeklyPoints: points,
      });
    }

    awarded++;
  }

  log(`Awarded points for ${awarded} predictions on match ${matchId} (result: ${actual})`);
  return awarded;
}

// ── Core: publish one match result ──────────────────────────────────────────

export async function publishMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  const db = getDb();
  const actual = deriveResult(homeScore, awayScore);

  await db
    .update(matches)
    .set({
      actualResult: actual,
      homeTeamScore: homeScore,
      awayTeamScore: awayScore,
      resultPublished: true,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));

  log(`Published match ${matchId}: ${homeScore}-${awayScore} (${actual})`);
  await awardPointsForMatch(matchId, actual);
}

// ── Core: sync all pending matches ──────────────────────────────────────────

export async function syncPendingResults(): Promise<void> {
  const db = getDb();
  const now = new Date();

  // Matches that have started but no result yet
  const pending = await db
    .select()
    .from(matches)
    .where(and(eq(matches.resultPublished, false), lte(matches.matchDate, now)));

  if (pending.length === 0) {
    log("No pending matches to sync");
    return;
  }

  log(`Syncing ${pending.length} pending match(es)…`);

  for (const match of pending) {
    try {
      const games = await fetch365Scores(match.league, match.matchDate);

      // Match by externalId if available, else try to find by proximity
      const found = match.externalId
        ? games.find((g) => g.id === match.externalId)
        : games[0]; // best-effort when no externalId

      if (!found) {
        log(`No finished result from 365scores for match ${match.id} (${match.homeTeam} vs ${match.awayTeam})`);
        continue;
      }

      await publishMatchResult(
        match.id,
        found.homeCompetitor.score,
        found.awayCompetitor.score,
      );
    } catch (err) {
      log(`Error syncing match ${match.id}: ${String(err)}`);
    }
  }
}

// ── Cron entry point ─────────────────────────────────────────────────────────

export function startResultsSyncCron(): void {
  // Every 5 minutes — but only does real work during active windows
  cron.schedule("*/5 * * * *", async () => {
    if (!isActiveMatchWindow()) return;
    log("Active window — running sync");
    try {
      await syncPendingResults();
    } catch (err) {
      log(`Sync error: ${String(err)}`);
    }
  });

  log("Results sync cron started (every 5 min, active Fri/Sat 17-23, Mon 19-23)");
}
