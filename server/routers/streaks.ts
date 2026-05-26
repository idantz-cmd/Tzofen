import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { leaderboardScores, predictions, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// TODO: implement with new schema — `userStreaks` and `notifications` tables were removed.
// Streak data is now stored on `leaderboardScores.currentStreak` / `longestStreak`.
// Notification procedures are stubbed since the `notifications` table no longer exists.

export const streaksRouter = router({
  // Get my current streak (sourced from leaderboardScores)
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return { currentStreak: 0, bestStreak: 0, lastCorrectAt: null as Date | null };

    const [score] = await db
      .select()
      .from(leaderboardScores)
      .where(eq(leaderboardScores.userId, ctx.user.id))
      .limit(1);

    if (!score) {
      return { currentStreak: 0, bestStreak: 0, lastCorrectAt: null };
    }

    return {
      currentStreak: score.currentStreak ?? 0,
      bestStreak: score.longestStreak ?? 0,
      lastCorrectAt: null as Date | null,
    };
  }),

  // Get top streaks leaderboard
  getTopStreaks: protectedProcedure.query(async () => {
    const db = getDb();
    if (!db) return [];

    const topStreaks = await db
      .select({
        userId: leaderboardScores.userId,
        currentStreak: leaderboardScores.currentStreak,
        bestStreak: leaderboardScores.longestStreak,
        userName: users.name,
      })
      .from(leaderboardScores)
      .leftJoin(users, eq(users.id, leaderboardScores.userId))
      .orderBy(desc(leaderboardScores.longestStreak))
      .limit(20);

    return topStreaks.map((s, index) => ({
      rank: index + 1,
      ...s,
    }));
  }),

  // Get streak history (recent correct/incorrect predictions)
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return [];

    const recentPredictions = await db
      .select({
        id: predictions.id,
        matchId: predictions.matchId,
        prediction: predictions.prediction,
        isCorrect: predictions.isCorrect,
        points: predictions.points,
        createdAt: predictions.createdAt,
      })
      .from(predictions)
      .where(eq(predictions.userId, ctx.user.id))
      .orderBy(desc(predictions.createdAt))
      .limit(30);

    return recentPredictions.filter((p) => p.isCorrect !== null);
  }),

  // Get user's notifications (unread first)
  // TODO: implement with new schema — `notifications` table was removed
  getNotifications: protectedProcedure.query(async () => {
    return [] as Array<{
      id: number;
      userId: number;
      title: string;
      content: string | null;
      type: string;
      relatedMatchId: number | null;
      read: boolean;
      createdAt: Date;
    }>;
  }),

  // Mark a single notification as read
  // TODO: implement with new schema — `notifications` table was removed
  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "תכונה זו אינה זמינה במהדורה הנוכחית" });
    }),

  // Mark all notifications as read
  // TODO: implement with new schema — `notifications` table was removed
  markAllRead: protectedProcedure.mutation(async () => {
    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "תכונה זו אינה זמינה במהדורה הנוכחית" });
  }),
});
