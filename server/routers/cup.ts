import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { matches, cupChampionPredictions, leaderboardScores } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const CUP_ROUNDS = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "final"] as const;
type CupRound = typeof CUP_ROUNDS[number];

const ROUND_LABELS: Record<CupRound, string> = {
  round_of_32: "שלב 32",
  round_of_16: "שלב 16",
  quarter_final: "רבע גמר",
  semi_final: "חצי גמר",
  final: "גמר",
};

const ROUND_POINTS: Record<CupRound, number> = {
  round_of_32: 3,
  round_of_16: 3,
  quarter_final: 4,
  semi_final: 4,
  final: 5,
};

export const cupRouter = router({
  getMatches: publicProcedure
    .input(z.object({
      season: z.string().default("2024-25"),
      round: z.enum(CUP_ROUNDS).optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db
        .select()
        .from(matches)
        .where(eq(matches.competitionType, "state_cup"))
        .orderBy(matches.matchDate);
      return input.round ? all.filter((m) => m.cupRound === input.round) : all;
    }),

  getBracket: publicProcedure
    .input(z.object({ season: z.string().default("2024-25") }))
    .query(async () => {
      const db = getDb();
      const all = await db
        .select()
        .from(matches)
        .where(eq(matches.competitionType, "state_cup"))
        .orderBy(matches.matchDate);

      const bracket: Record<CupRound, typeof all> = {
        round_of_32: [],
        round_of_16: [],
        quarter_final: [],
        semi_final: [],
        final: [],
      };
      for (const m of all) {
        const r = m.cupRound as CupRound | null;
        if (r && r in bracket) bracket[r].push(m);
      }
      return { bracket, roundLabels: ROUND_LABELS };
    }),

  predictChampion: protectedProcedure
    .input(z.object({
      teamName: z.string().min(1),
      season: z.string().default("2024-25"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Block changes once quarter-finals have started
      const qfMatches = await db
        .select()
        .from(matches)
        .where(and(eq(matches.competitionType, "state_cup"), eq(matches.cupRound, "quarter_final")));

      const qfStarted = qfMatches.some((m) => new Date() >= new Date(m.matchDate));
      if (qfStarted) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "לא ניתן לשנות ניחוש אלוף לאחר תחילת שלב רבע הגמר",
        });
      }

      const existing = await db
        .select()
        .from(cupChampionPredictions)
        .where(and(
          eq(cupChampionPredictions.userId, ctx.user.id),
          eq(cupChampionPredictions.season, input.season),
        ));

      if (existing.length > 0) {
        await db
          .update(cupChampionPredictions)
          .set({ teamName: input.teamName, predictedAt: new Date().toISOString() })
          .where(and(
            eq(cupChampionPredictions.userId, ctx.user.id),
            eq(cupChampionPredictions.season, input.season),
          ));
      } else {
        await db.insert(cupChampionPredictions).values({
          userId: ctx.user.id,
          season: input.season,
          teamName: input.teamName,
          predictedAt: new Date().toISOString(),
        });
      }

      return { success: true };
    }),

  getChampionPrediction: protectedProcedure
    .input(z.object({ season: z.string().default("2024-25") }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(cupChampionPredictions)
        .where(and(
          eq(cupChampionPredictions.userId, ctx.user.id),
          eq(cupChampionPredictions.season, input.season),
        ));
      return result[0] ?? null;
    }),

  getChampionStats: publicProcedure
    .input(z.object({ season: z.string().default("2024-25") }))
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db
        .select()
        .from(cupChampionPredictions)
        .where(eq(cupChampionPredictions.season, input.season));
      const counts: Record<string, number> = {};
      for (const p of all) counts[p.teamName] = (counts[p.teamName] ?? 0) + 1;
      return counts;
    }),

  // Admin: publish a cup match result and calculate points
  publishResult: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      winner: z.enum(["home", "away"]),
      homeScore: z.number().int().min(0),
      awayScore: z.number().int().min(0),
      extraTime: z.boolean().default(false),
      penalties: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "אדמין בלבד" });
      }
      const db = getDb();

      const match = await db.select().from(matches).where(eq(matches.id, input.matchId));
      if (!match[0]) throw new TRPCError({ code: "NOT_FOUND", message: "משחק לא נמצא" });

      await db.update(matches).set({
        actualResult: input.winner,
        actualHomeScore: input.homeScore,
        actualAwayScore: input.awayScore,
        status: "finished",
      }).where(eq(matches.id, input.matchId));

      // Award champion prediction points when the final is decided
      if (match[0].cupRound === "final") {
        const winnerTeam = input.winner === "home" ? match[0].homeTeam : match[0].awayTeam;
        const champPreds = await db
          .select()
          .from(cupChampionPredictions)
          .where(eq(cupChampionPredictions.season, match[0].season ?? "2024-25"));

        for (const pred of champPreds) {
          const correct = pred.teamName === winnerTeam;
          await db.update(cupChampionPredictions)
            .set({ isCorrect: correct, pointsAwarded: correct ? 15 : 0 })
            .where(eq(cupChampionPredictions.id, pred.id));

          if (correct) {
            const lb = await db.select().from(leaderboardScores).where(eq(leaderboardScores.userId, pred.userId));
            if (lb[0]) {
              await db.update(leaderboardScores)
                .set({ totalPoints: (lb[0].totalPoints ?? 0) + 15 })
                .where(eq(leaderboardScores.userId, pred.userId));
            }
          }
        }
      }

      return { success: true };
    }),
});
