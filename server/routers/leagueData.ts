/**
 * League Data Router
 * Admin: trigger one-time scrape of teams, standings, players from football.co.il
 * Public: query the scraped data
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { teams, leaguePlayers, leagueStandings } from "../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";
import { runFullScrape } from "../services/leagueDataScraper";

export const leagueDataRouter = router({
  /**
   * Admin: trigger the one-time full scrape (all 4 skills).
   */
  scrapeAll: adminProcedure
    .input(
      z.object({
        season: z.string().default("25/26"),
      }).optional()
    )
    .mutation(async ({ input }) => {
      const season = input?.season ?? "25/26";
      const result = await runFullScrape(season);
      return {
        success: true,
        message: `סיום: ${result.teams} קבוצות, ${result.standings.ligat_hael + result.standings.ligah_leumit} שורות טבלה, ${result.players} שחקנים`,
        ...result,
      };
    }),

  /**
   * Public: get all teams (optionally filtered by league).
   */
  getTeams: publicProcedure
    .input(
      z.object({
        league: z.enum(["ligat_hael", "ligah_leumit", "both"]).default("both"),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) return [];
      const league = input?.league ?? "both";
      if (league === "both") {
        return db.select().from(teams);
      }
      return db.select().from(teams).where(eq(teams.league, league));
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
        .from(leagueStandings)
        .where(and(eq(leagueStandings.league, input.league), eq(leagueStandings.season, targetSeason)))
        .orderBy(asc(leagueStandings.position));

      // If no data for requested season, fall back to most recent available
      if (rows.length === 0 && !input.season) {
        return db
          .select()
          .from(leagueStandings)
          .where(eq(leagueStandings.league, input.league))
          .orderBy(asc(leagueStandings.position));
      }
      return rows;
    }),

  /**
   * Public: get players for a specific team (by externalTeamId).
   */
  getPlayers: publicProcedure
    .input(
      z.object({
        externalTeamId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) return [];
      return db
        .select()
        .from(leaguePlayers)
        .where(eq(leaguePlayers.externalTeamId, input.externalTeamId));
    }),

  /**
   * Public: check if any league data has been scraped.
   */
  getDataStatus: publicProcedure.query(async () => {
    const db = getDb();
    if (!db) return { hasData: false, teams: 0, standings: 0, players: 0 };

    const [teamRows, standingRows, playerRows] = await Promise.all([
      db.select().from(teams),
      db.select().from(leagueStandings),
      db.select().from(leaguePlayers),
    ]);

    return {
      hasData: teamRows.length > 0,
      teams: teamRows.length,
      standings: standingRows.length,
      players: playerRows.length,
    };
  }),
});
