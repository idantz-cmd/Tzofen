import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, desc, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import {
  users, matches, predictions, leaderboardScores, notifications,
  userStreaks,
  type InsertUser, type InsertMatch, type InsertPrediction,
  type InsertLeaderboardScore, type InsertUserStreak,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const dir = path.dirname(ENV.databasePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const client = createClient({ url: `file:${ENV.databasePath}` });
    _db = drizzle(client);
  }
  return _db;
}

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function upsertUser(user: Partial<InsertUser> & { openId: string }): Promise<void> {
  const db = getDb();
  const existing = (await db.select().from(users).where(eq(users.openId, user.openId)))[0];

  if (existing) {
    const updateData: Partial<InsertUser> = { updatedAt: new Date() };
    if (user.name !== undefined) updateData.name = user.name;
    if (user.email !== undefined) updateData.email = user.email;
    if (user.passwordHash !== undefined) updateData.passwordHash = user.passwordHash;
    if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
    if (user.lastSignedIn !== undefined) updateData.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined) updateData.role = user.role;

    await db.update(users).set(updateData).where(eq(users.openId, user.openId));
  } else {
    await db.insert(users).values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      passwordHash: user.passwordHash ?? null,
      loginMethod: user.loginMethod ?? "email",
      role: user.role ?? "user",
      lastSignedIn: user.lastSignedIn ?? new Date(),
    });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDb();
  return (await db.select().from(users).where(eq(users.openId, openId)))[0] ?? null;
}

export async function getUserById(id: number) {
  const db = getDb();
  return (await db.select().from(users).where(eq(users.id, id)))[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  return (await db.select().from(users).where(eq(users.email, email)))[0] ?? null;
}

export async function getAllUsers() {
  const db = getDb();
  return db.select().from(users);
}

// â”€â”€â”€ Matches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  const now = new Date();
  const allMatches = await (league
    ? db.select().from(matches)
        .where(and(eq(matches.league, league as "ligat_hael" | "ligah_leumit"), eq(matches.resultPublished, false)))
        .orderBy(matches.matchDate)
    : db.select().from(matches)
        .where(eq(matches.resultPublished, false))
        .orderBy(matches.matchDate));

  return allMatches.filter(m => m.matchDate > now).slice(offset, offset + limit);
}

export async function getAllMatches(league?: string) {
  const db = getDb();
  if (league) {
    return db.select().from(matches)
      .where(eq(matches.league, league as "ligat_hael" | "ligah_leumit"))
      .orderBy(desc(matches.matchDate));
  }
  return db.select().from(matches).orderBy(desc(matches.matchDate));
}

export async function updateMatch(id: number, data: Partial<InsertMatch>) {
  const db = getDb();
  return db.update(matches).set({ ...data, updatedAt: new Date() }).where(eq(matches.id, id));
}

// â”€â”€â”€ Predictions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function upsertPrediction(prediction: InsertPrediction) {
  const db = getDb();
  const existing = (await db.select().from(predictions)
    .where(and(eq(predictions.userId, prediction.userId!), eq(predictions.matchId, prediction.matchId!))))[0];

  if (existing) {
    await db.update(predictions)
      .set({ prediction: prediction.prediction, updatedAt: new Date() })
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
    .set({ points, isCorrect, updatedAt: new Date() })
    .where(eq(predictions.id, predictionId));
}

// â”€â”€â”€ Leaderboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    userName: users.name,
    userEmail: users.email,
  })
    .from(leaderboardScores)
    .leftJoin(users, eq(leaderboardScores.userId, users.id))
    .orderBy(desc(leaderboardScores.totalPoints))
    .limit(limit);
}

export async function upsertLeaderboardScore(score: InsertLeaderboardScore) {
  const db = getDb();
  const existing = (await db.select().from(leaderboardScores)
    .where(eq(leaderboardScores.userId, score.userId!)))[0];

  if (existing) {
    await db.update(leaderboardScores)
      .set({ ...score, lastUpdated: new Date() })
      .where(eq(leaderboardScores.userId, score.userId!));
  } else {
    await db.insert(leaderboardScores).values(score);
  }
}

export async function getLeaderboardScoreByUserId(userId: number) {
  const db = getDb();
  return (await db.select().from(leaderboardScores).where(eq(leaderboardScores.userId, userId)))[0] ?? null;
}

// â”€â”€â”€ Streaks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getUserStreak(userId: number) {
  const db = getDb();
  return (await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)))[0] ?? null;
}

export async function upsertUserStreak(streak: InsertUserStreak) {
  const db = getDb();
  const existing = (await db.select().from(userStreaks).where(eq(userStreaks.userId, streak.userId!)))[0];

  if (existing) {
    await db.update(userStreaks)
      .set({ ...streak, updatedAt: new Date() })
      .where(eq(userStreaks.userId, streak.userId!));
  } else {
    await db.insert(userStreaks).values(streak);
  }
}

export async function updateMatchResult(
  id: number,
  result: "home_win" | "draw" | "away_win",
  homeTeamScore: number,
  awayTeamScore: number
) {
  const db = getDb();
  return db.update(matches)
    .set({ actualResult: result, homeTeamScore, awayTeamScore, resultPublished: true, updatedAt: new Date() })
    .where(eq(matches.id, id));
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
        lastUpdated: new Date(),
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

// Aliases for compatibility
export const getUserLeaderboardScore = getLeaderboardScoreByUserId;
export const createMatch = insertMatch;
export const createPrediction = upsertPrediction;

export async function getCompletedMatches(league?: string) {
  const db = getDb();
  if (league) {
    return db.select().from(matches)
      .where(and(eq(matches.league, league as "ligat_hael" | "ligah_leumit"), eq(matches.resultPublished, true)))
      .orderBy(desc(matches.matchDate));
  }
  return db.select().from(matches)
    .where(eq(matches.resultPublished, true))
    .orderBy(desc(matches.matchDate));
}

export async function getUserPredictionForMatch(userId: number, matchId: number) {
  const db = getDb();
  return (await db.select().from(predictions)
    .where(and(eq(predictions.userId, userId), eq(predictions.matchId, matchId))))[0] ?? null;
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

export async function createNotification(data: {
  userId: number;
  title: string;
  content?: string;
  type: "result_published" | "score_updated" | "match_reminder" | "achievement";
  relatedMatchId?: number;
}): Promise<void> {
  const db = getDb();
  await db.insert(notifications).values({
    userId: data.userId,
    title: data.title,
    content: data.content ?? null,
    type: data.type,
    relatedMatchId: data.relatedMatchId ?? null,
  });
}

// â”€â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getUserNotifications(userId: number) {
  const db = getDb();
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

