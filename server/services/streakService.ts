import { getDb } from "../db";
import { leaderboardScores, predictions } from "../../drizzle/schema";
import { eq, lt, desc, and } from "drizzle-orm";

function log(msg: string): void {
  console.log(`[StreakService ${new Date().toISOString()}] ${msg}`);
}

function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Called after every prediction submission.
 * - Increments streak if user predicted yesterday
 * - Resets streak to 1 if there was a gap
 * - Updates leaderboardScores.currentStreak / longestStreak
 *
 * NOTE: The dedicated `userStreaks` table was removed from the schema.
 * Streak data is now persisted on `leaderboardScores`. The legacy
 * streak-break notification is dropped here because the `notifications`
 * table was also removed.
 */
export async function checkAndUpdateStreak(userId: number): Promise<void> {
  const db = getDb();
  const now = new Date();
  const todayMidnight = dayStart(now);
  const todayMidnightIso = todayMidnight.toISOString();

  // Find the most recent prediction submitted BEFORE today.
  // `createdAt` is stored as an ISO string in SQLite — lexicographic
  // comparison works for ISO-8601 strings.
  const [lastPred] = await db
    .select({ createdAt: predictions.createdAt })
    .from(predictions)
    .where(
      and(
        eq(predictions.userId, userId),
        lt(predictions.createdAt, todayMidnightIso),
      ),
    )
    .orderBy(desc(predictions.createdAt))
    .limit(1);

  // Current streak record (on leaderboardScores)
  const [existing] = await db
    .select()
    .from(leaderboardScores)
    .where(eq(leaderboardScores.userId, userId))
    .limit(1);

  const currentStreak = existing?.currentStreak ?? 0;
  const bestStreak = existing?.longestStreak ?? 0;

  let newStreak: number;

  if (!lastPred || !lastPred.createdAt) {
    // First prediction ever
    newStreak = 1;
  } else {
    const lastDay = dayStart(new Date(lastPred.createdAt));
    const diffDays = Math.round(
      (todayMidnight.getTime() - lastDay.getTime()) / 86_400_000,
    );

    if (diffDays === 1) {
      // Predicted yesterday — streak continues
      newStreak = currentStreak + 1;
    } else if (diffDays === 0) {
      // Already predicted today earlier — no change needed
      newStreak = currentStreak === 0 ? 1 : currentStreak;
    } else {
      // Gap > 1 day — streak broke
      newStreak = 1;
    }
  }

  const nextBest = Math.max(bestStreak, newStreak);

  // Upsert streak fields on leaderboardScores
  if (existing) {
    await db
      .update(leaderboardScores)
      .set({
        currentStreak: newStreak,
        longestStreak: nextBest,
      })
      .where(eq(leaderboardScores.userId, userId));
  } else {
    await db.insert(leaderboardScores).values({
      userId,
      currentStreak: newStreak,
      longestStreak: newStreak,
    });
  }

  log(`User ${userId}: streak ${currentStreak} → ${newStreak}`);
}
