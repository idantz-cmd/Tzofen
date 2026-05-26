/**
 * League Data Router
 * Public: query league standings.
 *
 * TODO: implement with new schema — `teams`, `leaguePlayers` tables were removed.
 * Only the `standings` table remains. Scraper procedures are stubbed since they wrote
 * to the removed tables.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { standings } from "../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";

export const leagueDataRouter = router({
  /**
   * Admin: trigger the one-time full scrape.
   * TODO: implement with new schema — scraper currently writes to removed tables.
   */
  scrapeAll: adminProcedure
    .input(
      z.object({
        season: z.string().default("25/26"),
      }).optional()
    )
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "סקרייפר הליגה אינו זמין במהדורה הנוכחית" });
    }),

  /**
   * Public: get all teams (optionally filtered by league).
   * TODO: implement with new schema — `teams` table was removed.
   */
  getTeams: publicProcedure
    .input(
      z.object({
        league: z.enum(["ligat_hael", "ligah_leumit", "both"]).default("both"),
      }).optional()
    )
    .query(async () => {
      return [] as Array<{ id: number; name: string; league: string; season: string }>;
    }),

  /**
   * Public: get league standings table for a specific league.
   */
  getStandings: publicProcedure
    .input(
      z.object({
        league: z.enum(["ligat_hael", "ligah_leumit"]),
        season: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) return [];

      // Default to latest available season
      const targetSeason = input.season ?? "2025";

      const rows = await db
        .select()
        .from(standings)
        .where(and(eq(standings.league, input.league), eq(standings.season, targetSeason)))
        .orderBy(asc(standings.position));

      // If no data for requested season, fall back to most recent available
      if (rows.length === 0 && !input.season) {
        return db
          .select()
          .from(standings)
          .where(eq(standings.league, input.league))
          .orderBy(asc(standings.position));
      }
      return rows;
    }),

  /**
   * Public: get players for a specific team.
   * TODO: implement with new schema — `leaguePlayers` table was removed.
   */
  getPlayers: publicProcedure
    .input(
      z.object({
        externalTeamId: z.number(),
      })
    )
    .query(async () => {
      return [] as Array<{ id: number; name: string; teamName: string; position: string | null }>;
    }),

  /**
   * Public: check if any league data has been scraped.
   */
  getDataStatus: publicProcedure.query(async () => {
    const db = getDb();
    if (!db) return { hasData: false, teams: 0, standings: 0, players: 0 };

    const standingRows = await db.select().from(standings);

    return {
      hasData: standingRows.length > 0,
      teams: 0,
      standings: standingRows.length,
      players: 0,
    };
  }),
});
