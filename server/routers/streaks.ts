import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { userStreaks, predictions, users, notifications } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const streaksRouter = router({
  // Get my current streak
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return { currentStreak: 0, bestStreak: 0, lastCorrectAt: null as Date | null };

    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, ctx.user.id))
      .limit(1);

    if (!streak) {
      return { currentStreak: 0, bestStreak: 0, lastCorrectAt: null };
    }

    return {
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak,
      lastCorrectAt: streak.lastCorrectAt,
    };
  }),

  // Get top streaks leaderboard
  getTopStreaks: protectedProcedure.query(async () => {
    const db = getDb();
    if (!db) return [];

    const topStreaks = await db
      .select({
        userId: userStreaks.userId,
        currentStreak: userStreaks.currentStreak,
        bestStreak: userStreaks.bestStreak,
        userName: users.name,
      })
      .from(userStreaks)
      .leftJoin(users, eq(users.id, userStreaks.userId))
      .orderBy(desc(userStreaks.bestStreak))
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
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return [];
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, ctx.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }),

  // Mark a single notification as read
  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) return { success: false };
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),

  // Mark all notifications as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    if (!db) return { success: false };
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));
    return { success: true };
  }),
});

