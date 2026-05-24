import { getDb, createNotification } from "../db";
import { userStreaks, predictions } from "../../drizzle/schema";
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
 * - Sends a notification when a streak of 3+ days breaks
 * - Updates userStreaks table
 */
export async function checkAndUpdateStreak(userId: number): Promise<void> {
  const db = getDb();
  const now = new Date();
  const todayMidnight = dayStart(now);

  // Find the most recent prediction submitted BEFORE today
  const [lastPred] = await db
    .select({ createdAt: predictions.createdAt })
    .from(predictions)
    .where(
      and(
        eq(predictions.userId, userId),
        lt(predictions.createdAt, todayMidnight),
      ),
    )
    .orderBy(desc(predictions.createdAt))
    .limit(1);

  // Current streak record
  const [existing] = await db
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .limit(1);

  const currentStreak = existing?.currentStreak ?? 0;
  const bestStreak = existing?.bestStreak ?? 0;

  let newStreak: number;
  let streakBroke = false;

  if (!lastPred) {
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
      if (currentStreak >= 3) streakBroke = true;
      newStreak = 1;
    }
  }

  // Upsert streak row
  if (existing) {
    await db
      .update(userStreaks)
      .set({
        currentStreak: newStreak,
        bestStreak: Math.max(bestStreak, newStreak),
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, userId));
  } else {
    await db.insert(userStreaks).values({
      userId,
      currentStreak: newStreak,
      bestStreak: newStreak,
    });
  }

  log(`User ${userId}: streak ${currentStreak} → ${newStreak}${streakBroke ? " (BROKE)" : ""}`);

  // Notify when a meaningful streak breaks
  if (streakBroke) {
    await createNotification({
      userId,
      title: "הסטריק נשבר! 🔥",
      content: `לא ניחשת אתמול — הסטריק שלך של ${currentStreak} ימים אופס. חזור היום!`,
      type: "achievement",
    });
  }
}
