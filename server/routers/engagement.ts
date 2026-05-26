import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, predictions, leaderboardScores } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// TODO: implement with new schema — `userStreaks` table removed (streak data now on
// `leaderboardScores`). The `users` table no longer has `loginMethod`/`openId`, so we
// cannot filter out guest users at the query level. Notifications table was also removed,
// so segment notifications are stubbed.

// ── Types ────────────────────────────────────────────────────────────────────

export type SegmentKey = "engaged" | "active" | "fading" | "dormant";

interface UserRow {
  userId: number;
  name: string | null;
  lastPrediction: number | null; // unix seconds (SQLite stores timestamps as integers)
  totalPredictions: number;
  currentStreak: number;
  totalPoints: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOW_SEC = () => Math.floor(Date.now() / 1000);
const DAY_SEC = 86_400;

function classify(row: UserRow): SegmentKey {
  if (row.totalPredictions === 0 || row.lastPrediction === null) return "dormant";
  const ageDays = (NOW_SEC() - row.lastPrediction) / DAY_SEC;
  if (ageDays <= 7 && row.currentStreak >= 3) return "engaged";
  if (ageDays <= 14) return "active";
  if (ageDays <= 30) return "fading";
  return "dormant";
}

async function getUserRows(): Promise<UserRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      // SQLite stores createdAt as unix seconds via unixepoch()
      lastPrediction: sql<number | null>`max(${predictions.createdAt})`,
      totalPredictions: sql<number>`count(${predictions.id})`,
      currentStreak: sql<number>`coalesce(${leaderboardScores.currentStreak}, 0)`,
      totalPoints: sql<number>`coalesce(${leaderboardScores.totalPoints}, 0)`,
    })
    .from(users)
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .leftJoin(leaderboardScores, eq(leaderboardScores.userId, users.id))
    .groupBy(users.id);

  return rows as UserRow[];
}

// ── Segment metadata (kept server-side so the client can't forge it) ─────────

export const SEGMENT_META: Record<SegmentKey, { label: string; description: string; notifType: "achievement" | "match_reminder" }> = {
  engaged:  { label: "מעורב מאוד",  description: "ניחש ב-7 ימים האחרונים עם סטריק 3+", notifType: "achievement" },
  active:   { label: "פעיל",        description: "ניחש ב-14 ימים האחרונים",              notifType: "match_reminder" },
  fading:   { label: "דועך",        description: "ניחש לאחרונה לפני 15–30 יום",          notifType: "match_reminder" },
  dormant:  { label: "רדום",        description: "לא ניחש 30+ ימים או מעולם לא ניחש",    notifType: "match_reminder" },
};

// ── Router ───────────────────────────────────────────────────────────────────

export const engagementRouter = router({
  // Return per-segment stats: count, avg streak, avg points, sample names
  getSegments: adminProcedure.query(async () => {
    const rows = await getUserRows();

    const buckets: Record<SegmentKey, UserRow[]> = {
      engaged: [], active: [], fading: [], dormant: [],
    };
    for (const row of rows) buckets[classify(row)].push(row);

    return (Object.keys(buckets) as SegmentKey[]).map((key) => {
      const group = buckets[key];
      const count = group.length;
      const avgStreak = count ? Math.round(group.reduce((s, r) => s + r.currentStreak, 0) / count) : 0;
      const avgPoints = count ? Math.round(group.reduce((s, r) => s + r.totalPoints, 0) / count) : 0;
      const samples = group
        .slice(0, 5)
        .map((r) => r.name ?? "אנונימי");

      return { key, ...SEGMENT_META[key], count, avgStreak, avgPoints, samples };
    });
  }),

  // Blast an in-app notification to every user in a segment
  // TODO: implement with new schema — `notifications` table was removed
  sendSegmentNotification: adminProcedure
    .input(
      z.object({
        segment: z.enum(["engaged", "active", "fading", "dormant"]),
        title: z.string().min(1).max(80),
        content: z.string().max(300).optional(),
      }),
    )
    .mutation(async () => {
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "שליחת התראות לפי קבוצה אינה זמינה במהדורה הנוכחית" });
    }),
});
