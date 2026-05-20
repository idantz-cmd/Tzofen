import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getUpcomingMatches, getCompletedMatches, getMatchById, createMatch, updateMatchResult, createPrediction, getUserPredictionForMatch, getUserPredictions, updateLeaderboardScore, createNotification, getDb } from "../db";
import { advancedPredictions, matchAdvancedStats } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const matchesRouter = router({
  // Get upcoming matches
  getUpcoming: publicProcedure
    .input(z.object({
      league: z.enum(["ligat_hael", "ligah_leumit"]).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const matchList = await getUpcomingMatches(input.league);
        return matchList || [];
      } catch (error) {
        console.error("Error fetching matches:", error);
        return [];
      }
    }),

  // Get completed matches (with results)
  getCompleted: publicProcedure
    .input(z.object({
      league: z.enum(["ligat_hael", "ligah_leumit"]).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const matchList = await getCompletedMatches(input.league);
        return matchList || [];
      } catch (error) {
        console.error("Error fetching completed matches:", error);
        return [];
      }
    }),

  // Get single match
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getMatchById(input.id);
      } catch (error) {
        console.error("Error fetching match:", error);
        return null;
      }
    }),

  // Submit user prediction
  submitPrediction: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      prediction: z.enum(["home_win", "draw", "away_win"]),
      confidence: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const existing = await getUserPredictionForMatch(ctx.user.id, input.matchId);
        if (existing) {
          throw new Error("תחזוקה זו כבר הוגשה");
        }

        await createPrediction({
          userId: ctx.user.id,
          matchId: input.matchId,
          prediction: input.prediction,
          confidence: input.confidence ?? null,
          points: 0,
          isCorrect: false,
        });

        return { success: true, message: "התחזית הוגשה בהצלחה" };
      } catch (error) {
        console.error("Error submitting prediction:", error);
        throw error;
      }
    }),

  // Get user's predictions
  getUserPredictions: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await getUserPredictions(ctx.user.id);
      } catch (error) {
        console.error("Error fetching user predictions:", error);
        return [];
      }
    }),

  // AI prediction — not available yet
  generateAIPrediction: publicProcedure
    .input(z.object({
      homeTeam: z.string(),
      awayTeam: z.string(),
      league: z.enum(["ligat_hael", "ligah_leumit"]),
    }))
    .query(async () => {
      return null;
    }),

  // Admin: Publish match result and calculate scores
  publishResult: adminProcedure
    .input(z.object({
      matchId: z.number(),
      homeScore: z.number().min(0),
      awayScore: z.number().min(0),
    }))
    .mutation(async ({ ctx: _ctx, input }) => {
      try {
        let actualResult: "home_win" | "draw" | "away_win";
        if (input.homeScore > input.awayScore) {
          actualResult = "home_win";
        } else if (input.homeScore < input.awayScore) {
          actualResult = "away_win";
        } else {
          actualResult = "draw";
        }

        await updateMatchResult(input.matchId, actualResult, input.homeScore, input.awayScore);

        return { success: true, message: "התוצאה פורסמה בהצלחה" };
      } catch (error) {
        console.error("Error publishing result:", error);
        throw error;
      }
    }),

  // Get advanced prediction results for a completed match
  getAdvancedResults: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) return null;

      const [userPred] = await db
        .select()
        .from(advancedPredictions)
        .where(
          and(
            eq(advancedPredictions.userId, ctx.user.id),
            eq(advancedPredictions.matchId, input.matchId)
          )
        )
        .limit(1);

      if (!userPred) return null;

      const [stats] = await db
        .select()
        .from(matchAdvancedStats)
        .where(eq(matchAdvancedStats.matchId, input.matchId))
        .limit(1);

      return {
        prediction: userPred,
        actualStats: stats || null,
      };
    }),

  // Submit advanced prediction (goals, corners, cards)
  submitAdvancedPrediction: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      goalsOverUnder: z.enum(["over", "under"]).optional(),
      cornersOverUnder: z.enum(["over", "under"]).optional(),
      yellowCardsOverUnder: z.enum(["over", "under"]).optional(),
      redCardInMatch: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      const [existing] = await db
        .select()
        .from(advancedPredictions)
        .where(
          and(
            eq(advancedPredictions.userId, ctx.user.id),
            eq(advancedPredictions.matchId, input.matchId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(advancedPredictions)
          .set({
            goalsOverUnder: input.goalsOverUnder || null,
            cornersOverUnder: input.cornersOverUnder || null,
            yellowCardsOverUnder: input.yellowCardsOverUnder || null,
            redCardInMatch: input.redCardInMatch ?? null,
          })
          .where(eq(advancedPredictions.id, existing.id));

        return { success: true, message: "החיזוי המתקדם עודכן" };
      }

      await db.insert(advancedPredictions).values({
        userId: ctx.user.id,
        matchId: input.matchId,
        goalsOverUnder: input.goalsOverUnder || null,
        cornersOverUnder: input.cornersOverUnder || null,
        yellowCardsOverUnder: input.yellowCardsOverUnder || null,
        redCardInMatch: input.redCardInMatch ?? null,
        points: 0,
      });

      return { success: true, message: "החיזוי המתקדם נשמר" };
    }),
});
