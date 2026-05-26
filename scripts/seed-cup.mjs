/**
 * Seeds demo Gvia HaMedina (State Cup) 2024-25 matches.
 * Run with: node scripts/seed-cup.mjs
 */
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, "..", "data", "getwinil.db");
const db = createClient({ url: `file:${dbPath}` });

const now = new Date();
const d = (daysFromNow, hour = 20) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + daysFromNow);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
};

const cup = [
  // Quarter-finals (upcoming)
  { homeTeam: "מכבי תל אביב", awayTeam: "הפועל באר שבע", matchDate: d(3), cupRound: "quarter_final", status: "scheduled" },
  { homeTeam: "מכבי חיפה", awayTeam: "הפועל תל אביב", matchDate: d(3, 22), cupRound: "quarter_final", status: "scheduled" },
  { homeTeam: "בני יהודה", awayTeam: "עירוני קריית שמונה", matchDate: d(5), cupRound: "quarter_final", status: "scheduled" },
  { homeTeam: "מכבי פתח תקווה", awayTeam: "הפועל חיפה", matchDate: d(5, 22), cupRound: "quarter_final", status: "scheduled" },

  // Round of 16 (past, finished)
  { homeTeam: "מכבי תל אביב", awayTeam: "מ.ס. אשדוד", matchDate: d(-14), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 3, actualAwayScore: 1 },
  { homeTeam: "הפועל באר שבע", awayTeam: "הפועל ירושלים", matchDate: d(-14, 22), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 2, actualAwayScore: 0 },
  { homeTeam: "מכבי חיפה", awayTeam: "עירוני נתניה", matchDate: d(-12), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 2, actualAwayScore: 1 },
  { homeTeam: "הפועל תל אביב", awayTeam: "אשדוד", matchDate: d(-12, 22), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 4, actualAwayScore: 0 },
  { homeTeam: "בני יהודה", awayTeam: "בית\"ר ירושלים", matchDate: d(-10), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 1, actualAwayScore: 0 },
  { homeTeam: "עירוני קריית שמונה", awayTeam: "סקציה נס ציונה", matchDate: d(-10, 22), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 2, actualAwayScore: 0 },
  { homeTeam: "מכבי פתח תקווה", awayTeam: "הפועל כפר שלם", matchDate: d(-8), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 3, actualAwayScore: 2 },
  { homeTeam: "הפועל חיפה", awayTeam: "הפועל כפר סבא", matchDate: d(-8, 22), cupRound: "round_of_16", status: "finished", actualResult: "home", actualHomeScore: 1, actualAwayScore: 0 },
];

let inserted = 0;
for (const m of cup) {
  await db.execute({
    sql: `INSERT INTO matches (homeTeam, awayTeam, matchDate, league, season, competition_type, cup_round, status, allows_draw, actualResult, actualHomeScore, actualAwayScore)
          VALUES (?, ?, ?, 'state_cup', '2024-25', 'state_cup', ?, ?, 0, ?, ?, ?)`,
    args: [
      m.homeTeam, m.awayTeam, m.matchDate, m.cupRound, m.status,
      m.actualResult ?? null, m.actualHomeScore ?? null, m.actualAwayScore ?? null,
    ],
  });
  inserted++;
}

console.log(`Seeded ${inserted} cup matches.`);
db.close();
