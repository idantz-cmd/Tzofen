/**
 * Import Router - Admin procedures for importing matches and stats from football.co.il
 * No API key required — data is scraped directly from the official Israeli football site.
 *
 * Schema migration notes:
 * - `matches.externalId`, `homeTeamLogo`, `awayTeamLogo` columns were removed; importer
 *   relies on (league, homeTeam, awayTeam, matchDate) as the dedup key instead.
 * - `matches.resultPublished` was replaced by `matches.status` ('scheduled'|'live'|'finished').
 * - `matches.homeTeamScore`/`awayTeamScore` → `actualHomeScore`/`actualAwayScore`.
 * - `matchAdvancedStats` table was removed → advanced-stat import procedures are stubbed.
 * - Enum values: 'home_win'/'away_win' → 'home'/'away'.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { matches } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  createHeartbeatJob,
  listHeartbeatJobs,
  deleteHeartbeatJob,
  updateHeartbeatJob,
} from "../_core/heartbeat";
import {
  fetchFixtures,
  fetchUpcomingFixtures,
  fetchRecentlyFinished,
  fetchAllIsraeliFixtures,
  type ImportedMatch,
  type LeagueKey,
} from "../services/footballApi";
import { publishMatchResult } from "../services/publishResult";

// Map scraper enum values to new schema enum values.
function mapResult(r: ImportedMatch["actualResult"]): "home" | "draw" | "away" | undefined {
  if (!r) return undefined;
  if (r === "home_win") return "home";
  if (r === "away_win") return "away";
  return "draw";
}

// Find an existing match using (league, homeTeam, awayTeam, matchDate) as the dedup key.
// `matchDate` is stored as text in the new schema, so we compare as ISO strings.
async function findExistingMatch(
  db: ReturnType<typeof getDb>,
  m: ImportedMatch,
) {
  if (!db) return [];
  const iso = m.matchDate instanceof Date ? m.matchDate.toISOString() : String(m.matchDate);
  return db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.league, m.league),
        eq(matches.homeTeam, m.homeTeam),
        eq(matches.awayTeam, m.awayTeam),
        eq(matches.matchDate, iso),
      ),
    )
    .limit(1);
}

export const importRouter = router({
  /**
   * Import upcoming fixtures from football.co.il
   */
  importUpcoming: adminProcedure
    .input(z.object({
      league: z.enum(["ligat_hael", "ligah_leumit", "both"]).default("both"),
    }).optional())
    .mutation(async ({ input }) => {
      const league = input?.league ?? "both";

      let imported: ImportedMatch[];
      if (league === "both") {
        imported = await fetchUpcomingFixtures();
      } else {
        const today = new Date().toISOString().split("T")[0];
        const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        imported = await fetchFixtures(league as LeagueKey, {
          from: today,
          to: twoWeeks,
        });
        // Filter only upcoming
        imported = imported.filter(m => !m.actualResult);
      }

      const db = getDb();
      if (!db) throw new Error("Database not available");

      let created = 0;
      let skipped = 0;

      for (const match of imported) {
        const existing = await findExistingMatch(db, match);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(matches).values({
          league: match.league,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          matchDate: match.matchDate instanceof Date ? match.matchDate.toISOString() : String(match.matchDate),
          status: "scheduled",
        });
        created++;
      }

      return { created, skipped, total: imported.length };
    }),

  /**
   * Import results for recently finished matches
   */
  importResults: adminProcedure.mutation(async () => {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const finished = await fetchRecentlyFinished();
    let updated = 0;
    let notFound = 0;

    for (const match of finished) {
      if (!match.actualResult) continue;

      const existing = await findExistingMatch(db, match);

      if (existing.length === 0 || existing[0].actualResult) {
        notFound++;
        continue;
      }

      // Use shared publish workflow (scores predictions, updates streaks, sends notifications)
      await publishMatchResult({
        matchId: existing[0].id,
        homeScore: match.homeTeamScore!,
        awayScore: match.awayTeamScore!,
      });

      updated++;
    }

    return { updated, notFound, total: finished.length };
  }),

  /**
   * Import advanced stats (corners, cards) for a specific match.
   * TODO: implement with new schema — `matchAdvancedStats` table was removed.
   */
  importMatchStats: adminProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "ייבוא סטטיסטיקות מתקדמות אינו זמין במהדורה הנוכחית" });
    }),

  /**
   * Import all stats for finished matches that don't have stats yet.
   * TODO: implement with new schema — `matchAdvancedStats` table was removed.
   */
  importAllStats: adminProcedure.mutation(async () => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "ייבוא סטטיסטיקות מתקדמות אינו זמין במהדורה הנוכחית" });
  }),

  /**
   * Get import status - check connectivity to football.co.il
   */
  getStatus: adminProcedure.query(async () => {
    try {
      // Try a lightweight fetch to check connectivity
      const response = await fetch("https://www.football.co.il/scores/", {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return {
          configured: true,
          connected: false,
          source: "football.co.il",
          message: `שגיאת חיבור: ${response.status}`,
        };
      }

      return {
        configured: true,
        connected: true,
        source: "football.co.il",
        message: "מחובר ל-football.co.il — ללא צורך ב-API key",
        note: "נתונים נמשכים ישירות מהאתר הרשמי של מנהלת הליגות",
      };
    } catch (error: any) {
      return {
        configured: true,
        connected: false,
        source: "football.co.il",
        message: `שגיאה: ${error.message}`,
      };
    }
  }),

  /**
   * Custom import by date range
   */
  importByDateRange: adminProcedure
    .input(z.object({
      from: z.string(), // YYYY-MM-DD
      to: z.string(),   // YYYY-MM-DD
      league: z.enum(["ligat_hael", "ligah_leumit", "both"]).default("both"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("Database not available");

      let imported: ImportedMatch[];
      if (input.league === "both") {
        imported = await fetchAllIsraeliFixtures({ from: input.from, to: input.to });
      } else {
        imported = await fetchFixtures(input.league as LeagueKey, {
          from: input.from,
          to: input.to,
        });
      }

      let created = 0;
      let skipped = 0;
      let updatedResults = 0;

      for (const match of imported) {
        const existing = await findExistingMatch(db, match);

        if (existing.length > 0) {
          // If match exists but has no result and scraper found a result, update it
          if (!existing[0].actualResult && match.actualResult) {
            await publishMatchResult({
              matchId: existing[0].id,
              homeScore: match.homeTeamScore!,
              awayScore: match.awayTeamScore!,
            });
            updatedResults++;
          }
          skipped++;
          continue;
        }

        const mapped = mapResult(match.actualResult);
        await db.insert(matches).values({
          league: match.league,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          matchDate: match.matchDate instanceof Date ? match.matchDate.toISOString() : String(match.matchDate),
          status: mapped ? "finished" : "scheduled",
          ...(mapped && {
            actualResult: mapped,
            actualHomeScore: match.homeTeamScore,
            actualAwayScore: match.awayTeamScore,
          }),
        });
        created++;
      }

      return { created, skipped, updatedResults, total: imported.length };
    }),

  /**
   * Create a scheduled auto-import job (heartbeat)
   * Runs every 6 hours to import upcoming fixtures and update results.
   */
  createSchedule: adminProcedure
    .input(z.object({
      cron: z.string().default("0 0 */6 * * *"), // Every 6 hours
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const cron = input?.cron ?? "0 0 */6 * * *";
      const userSession = ctx.req.cookies?.["app_session_id"] ?? "";

      const result = await createHeartbeatJob(
        {
          name: "auto-import-matches",
          cron,
          path: "/api/scheduled/importMatches",
          method: "POST",
          description: "ייבוא אוטומטי משחקים ותוצאות מ-football.co.il",
        },
        userSession
      );

      return { taskUid: result.taskUid, nextExecution: result.nextExecutionAt };
    }),

  /**
   * List existing scheduled import jobs
   */
  listSchedules: adminProcedure.query(async ({ ctx }) => {
    const userSession = ctx.req.cookies?.["app_session_id"] ?? "";
    const result = await listHeartbeatJobs(userSession);
    return result.jobs.filter(j => j.name.includes("import"));
  }),

  /**
   * Delete a scheduled import job
   */
  deleteSchedule: adminProcedure
    .input(z.object({ taskUid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userSession = ctx.req.cookies?.["app_session_id"] ?? "";
      await deleteHeartbeatJob(input.taskUid, userSession);
      return { success: true };
    }),

  /**
   * Toggle (pause/resume) a scheduled import job
   */
  toggleSchedule: adminProcedure
    .input(z.object({ taskUid: z.string(), enable: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userSession = ctx.req.cookies?.["app_session_id"] ?? "";
      await updateHeartbeatJob(input.taskUid, { enable: input.enable }, userSession);
      return { success: true };
    }),

  /**
   * Import the entire season (all games from football.co.il)
   */
  importFullSeason: adminProcedure
    .input(z.object({
      league: z.enum(["ligat_hael", "ligah_leumit", "both"]).default("both"),
    }).optional())
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("Database not available");

      const allMatches = await fetchAllIsraeliFixtures();
      const league = input?.league ?? "both";

      let filtered = allMatches;
      if (league !== "both") {
        filtered = allMatches.filter(m => m.league === league);
      }

      let created = 0;
      let skipped = 0;
      let updatedResults = 0;

      for (const match of filtered) {
        const existing = await findExistingMatch(db, match);

        if (existing.length > 0) {
          if (!existing[0].actualResult && match.actualResult) {
            await publishMatchResult({
              matchId: existing[0].id,
              homeScore: match.homeTeamScore!,
              awayScore: match.awayTeamScore!,
            });
            updatedResults++;
          }
          skipped++;
          continue;
        }

        // For brand-new matches that already have results (historical),
        // we insert them with results directly. No need to call publishMatchResult
        // because there are no user predictions to score for matches that were
        // never in the system before.
        const mapped = mapResult(match.actualResult);
        await db.insert(matches).values({
          league: match.league,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          matchDate: match.matchDate instanceof Date ? match.matchDate.toISOString() : String(match.matchDate),
          status: mapped ? "finished" : "scheduled",
          ...(mapped && {
            actualResult: mapped,
            actualHomeScore: match.homeTeamScore,
            actualAwayScore: match.awayTeamScore,
          }),
        });
        created++;
      }

      return { created, skipped, updatedResults, total: filtered.length };
    }),
});
