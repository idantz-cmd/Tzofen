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
  stripeCustomerId: text('stripeCustomerId'),
  createdAt:    text('createdAt').default(new Date().toISOString()),
}, (table) => ({
  emailIdx: uniqueIndex('user_email_idx').on(table.email),
}));

// ─── Billing ──────────────────────────────────────────────────────────────────

// One row per Stripe subscription. The user's effective access tier is mirrored
// onto users.plan by the webhook handler; this table is the audit/source record.
export const subscriptions = sqliteTable('subscriptions', {
  id:                   integer('id').primaryKey({ autoIncrement: true }),
  userId:               integer('userId').notNull(),
  stripeSubscriptionId: text('stripeSubscriptionId').notNull(),
  stripeCustomerId:     text('stripeCustomerId').notNull(),
  plan:                 text('plan', { enum: ['pro', 'champion'] }).notNull(),
  status:               text('status', {
    enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'],
  }).notNull(),
  priceId:              text('priceId'),
  interval:             text('interval', { enum: ['month', 'year'] }),
  currentPeriodEnd:     text('currentPeriodEnd'),
  cancelAtPeriodEnd:    integer('cancelAtPeriodEnd', { mode: 'boolean' }).default(false),
  createdAt:            text('createdAt'),
  updatedAt:            text('updatedAt'),
}, (table) => ({
  stripeSubIdx: uniqueIndex('subs_stripe_sub_id').on(table.stripeSubscriptionId),
  userIdx:      index('subs_user_idx').on(table.userId),
}));

// Immutable ledger of payment events (invoices, refunds, failures) for the admin
// revenue dashboard. Amounts are stored in the currency's minor unit (agorot).
export const transactions = sqliteTable('transactions', {
  id:                    integer('id').primaryKey({ autoIncrement: true }),
  userId:                integer('userId'),
  stripeInvoiceId:       text('stripeInvoiceId'),
  stripePaymentIntentId: text('stripePaymentIntentId'),
  amount:                integer('amount').notNull(),
  currency:              text('currency').default('ils'),
  status:                text('status', { enum: ['paid', 'refunded', 'failed'] }).notNull(),
  description:           text('description'),
  invoiceUrl:            text('invoiceUrl'),
  createdAt:             text('createdAt'),
}, (table) => ({
  userIdx: index('txn_user_idx').on(table.userId),
}));

// Idempotency guard: every processed Stripe webhook event id is recorded so a
// retried delivery is a no-op.
export const webhookEvents = sqliteTable('webhook_events', {
  id:          text('id').primaryKey(),
  type:        text('type'),
  processedAt: text('processedAt'),
});

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
  // Cup / competition fields
  competitionType: text('competition_type', {
    enum: ['premier_league', 'national_league', 'state_cup'],
  }).default('premier_league'),
  cupRound: text('cup_round', {
    enum: ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'],
  }),
  allowsDraw: integer('allows_draw', { mode: 'boolean' }).default(true),
}, (table) => ({
  dateIdx:        index('match_date_idx').on(table.matchDate),
  statusIdx:      index('match_status_idx').on(table.status),
  weekIdx:        index('match_week_idx').on(table.matchweek, table.season),
  leagueIdx:      index('match_league_idx').on(table.league),
  compRoundIdx:   index('match_comp_round_idx').on(table.competitionType, table.cupRound),
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

export const cupChampionPredictions = sqliteTable('cup_champion_predictions', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  userId:        integer('userId').notNull(),
  season:        text('season').notNull().default('2024-25'),
  teamName:      text('teamName').notNull(),
  predictedAt:   text('predictedAt').default(new Date().toISOString()),
  isCorrect:     integer('isCorrect', { mode: 'boolean' }),
  pointsAwarded: integer('pointsAwarded').default(0),
}, (table) => ({
  userSeasonIdx: uniqueIndex('cup_champ_user_season').on(table.userId, table.season),
}));

// Per-team advanced prediction (goals, corners, yellow/red cards for home AND
// away separately). One row per (user, match); any field may be null if the
// user chose not to predict it.
export const advancedPredictions = sqliteTable('advanced_predictions', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  userId:          integer('userId').notNull(),
  matchId:         integer('matchId').notNull(),
  homeGoals:       integer('homeGoals'),
  awayGoals:       integer('awayGoals'),
  homeCorners:     integer('homeCorners'),
  awayCorners:     integer('awayCorners'),
  homeYellowCards: integer('homeYellowCards'),
  awayYellowCards: integer('awayYellowCards'),
  homeRedCards:    integer('homeRedCards'),
  awayRedCards:    integer('awayRedCards'),
  createdAt:       text('createdAt').default(new Date().toISOString()),
}, (table) => ({
  userMatchIdx: uniqueIndex('adv_pred_user_match').on(table.userId, table.matchId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;
export type LeaderboardScore = typeof leaderboardScores.$inferSelect;
export type Standing = typeof standings.$inferSelect;
export type CupChampionPrediction = typeof cupChampionPredictions.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type AdvancedPrediction = typeof advancedPredictions.$inferSelect;
export type InsertAdvancedPrediction = typeof advancedPredictions.$inferInsert;
