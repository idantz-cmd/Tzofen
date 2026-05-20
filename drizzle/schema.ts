import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  passwordHash: text("passwordHash"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  league: text("league", { enum: ["ligat_hael", "ligah_leumit"] }).notNull(),
  homeTeam: text("homeTeam").notNull(),
  awayTeam: text("awayTeam").notNull(),
  matchDate: integer("matchDate", { mode: "timestamp" }).notNull(),
  homeTeamLogo: text("homeTeamLogo"),
  awayTeamLogo: text("awayTeamLogo"),
  aiHomeWinProb: real("aiHomeWinProb"),
  aiDrawProb: real("aiDrawProb"),
  aiAwayWinProb: real("aiAwayWinProb"),
  aiRecommendedPick: text("aiRecommendedPick", { enum: ["home_win", "draw", "away_win"] }),
  aiReasoning: text("aiReasoning"),
  aiConfidence: real("aiConfidence"),
  actualResult: text("actualResult", { enum: ["home_win", "draw", "away_win"] }),
  homeTeamScore: integer("homeTeamScore"),
  awayTeamScore: integer("awayTeamScore"),
  resultPublished: integer("resultPublished", { mode: "boolean" }).default(false),
  externalId: integer("externalId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

export const predictions = sqliteTable("predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  matchId: integer("matchId").notNull(),
  prediction: text("prediction", { enum: ["home_win", "draw", "away_win"] }).notNull(),
  confidence: real("confidence"),
  points: integer("points").default(0),
  isCorrect: integer("isCorrect", { mode: "boolean" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

export const leaderboardScores = sqliteTable("leaderboardScores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  totalPoints: integer("totalPoints").default(0),
  totalPredictions: integer("totalPredictions").default(0),
  correctPredictions: integer("correctPredictions").default(0),
  accuracyRate: real("accuracyRate").default(0),
  weeklyPoints: integer("weeklyPoints").default(0),
  weeklyPredictions: integer("weeklyPredictions").default(0),
  lastUpdated: integer("lastUpdated", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type LeaderboardScore = typeof leaderboardScores.$inferSelect;
export type InsertLeaderboardScore = typeof leaderboardScores.$inferInsert;

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type", { enum: ["result_published", "score_updated", "match_reminder", "achievement"] }).notNull(),
  relatedMatchId: integer("relatedMatchId"),
  emailSent: integer("emailSent", { mode: "boolean" }).default(false),
  read: integer("read", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const advancedPredictions = sqliteTable("advancedPredictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  matchId: integer("matchId").notNull(),
  goalsOverUnder: text("goalsOverUnder", { enum: ["over", "under"] }),
  cornersOverUnder: text("cornersOverUnder", { enum: ["over", "under"] }),
  yellowCardsOverUnder: text("yellowCardsOverUnder", { enum: ["over", "under"] }),
  redCardInMatch: integer("redCardInMatch", { mode: "boolean" }),
  points: integer("points").default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type AdvancedPrediction = typeof advancedPredictions.$inferSelect;
export type InsertAdvancedPrediction = typeof advancedPredictions.$inferInsert;

export const matchAdvancedStats = sqliteTable("matchAdvancedStats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("matchId").notNull().unique(),
  totalGoals: integer("totalGoals"),
  totalCorners: integer("totalCorners"),
  totalYellowCards: integer("totalYellowCards"),
  totalRedCards: integer("totalRedCards"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type MatchAdvancedStats = typeof matchAdvancedStats.$inferSelect;
export type InsertMatchAdvancedStats = typeof matchAdvancedStats.$inferInsert;

export const competitions = sqliteTable("competitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["tournament", "head_to_head"] }).notNull(),
  creatorId: integer("creatorId").notNull(),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).default("active").notNull(),
  maxParticipants: integer("maxParticipants").default(50),
  startDate: integer("startDate", { mode: "timestamp" }),
  endDate: integer("endDate", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = typeof competitions.$inferInsert;

export const competitionParticipants = sqliteTable("competitionParticipants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  competitionId: integer("competitionId").notNull(),
  userId: integer("userId").notNull(),
  points: integer("points").default(0),
  rank: integer("rank"),
  joinedAt: integer("joinedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type CompetitionParticipant = typeof competitionParticipants.$inferSelect;
export type InsertCompetitionParticipant = typeof competitionParticipants.$inferInsert;

export const chatMessages = sqliteTable("chatMessages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: integer("senderId").notNull(),
  receiverId: integer("receiverId").notNull(),
  message: text("message").notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export const userStreaks = sqliteTable("userStreaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  currentStreak: integer("currentStreak").default(0),
  bestStreak: integer("bestStreak").default(0),
  lastCorrectAt: integer("lastCorrectAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = typeof userStreaks.$inferInsert;
