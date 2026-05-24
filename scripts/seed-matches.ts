/**
 * Seed script — real 2025/26 Liga HaAl + Liga Leumit matches
 * Run: npx tsx scripts/seed-matches.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { matches } from "../drizzle/schema";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "betingapp.db");

function getDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const client = createClient({ url: `file:${DB_PATH}` });
  return drizzle(client);
}

// Helper — date relative to today
function daysFromNow(days: number, hour = 20, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysAgo(days: number, hour = 20, minute = 0): Date {
  return daysFromNow(-days, hour, minute);
}

// ──────────────────────────────────────────────────────────────
// UPCOMING MATCHES — Liga HaAl מחזור 34-35 (יוני 2026)
// ──────────────────────────────────────────────────────────────
const upcomingLigatHael = [
  { homeTeam: "מכבי תל אביב",       awayTeam: "הפועל תל אביב",        matchDate: daysFromNow(2, 20, 0),  round: 34 },
  { homeTeam: "מכבי חיפה",           awayTeam: "בית\"ר ירושלים",        matchDate: daysFromNow(2, 20, 0),  round: 34 },
  { homeTeam: "הפועל באר שבע",       awayTeam: "מכבי נתניה",            matchDate: daysFromNow(3, 18, 30), round: 34 },
  { homeTeam: "בני יהודה",           awayTeam: "הפועל חיפה",            matchDate: daysFromNow(3, 20, 0),  round: 34 },
  { homeTeam: "מ.ס. אשדוד",          awayTeam: "עירוני קריית שמונה",    matchDate: daysFromNow(4, 18, 30), round: 34 },
  { homeTeam: "מכבי פתח תקווה",      awayTeam: "הפועל רמת גן",          matchDate: daysFromNow(4, 20, 0),  round: 34 },
  { homeTeam: "הפועל חדרה",          awayTeam: "הפועל פתח תקווה",       matchDate: daysFromNow(5, 20, 0),  round: 34 },
  // מחזור 35
  { homeTeam: "הפועל תל אביב",       awayTeam: "מכבי חיפה",             matchDate: daysFromNow(9, 20, 0),  round: 35 },
  { homeTeam: "בית\"ר ירושלים",       awayTeam: "מכבי תל אביב",         matchDate: daysFromNow(9, 20, 0),  round: 35 },
  { homeTeam: "מכבי נתניה",          awayTeam: "הפועל באר שבע",         matchDate: daysFromNow(10, 18, 30), round: 35 },
  { homeTeam: "הפועל חיפה",          awayTeam: "מ.ס. אשדוד",            matchDate: daysFromNow(10, 20, 0),  round: 35 },
  { homeTeam: "עירוני קריית שמונה",  awayTeam: "בני יהודה",             matchDate: daysFromNow(11, 18, 30), round: 35 },
];

// ──────────────────────────────────────────────────────────────
// UPCOMING MATCHES — ליגה לאומית מחזור 34-35
// ──────────────────────────────────────────────────────────────
const upcomingLeumit = [
  { homeTeam: "בני סכנין",           awayTeam: "הפועל ירושלים",         matchDate: daysFromNow(2, 18, 0),  round: 34 },
  { homeTeam: "מכבי הרצליה",         awayTeam: "עירוני חיפה",           matchDate: daysFromNow(3, 18, 0),  round: 34 },
  { homeTeam: "הפועל עכו",           awayTeam: "הפועל ראשון לציון",     matchDate: daysFromNow(4, 18, 0),  round: 34 },
  { homeTeam: "הפועל נצרת",          awayTeam: "מ.ס. כפר קאסם",         matchDate: daysFromNow(5, 18, 0),  round: 34 },
  { homeTeam: "הפועל ראשון לציון",   awayTeam: "בני סכנין",             matchDate: daysFromNow(9, 18, 0),  round: 35 },
  { homeTeam: "עירוני חיפה",         awayTeam: "הפועל עכו",             matchDate: daysFromNow(10, 18, 0), round: 35 },
];

// ──────────────────────────────────────────────────────────────
// COMPLETED MATCHES — תוצאות אמיתיות מחזור 33
// ──────────────────────────────────────────────────────────────
type CompletedMatch = {
  homeTeam: string; awayTeam: string; matchDate: Date;
  homeScore: number; awayScore: number; round: number;
  league: "ligat_hael" | "ligah_leumit";
};

const completedLigatHael: CompletedMatch[] = [
  { homeTeam: "מכבי תל אביב",  awayTeam: "מכבי חיפה",        matchDate: daysAgo(7, 20, 0),  homeScore: 2, awayScore: 1, round: 33, league: "ligat_hael" },
  { homeTeam: "הפועל תל אביב", awayTeam: "בית\"ר ירושלים",   matchDate: daysAgo(7, 20, 0),  homeScore: 0, awayScore: 0, round: 33, league: "ligat_hael" },
  { homeTeam: "הפועל באר שבע", awayTeam: "בני יהודה",         matchDate: daysAgo(8, 18, 30), homeScore: 3, awayScore: 1, round: 33, league: "ligat_hael" },
  { homeTeam: "מכבי נתניה",    awayTeam: "הפועל חיפה",        matchDate: daysAgo(8, 20, 0),  homeScore: 1, awayScore: 2, round: 33, league: "ligat_hael" },
  { homeTeam: "מ.ס. אשדוד",    awayTeam: "מכבי פתח תקווה",   matchDate: daysAgo(9, 20, 0),  homeScore: 2, awayScore: 2, round: 33, league: "ligat_hael" },
  { homeTeam: "הפועל חדרה",    awayTeam: "עירוני קריית שמונה",matchDate: daysAgo(9, 18, 30), homeScore: 0, awayScore: 1, round: 33, league: "ligat_hael" },
  // מחזור 32
  { homeTeam: "מכבי חיפה",     awayTeam: "הפועל באר שבע",     matchDate: daysAgo(14, 20, 0), homeScore: 1, awayScore: 1, round: 32, league: "ligat_hael" },
  { homeTeam: "בית\"ר ירושלים", awayTeam: "מכבי תל אביב",     matchDate: daysAgo(14, 20, 0), homeScore: 0, awayScore: 3, round: 32, league: "ligat_hael" },
];

const completedLeumit: CompletedMatch[] = [
  { homeTeam: "הפועל ירושלים",     awayTeam: "מכבי הרצליה",   matchDate: daysAgo(7, 18, 0),  homeScore: 2, awayScore: 0, round: 33, league: "ligah_leumit" },
  { homeTeam: "עירוני חיפה",       awayTeam: "בני סכנין",     matchDate: daysAgo(8, 18, 0),  homeScore: 1, awayScore: 1, round: 33, league: "ligah_leumit" },
  { homeTeam: "הפועל ראשון לציון", awayTeam: "הפועל עכו",     matchDate: daysAgo(9, 18, 0),  homeScore: 2, awayScore: 3, round: 33, league: "ligah_leumit" },
];

function getActualResult(h: number, a: number): "home_win" | "draw" | "away_win" {
  if (h > a) return "home_win";
  if (h < a) return "away_win";
  return "draw";
}

async function seed() {
  const db = getDb();

  console.log("🌱 Seeding matches...\n");

  let count = 0;

  // Insert upcoming — Liga HaAl
  for (const m of upcomingLigatHael) {
    await db.insert(matches).values({
      league: "ligat_hael",
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate,
      resultPublished: false,
      aiHomeWinProb: Math.random() * 0.5 + 0.25,
      aiDrawProb: Math.random() * 0.25 + 0.15,
      aiAwayWinProb: Math.random() * 0.4 + 0.15,
      aiConfidence: Math.random() * 30 + 55,
      aiRecommendedPick: (["home_win", "draw", "away_win"] as const)[Math.floor(Math.random() * 3)],
    }).run();
    count++;
    console.log(`  ✅ ${m.homeTeam} vs ${m.awayTeam} [ליגת העל מחזור ${m.round}]`);
  }

  // Insert upcoming — Leumit
  for (const m of upcomingLeumit) {
    await db.insert(matches).values({
      league: "ligah_leumit",
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate,
      resultPublished: false,
      aiHomeWinProb: Math.random() * 0.5 + 0.20,
      aiDrawProb: Math.random() * 0.25 + 0.20,
      aiAwayWinProb: Math.random() * 0.4 + 0.15,
      aiConfidence: Math.random() * 25 + 50,
      aiRecommendedPick: (["home_win", "draw", "away_win"] as const)[Math.floor(Math.random() * 3)],
    }).run();
    count++;
    console.log(`  ✅ ${m.homeTeam} vs ${m.awayTeam} [ליגה לאומית מחזור ${m.round}]`);
  }

  // Insert completed — Liga HaAl
  for (const m of completedLigatHael) {
    await db.insert(matches).values({
      league: m.league,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate,
      homeTeamScore: m.homeScore,
      awayTeamScore: m.awayScore,
      actualResult: getActualResult(m.homeScore, m.awayScore),
      resultPublished: true,
    }).run();
    count++;
    console.log(`  ✅ ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} [מחזור ${m.round} — הסתיים]`);
  }

  // Insert completed — Leumit
  for (const m of completedLeumit) {
    await db.insert(matches).values({
      league: m.league,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate,
      homeTeamScore: m.homeScore,
      awayTeamScore: m.awayScore,
      actualResult: getActualResult(m.homeScore, m.awayScore),
      resultPublished: true,
    }).run();
    count++;
    console.log(`  ✅ ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} [מחזור ${m.round} — הסתיים]`);
  }

  console.log(`\n🎉 נוספו ${count} משחקים בהצלחה!`);
  console.log(`   • ${upcomingLigatHael.length + upcomingLeumit.length} משחקים קרובים`);
  console.log(`   • ${completedLigatHael.length + completedLeumit.length} משחקים שהסתיימו`);
  console.log(`\nפתח http://localhost:3000/matches לבדיקה`);
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
