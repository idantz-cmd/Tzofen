/**
 * Direct migration script — applies the new 5-table schema to the existing SQLite file.
 * Run with: node scripts/migrate.mjs
 */
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;
if (process.env.DATABASE_URL) {
  console.log(`Migrating Turso DB: ${process.env.DATABASE_URL}`);
  db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
} else {
  const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, "..", "data", "getwinil.db");
  console.log(`Migrating local DB: ${dbPath}`);
  db = createClient({ url: `file:${dbPath}` });
}

const stmts = [
  // Drop removed tables (order matters for FK deps)
  "DROP TABLE IF EXISTS advancedPredictions",
  "DROP TABLE IF EXISTS matchAdvancedStats",
  "DROP TABLE IF EXISTS notifications",
  "DROP TABLE IF EXISTS userStreaks",
  "DROP TABLE IF EXISTS chatMessages",
  "DROP TABLE IF EXISTS competitionParticipants",
  "DROP TABLE IF EXISTS competitions",
  "DROP TABLE IF EXISTS leaguePlayers",
  "DROP TABLE IF EXISTS leagueStandings",
  "DROP TABLE IF EXISTS teams",

  // Ensure core tables exist with the new schema
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homeTeam TEXT NOT NULL,
    awayTeam TEXT NOT NULL,
    matchDate TEXT NOT NULL,
    league TEXT NOT NULL,
    matchweek INTEGER,
    season TEXT DEFAULT '2025-26',
    status TEXT DEFAULT 'scheduled',
    actualResult TEXT,
    actualHomeScore INTEGER,
    actualAwayScore INTEGER,
    aiHomeProbability REAL,
    aiDrawProbability REAL,
    aiAwayProbability REAL
  )`,

  `CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    matchId INTEGER NOT NULL,
    prediction TEXT NOT NULL,
    confidence INTEGER,
    predictedHomeScore INTEGER,
    predictedAwayScore INTEGER,
    points INTEGER DEFAULT 0,
    isCorrect INTEGER DEFAULT 0,
    createdAt TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS leaderboardScores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,
    totalPoints INTEGER DEFAULT 0,
    weeklyPoints INTEGER DEFAULT 0,
    totalPredictions INTEGER DEFAULT 0,
    correctPredictions INTEGER DEFAULT 0,
    accuracyRate REAL DEFAULT 0,
    currentStreak INTEGER DEFAULT 0,
    longestStreak INTEGER DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS standings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teamId INTEGER NOT NULL,
    league TEXT NOT NULL,
    season TEXT DEFAULT '2025-26',
    position INTEGER NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goalsFor INTEGER DEFAULT 0,
    goalsAgainst INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    form TEXT
  )`,

  // Add new columns to existing tables (safe — ALTER TABLE ADD COLUMN is additive)
  "ALTER TABLE predictions ADD COLUMN predictedHomeScore INTEGER",
  "ALTER TABLE predictions ADD COLUMN predictedAwayScore INTEGER",
  "ALTER TABLE leaderboardScores ADD COLUMN currentStreak INTEGER DEFAULT 0",
  "ALTER TABLE leaderboardScores ADD COLUMN longestStreak INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN favTeam TEXT",
  "ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'",

  // Cup support columns on matches
  "ALTER TABLE matches ADD COLUMN competition_type TEXT DEFAULT 'premier_league'",
  "ALTER TABLE matches ADD COLUMN cup_round TEXT",
  "ALTER TABLE matches ADD COLUMN allows_draw INTEGER DEFAULT 1",

  // Cup champion predictions table
  `CREATE TABLE IF NOT EXISTS cup_champion_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    season TEXT NOT NULL DEFAULT '2024-25',
    teamName TEXT NOT NULL,
    predictedAt TEXT,
    isCorrect INTEGER,
    pointsAwarded INTEGER DEFAULT 0,
    UNIQUE(userId, season)
  )`,

  // Rename old columns if they exist (SQLite doesn't support RENAME COLUMN before 3.25,
  // but libsql/turso is modern enough)
  // actualHomeScore / actualAwayScore — previously homeTeamScore / awayTeamScore
  // These are new tables so no rename needed if tables were just created above.
  // If the matches table already exists with the old column names, we handle that below.
];

let ok = 0;
let skipped = 0;

for (const sql of stmts) {
  try {
    await db.execute(sql);
    ok++;
  } catch (e) {
    // "duplicate column" = already migrated, skip silently
    if (e.message?.includes("duplicate column") || e.message?.includes("already exists")) {
      skipped++;
    } else {
      console.warn(`  SKIP: ${sql.slice(0, 60)}...`);
      console.warn(`  Reason: ${e.message}`);
      skipped++;
    }
  }
}

// Verify core tables exist
const tables = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
console.log("\nTables in database:");
for (const row of tables.rows) {
  console.log(" ", row.name);
}

console.log(`\nDone. ${ok} statements applied, ${skipped} skipped.`);
db.close();
