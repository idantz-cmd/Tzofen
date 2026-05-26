import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import fs from "fs";
import path from "path";
import {
  users, matches, predictions, leaderboardScores,
  type InsertUser, type InsertMatch, type InsertPrediction,
  type LeaderboardScore,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    let client;
    if (ENV.databaseUrl) {
      // Turso cloud
      client = createClient({
        url: ENV.databaseUrl,
        authToken: ENV.databaseAuthToken,
      });
    } else {
      // Local SQLite file
      const dir = path.dirname(ENV.databasePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      client = createClient({ url: `file:${ENV.databasePath}` });
    }
    _db = drizzle(client);
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  role: "user" | "admin" = "user",
  favTeam?: string
): Promise<number> {
  const db = getDb();
  const result = await db.insert(users).values({
    email,
    passwordHash,
    name,
    role,
    favTeam: favTeam ?? null,
  });
  return Number(result.lastInsertRowid);
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  return (await db.select().from(users).where(eq(users.email, email)))[0] ?? null;
}

export async function getUserById(id: number) {
  const db = getDb();
  return (await db.select().from(users).where(eq(users.id, id)))[0] ?? null;
}

export async function getAllUsers() {
  const db = getDb();
  return db.select().from(users);
}

// TODO: legacy compatibility — guest users no longer first-class in the schema.
// Returns -1 to signal unavailable; callers should be migrated to use email-based auth.
export async function getOrCreateGuestUser(_guestToken: string): Promise<number> {
  return -1;
}

// TODO: legacy compatibility — openId removed from schema. Returns null.
export async function getUserByOpenId(_openId: string) {
  return null;
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function insertMatch(match: InsertMatch) {
  const db = getDb();
  return db.insert(matches).values(match);
}

export async function getMatchById(id: number) {
  const db = getDb();
  return (await db.select().from(matches).where(eq(matches.id, id)))[0] ?? null;
}

export async function getUpcomingMatches(league?: string, limit = 15, offset = 0) {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const allMatches = await (league
    ? db.select().from(matches)
        .where(and(eq(matches.league, league), eq(matches.status, "scheduled"), gte(matches.matchDate, nowIso)))
        .orderBy(matches.matchDate)
    : db.select().from(matches)
        .where(and(eq(matches.status, "scheduled"), gte(matches.matchDate, nowIso)))
        .orderBy(matches.matchDate));

  return allMatches.slice(offset, offset + limit);
}

export async function getAllMatches(league?: string) {
  const db = getDb();
  if (league) {
    return db.select().from(matches)
      .where(eq(matches.league, league))
      .orderBy(desc(matches.matchDate));
  }
  return db.select().from(matches).orderBy(desc(matches.matchDate));
}

export async function updateMatch(id: number, data: Partial<InsertMatch>) {
  const db = getDb();
  return db.update(matches).set(data).where(eq(matches.id, id));
}

export async function getCompletedMatches(league?: string) {
  const db = getDb();
  if (league) {
    return db.select().from(matches)
      .where(and(eq(matches.league, league), eq(matches.status, "finished")))
      .orderBy(desc(matches.matchDate));
  }
  return db.select().from(matches)
    .where(eq(matches.status, "finished"))
    .orderBy(desc(matches.matchDate));
}

export async function updateMatchResult(
  id: number,
  result: "home" | "draw" | "away",
  actualHomeScore: number,
  actualAwayScore: number
) {
  const db = getDb();
  return db.update(matches)
    .set({ actualResult: result, actualHomeScore, actualAwayScore, status: "finished" })
    .where(eq(matches.id, id));
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export async function upsertPrediction(prediction: InsertPrediction) {
  const db = getDb();
  const existing = (await db.select().from(predictions)
    .where(and(eq(predictions.userId, prediction.userId!), eq(predictions.matchId, prediction.matchId!))))[0];

  if (existing) {
    await db.update(predictions)
      .set({ prediction: prediction.prediction })
      .where(eq(predictions.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(predictions).values(prediction);
    return Number(result.lastInsertRowid);
  }
}

export async function getUserPredictions(userId: number) {
  const db = getDb();
  return db.select().from(predictions).where(eq(predictions.userId, userId));
}

export async function getMatchPredictions(matchId: number) {
  const db = getDb();
  return db.select().from(predictions).where(eq(predictions.matchId, matchId));
}

export async function updatePredictionResult(predictionId: number, points: number, isCorrect: boolean) {
  const db = getDb();
  return db.update(predictions)
    .set({ points, isCorrect })
    .where(eq(predictions.id, predictionId));
}

export async function getUserPredictionForMatch(userId: number, matchId: number) {
  const db = getDb();
  return (await db.select().from(predictions)
    .where(and(eq(predictions.userId, userId), eq(predictions.matchId, matchId))))[0] ?? null;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 50) {
  const db = getDb();
  return db.select({
    id: leaderboardScores.id,
    userId: leaderboardScores.userId,
    totalPoints: leaderboardScores.totalPoints,
    totalPredictions: leaderboardScores.totalPredictions,
    correctPredictions: leaderboardScores.correctPredictions,
    accuracyRate: leaderboardScores.accuracyRate,
    weeklyPoints: leaderboardScores.weeklyPoints,
    currentStreak: leaderboardScores.currentStreak,
    longestStreak: leaderboardScores.longestStreak,
    userName: users.name,
    userEmail: users.email,
  })
    .from(leaderboardScores)
    .leftJoin(users, eq(leaderboardScores.userId, users.id))
    .orderBy(desc(leaderboardScores.totalPoints))
    .limit(limit);
}

export async function upsertLeaderboardScore(score: Partial<LeaderboardScore> & { userId: number }) {
  const db = getDb();
  const existing = (await db.select().from(leaderboardScores)
    .where(eq(leaderboardScores.userId, score.userId)))[0];

  if (existing) {
    await db.update(leaderboardScores)
      .set(score)
      .where(eq(leaderboardScores.userId, score.userId));
  } else {
    await db.insert(leaderboardScores).values(score);
  }
}

export async function getLeaderboardScoreByUserId(userId: number) {
  const db = getDb();
  return (await db.select().from(leaderboardScores).where(eq(leaderboardScores.userId, userId)))[0] ?? null;
}

export async function updateLeaderboardScore(userId: number, points: number, isCorrect: boolean) {
  const db = getDb();
  const existing = (await db.select().from(leaderboardScores).where(eq(leaderboardScores.userId, userId)))[0];

  if (existing) {
    const newTotal = (existing.totalPoints ?? 0) + points;
    const newCorrect = (existing.correctPredictions ?? 0) + (isCorrect ? 1 : 0);
    const newPredictions = (existing.totalPredictions ?? 0) + 1;
    const newAccuracy = newPredictions > 0 ? (newCorrect / newPredictions) * 100 : 0;
    await db.update(leaderboardScores)
      .set({
        totalPoints: newTotal,
        totalPredictions: newPredictions,
        correctPredictions: newCorrect,
        accuracyRate: newAccuracy,
      })
      .where(eq(leaderboardScores.userId, userId));
  } else {
    await db.insert(leaderboardScores).values({
      userId,
      totalPoints: points,
      totalPredictions: 1,
      correctPredictions: isCorrect ? 1 : 0,
      accuracyRate: isCorrect ? 100 : 0,
    });
  }
}

export async function addBonusPoints(userId: number, points: number): Promise<void> {
  const existing = await getLeaderboardScoreByUserId(userId);
  if (existing) {
    await upsertLeaderboardScore({
      userId,
      totalPoints: (existing.totalPoints ?? 0) + points,
    });
  }
}

// ─── Notifications (legacy compatibility) ─────────────────────────────────────
// TODO: notifications table removed from schema. Stubbed to no-ops to keep
// dependent code compiling. Callers should be migrated to a new notification system.

export async function createNotification(_data: {
  userId: number;
  title: string;
  content?: string;
  type: string;
  relatedMatchId?: number;
}): Promise<void> {
  // no-op
}

export async function getUserNotifications(_userId: number) {
  return [] as Array<{
    id: number;
    userId: number;
    title: string;
    content: string | null;
    type: string;
    relatedMatchId: number | null;
    read: boolean;
    createdAt: string;
  }>;
}

// ─── Streaks (delegated to leaderboardScores) ─────────────────────────────────
// TODO: userStreaks table removed. Streak data now lives on leaderboardScores.

export async function getUserStreak(userId: number) {
  const score = await getLeaderboardScoreByUserId(userId);
  if (!score) return null;
  return {
    userId: score.userId,
    currentStreak: score.currentStreak ?? 0,
    bestStreak: score.longestStreak ?? 0,
    longestStreak: score.longestStreak ?? 0,
    lastCorrectAt: null as Date | null,
  };
}

export async function upsertUserStreak(streak: {
  userId: number;
  currentStreak?: number;
  bestStreak?: number;
  longestStreak?: number;
  lastCorrectAt?: Date | null;
}): Promise<void> {
  const longestStreak = streak.longestStreak ?? streak.bestStreak;
  await upsertLeaderboardScore({
    userId: streak.userId,
    ...(streak.currentStreak !== undefined ? { currentStreak: streak.currentStreak } : {}),
    ...(longestStreak !== undefined ? { longestStreak } : {}),
  });
}

// Aliases for compatibility
export const getUserLeaderboardScore = getLeaderboardScoreByUserId;
export const createMatch = insertMatch;
export const createPrediction = upsertPrediction;

// ─── Unused-import guard ──────────────────────────────────────────────────────
// `lte` is intentionally re-exported below for callers that previously imported
// it transitively. Mark as used to avoid TS6133.
void lte;
