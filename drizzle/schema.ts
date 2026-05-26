import {
  sqliteTable, text, integer, real, index, uniqueIndex
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role:         text('role', { enum: ['user', 'admin'] }).default('user'),
  favTeam:      text('favTeam'),
  plan:         text('plan', { enum: ['free', 'pro', 'champion'] }).default('free'),
  createdAt:    text('createdAt').default(new Date().toISOString()),
}, (table) => ({
  emailIdx: uniqueIndex('user_email_idx').on(table.email),
}));

export const matches = sqliteTable('matches', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  homeTeam:        text('homeTeam').notNull(),
  awayTeam:        text('awayTeam').notNull(),
  matchDate:       text('matchDate').notNull(),
  league:          text('league').notNull(),
  matchweek:       integer('matchweek'),
  season:          text('season').default('2025-26'),
  status:          text('status', { enum: ['scheduled', 'live', 'finished'] }).default('scheduled'),
  actualResult:    text('actualResult', { enum: ['home', 'draw', 'away'] }),
  actualHomeScore: integer('actualHomeScore'),
  actualAwayScore: integer('actualAwayScore'),
  aiHomeProbability: real('aiHomeProbability'),
  aiDrawProbability: real('aiDrawProbability'),
  aiAwayProbability: real('aiAwayProbability'),
}, (table) => ({
  dateIdx:   index('match_date_idx').on(table.matchDate),
  statusIdx: index('match_status_idx').on(table.status),
  weekIdx:   index('match_week_idx').on(table.matchweek, table.season),
  leagueIdx: index('match_league_idx').on(table.league),
}));

export const predictions = sqliteTable('predictions', {
  id:                 integer('id').primaryKey({ autoIncrement: true }),
  userId:             integer('userId').notNull(),
  matchId:            integer('matchId').notNull(),
  prediction:         text('prediction', { enum: ['home', 'draw', 'away'] }).notNull(),
  confidence:         integer('confidence'),
  predictedHomeScore: integer('predictedHomeScore'),
  predictedAwayScore: integer('predictedAwayScore'),
  points:             integer('points').default(0),
  isCorrect:          integer('isCorrect', { mode: 'boolean' }).default(false),
  createdAt:          text('createdAt').default(new Date().toISOString()),
}, (table) => ({
  userIdx:    index('pred_user_idx').on(table.userId),
  matchIdx:   index('pred_match_idx').on(table.matchId),
  uniquePred: uniqueIndex('pred_unique').on(table.userId, table.matchId),
}));

export const leaderboardScores = sqliteTable('leaderboardScores', {
  id:                 integer('id').primaryKey({ autoIncrement: true }),
  userId:             integer('userId').notNull().unique(),
  totalPoints:        integer('totalPoints').default(0),
  weeklyPoints:       integer('weeklyPoints').default(0),
  totalPredictions:   integer('totalPredictions').default(0),
  correctPredictions: integer('correctPredictions').default(0),
  accuracyRate:       real('accuracyRate').default(0),
  currentStreak:      integer('currentStreak').default(0),
  longestStreak:      integer('longestStreak').default(0),
}, (table) => ({
  pointsIdx: index('lb_points_idx').on(table.totalPoints),
  weeklyIdx: index('lb_weekly_idx').on(table.weeklyPoints),
  userIdx:   index('lb_user_idx').on(table.userId),
}));

export const standings = sqliteTable('standings', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  teamId:       integer('teamId').notNull(),
  league:       text('league').notNull(),
  season:       text('season').default('2025-26'),
  position:     integer('position').notNull(),
  played:       integer('played').default(0),
  won:          integer('won').default(0),
  drawn:        integer('drawn').default(0),
  lost:         integer('lost').default(0),
  goalsFor:     integer('goalsFor').default(0),
  goalsAgainst: integer('goalsAgainst').default(0),
  points:       integer('points').default(0),
  form:         text('form'),
}, (table) => ({
  leagueSeasonIdx: index('std_league_season_idx').on(table.league, table.season),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;
export type LeaderboardScore = typeof leaderboardScores.$inferSelect;
export type Standing = typeof standings.$inferSelect;
