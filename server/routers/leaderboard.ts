import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getLeaderboard, getUserLeaderboardScore } from "../db";

export const leaderboardRouter = router({
  // Get all-time leaderboard (public - anyone can view rankings)
  getAllTime: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      try {
        const scores = await getLeaderboard(input.limit);
        return scores || [];
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }
    }),

  // Get weekly leaderboard (public - anyone can view rankings)
  getWeekly: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      try {
        const scores = await getLeaderboard(input.limit);
        // TODO: Filter by weekly scores instead of total
        return scores || [];
      } catch (error) {
        console.error("Error fetching weekly leaderboard:", error);
        return [];
      }
    }),

  // Get current user's leaderboard position (protected - requires login)
  getUserPosition: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const score = await getUserLeaderboardScore(ctx.user.id);
        return score || null;
      } catch (error) {
        console.error("Error fetching user position:", error);
        return null;
      }
    }),
});

