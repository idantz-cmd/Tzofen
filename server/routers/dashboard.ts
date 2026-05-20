import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserPredictions, getUserLeaderboardScore } from "../db";

export const dashboardRouter = router({
  // Get user's dashboard stats
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const predictions = await getUserPredictions(ctx.user.id);
        const leaderboardScore = await getUserLeaderboardScore(ctx.user.id);

        const totalPredictions = predictions?.length || 0;
        const correctPredictions = predictions?.filter((p) => p.isCorrect).length || 0;
        const totalPoints = leaderboardScore?.totalPoints || 0;
        const accuracyRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

        return {
          totalPredictions,
          correctPredictions,
          totalPoints,
          accuracyRate: Math.round(accuracyRate * 100) / 100,
          userName: ctx.user.name || "×ž×©×ª×ž×©",
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
          totalPredictions: 0,
          correctPredictions: 0,
          totalPoints: 0,
          accuracyRate: 0,
          userName: ctx.user.name || "×ž×©×ª×ž×©",
        };
      }
    }),

  // Get user's recent predictions
  getRecentPredictions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ ctx, input }) => {
      try {
        const predictions = await getUserPredictions(ctx.user.id);
        // Sort by date descending and limit
        return (predictions || []).slice(0, input.limit);
      } catch (error) {
        console.error("Error fetching recent predictions:", error);
        return [];
      }
    }),
});

