import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { updateMatchResult, updateLeaderboardScore } from "../db";
import { getDb } from "../db";
import { predictions, matches, leaderboardScores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const adminRouter = router({
  // Publish match result and calculate scores
  publishMatchResult: adminProcedure
    .input(z.object({
      matchId: z.number(),
      homeScore: z.number().min(0),
      awayScore: z.number().min(0),
      // Advanced stats (optional) — currently ignored (table removed)
      // TODO: implement with new schema once advanced stats tables are reintroduced
      totalCorners: z.number().min(0).optional(),
      totalYellowCards: z.number().min(0).optional(),
      totalRedCards: z.number().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Determine actual result
        let actualResult: "home" | "draw" | "away";
        if (input.homeScore > input.awayScore) {
          actualResult = "home";
        } else if (input.homeScore < input.awayScore) {
          actualResult = "away";
        } else {
          actualResult = "draw";
        }

        // Update match with result
        await updateMatchResult(input.matchId, actualResult, input.homeScore, input.awayScore);

        // Get all predictions for this match
        const db = getDb();
        if (!db) {
          throw new Error("Database not available");
        }

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

          // Update leaderboard score (also handles streak via currentStreak/longestStreak)
          await updateLeaderboardScore(prediction.userId, points, isCorrect);

          // Update streak fields on leaderboardScores
          const [score] = await db
            .select()
            .from(leaderboardScores)
            .where(eq(leaderboardScores.userId, prediction.userId))
            .limit(1);

          if (score) {
            if (isCorrect) {
              const newCurrent = (score.currentStreak || 0) + 1;
              const newLongest = Math.max(newCurrent, score.longestStreak || 0);
              await db
                .update(leaderboardScores)
                .set({ currentStreak: newCurrent, longestStreak: newLongest })
                .where(eq(leaderboardScores.userId, prediction.userId));
            } else {
              await db
                .update(leaderboardScores)
                .set({ currentStreak: 0 })
                .where(eq(leaderboardScores.userId, prediction.userId));
            }
          }

          if (isCorrect) pointsAwarded++;
        }

        // Advanced stats scoring removed — advancedPredictions/matchAdvancedStats tables no longer exist
        // TODO: implement with new schema once advanced stats are reintroduced
        const advancedBonusCount = 0;

        return {
          success: true,
          message: `התוצאה פורסמה בהצלחה. ${pointsAwarded} משתמשים חזו נכון.`,
          pointsAwarded,
          advancedBonusCount,
        };
      } catch (error) {
        console.error("Error publishing match result:", error);
        throw error;
      }
    }),

  // Get all matches for admin panel
  getAllMatches: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();
        if (!db) return [];

        return await db.select().from(matches).limit(input.limit);
      } catch (error) {
        console.error("Error fetching matches:", error);
        return [];
      }
    }),
});
