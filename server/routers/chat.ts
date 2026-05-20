import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { matches } from "../../drizzle/schema";
import { or, eq } from "drizzle-orm";

export const chatRouter = router({
  ask: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        matchId: z.number().optional(),
      })
    )
    .mutation(async () => {
      return {
        success: false,
        message: "עוזר ה-AI אינו זמין כרגע. נחזור בקרוב.",
      };
    }),

  getTeamForm: publicProcedure
    .input(z.object({ teamName: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const allMatches = await db.select().from(matches).limit(100);

      const teamMatches = allMatches.filter(
        (m) => m.homeTeam === input.teamName || m.awayTeam === input.teamName
      );

      return {
        teamName: input.teamName,
        recentMatches: teamMatches.length,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };
    }),

  getHeadToHead: publicProcedure
    .input(z.object({ team1: z.string(), team2: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const allMatches = await db.select().from(matches).limit(200);

      const h2h = allMatches.filter(
        (m) =>
          (m.homeTeam === input.team1 && m.awayTeam === input.team2) ||
          (m.homeTeam === input.team2 && m.awayTeam === input.team1)
      );

      return {
        team1: input.team1,
        team2: input.team2,
        totalMatches: h2h.length,
        team1Wins: 0,
        team2Wins: 0,
        draws: 0,
        team1GoalsFor: 0,
        team2GoalsFor: 0,
      };
    }),
});
