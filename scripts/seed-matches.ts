/**
 * Seed upcoming + recent matches into the local SQLite DB.
 * Run: npx tsx scripts/seed-matches.ts
 *
 * Strategy:
 *   1. Try live football.co.il scraper for upcoming fixtures
 *   2. Fall back to hardcoded 2025-26 season fixtures if scraper fails/empty
 *   Always inserts a set of recently-finished matches for the results tab.
 */
import "dotenv/config";
import path from "path";
import fs from "fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import { matches } from "../drizzle/schema";
import { fetchUpcomingFixtures } from "../server/services/footballApi";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "tzofen.db");
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const client = createClient({ url: `file:${DB_PATH}` });
const db = drizzle(client);

// ── Date helpers ───────────────────────────────────────────────────────────────
function fromNow(days: number, hour = 20, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}
function ago(days: number, hour = 20, min = 0) { return fromNow(-days, hour, min); }

// ── Hardcoded fallback — upcoming (2025-26 playoffs, June 2026) ────────────────
const UPCOMING_HAEL = [
  { homeTeam: "מכבי תל אביב",       awayTeam: "הפועל תל אביב",        matchDate: fromNow(2, 20, 0),   week: 36 },
  { homeTeam: "מכבי חיפה",           awayTeam: 'בית"ר ירושלים',        matchDate: fromNow(2, 22, 0),   week: 36 },
  { homeTeam: "הפועל באר שבע",       awayTeam: "מכבי נתניה",            matchDate: fromNow(3, 19, 30),  week: 36 },
  { homeTeam: "בני יהודה",           awayTeam: "הפועל חיפה",            matchDate: fromNow(3, 21, 30),  week: 36 },
  { homeTeam: "מ.ס. אשדוד",          awayTeam: "עירוני קריית שמונה",    matchDate: fromNow(4, 19, 0),   week: 36 },
  { homeTeam: "מכבי פתח תקווה",      awayTeam: "הפועל חדרה",            matchDate: fromNow(4, 21, 0),   week: 36 },
  { homeTeam: "הפועל תל אביב",       awayTeam: "מכבי חיפה",             matchDate: fromNow(9, 20, 0),   week: 37 },
  { homeTeam: 'בית"ר ירושלים',       awayTeam: "מכבי תל אביב",         matchDate: fromNow(9, 22, 0),   week: 37 },
  { homeTeam: "מכבי נתניה",          awayTeam: "הפועל באר שבע",         matchDate: fromNow(10, 19, 30), week: 37 },
  { homeTeam: "הפועל חיפה",          awayTeam: "מ.ס. אשדוד",            matchDate: fromNow(10, 21, 30), week: 37 },
  { homeTeam: "עירוני קריית שמונה",  awayTeam: "בני יהודה",             matchDate: fromNow(11, 19, 0),  week: 37 },
  { homeTeam: "הפועל חדרה",          awayTeam: "מכבי פתח תקווה",        matchDate: fromNow(11, 21, 0),  week: 37 },
  // מחזור 38 — כל המשחקים בו-זמנית
  { homeTeam: "מכבי תל אביב",       awayTeam: "מכבי נתניה",            matchDate: fromNow(16, 21, 0),  week: 38 },
  { homeTeam: "הפועל באר שבע",       awayTeam: "הפועל תל אביב",         matchDate: fromNow(16, 21, 0),  week: 38 },
  { homeTeam: "מכבי חיפה",           awayTeam: "עירוני קריית שמונה",    matchDate: fromNow(16, 21, 0),  week: 38 },
  { homeTeam: 'בית"ר ירושלים',       awayTeam: "הפועל חיפה",            matchDate: fromNow(16, 21, 0),  week: 38 },
  { homeTeam: "בני יהודה",           awayTeam: "מכבי פתח תקווה",        matchDate: fromNow(16, 21, 0),  week: 38 },
  { homeTeam: "מ.ס. אשדוד",          awayTeam: "הפועל חדרה",            matchDate: fromNow(16, 21, 0),  week: 38 },
];

const UPCOMING_LEUMIT = [
  { homeTeam: "בני סכנין",           awayTeam: "הפועל ירושלים",         matchDate: fromNow(2, 18, 0),   week: 36 },
  { homeTeam: "מכבי הרצליה",         awayTeam: "עירוני חיפה",           matchDate: fromNow(3, 18, 0),   week: 36 },
  { homeTeam: "הפועל עכו",           awayTeam: "הפועל ראשון לציון",     matchDate: fromNow(4, 18, 0),   week: 36 },
  { homeTeam: "הפועל ראשון לציון",   awayTeam: "בני סכנין",             matchDate: fromNow(9, 18, 0),   week: 37 },
  { homeTeam: "עירוני חיפה",         awayTeam: "הפועל עכו",             matchDate: fromNow(10, 18, 0),  week: 37 },
];

// ── Finished matches — always insert for results tab ──────────────────────────
const FINISHED: Array<{
  homeTeam: string; awayTeam: string; matchDate: string;
  homeScore: number; awayScore: number;
  league: "ligat_hael" | "ligah_leumit"; week: number;
}> = [
  { homeTeam: "מכבי תל אביב",   awayTeam: "מכבי חיפה",         matchDate: ago(7, 20, 0),   homeScore: 2, awayScore: 1, league: "ligat_hael",   week: 35 },
  { homeTeam: "הפועל תל אביב",  awayTeam: 'בית"ר ירושלים',     matchDate: ago(7, 22, 0),   homeScore: 0, awayScore: 0, league: "ligat_hael",   week: 35 },
  { homeTeam: "הפועל באר שבע",  awayTeam: "בני יהודה",          matchDate: ago(8, 19, 30),  homeScore: 3, awayScore: 1, league: "ligat_hael",   week: 35 },
  { homeTeam: "מכבי נתניה",     awayTeam: "הפועל חיפה",         matchDate: ago(8, 21, 30),  homeScore: 1, awayScore: 2, league: "ligat_hael",   week: 35 },
  { homeTeam: "מ.ס. אשדוד",     awayTeam: "מכבי פתח תקווה",    matchDate: ago(9, 19, 0),   homeScore: 2, awayScore: 2, league: "ligat_hael",   week: 35 },
  { homeTeam: "עירוני קריית שמונה", awayTeam: "הפועל חדרה",     matchDate: ago(9, 21, 0),   homeScore: 1, awayScore: 0, league: "ligat_hael",   week: 35 },
  { homeTeam: "מכבי חיפה",      awayTeam: "הפועל באר שבע",     matchDate: ago(14, 20, 0),  homeScore: 1, awayScore: 1, league: "ligat_hael",   week: 34 },
  { homeTeam: 'בית"ר ירושלים', awayTeam: "מכבי תל אביב",      matchDate: ago(14, 22, 0),  homeScore: 0, awayScore: 3, league: "ligat_hael",   week: 34 },
  { homeTeam: "הפועל ירושלים",  awayTeam: "מכבי הרצליה",       matchDate: ago(7, 18, 0),   homeScore: 2, awayScore: 0, league: "ligah_leumit", week: 35 },
  { homeTeam: "עירוני חיפה",    awayTeam: "בני סכנין",          matchDate: ago(8, 18, 0),   homeScore: 1, awayScore: 1, league: "ligah_leumit", week: 35 },
  { homeTeam: "הפועל ראשון לציון", awayTeam: "הפועל עכו",      matchDate: ago(9, 18, 0),   homeScore: 2, awayScore: 3, league: "ligah_leumit", week: 35 },
];

// ── Dedup check ────────────────────────────────────────────────────────────────
async function exists(league: string, homeTeam: string, awayTeam: string, matchDate: string) {
  const rows = await db.select().from(matches)
    .where(and(eq(matches.league, league), eq(matches.homeTeam, homeTeam), eq(matches.awayTeam, awayTeam), eq(matches.matchDate, matchDate)))
    .limit(1);
  return rows.length > 0;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🌱 Seeding into ${DB_PATH}\n`);
  let created = 0, skipped = 0;

  // 1. Try live scraper
  let liveUpcoming: typeof UPCOMING_HAEL | null = null;
  try {
    process.stdout.write("🔄 Fetching football.co.il...");
    const scraped = await fetchUpcomingFixtures();
    if (scraped.length > 0) {
      liveUpcoming = scraped.map(m => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchDate: m.matchDate instanceof Date ? m.matchDate.toISOString() : String(m.matchDate),
        week: 0,
        league: m.league,
      }));
      console.log(` ✅ ${scraped.length} matches found (live)`);
    } else {
      console.log(" ⚠️  0 results — using fallback");
    }
  } catch (e: any) {
    console.log(` ⚠️  ${e.message} — using fallback`);
  }

  // 2. Insert upcoming
  const upcomingRows = liveUpcoming ?? [
    ...UPCOMING_HAEL.map(m => ({ ...m, league: "ligat_hael" as const })),
    ...UPCOMING_LEUMIT.map(m => ({ ...m, league: "ligah_leumit" as const })),
  ];

  console.log("\n📅 Upcoming:");
  for (const m of upcomingRows) {
    if (await exists(m.league, m.homeTeam, m.awayTeam, m.matchDate)) { skipped++; continue; }
    await db.insert(matches).values({
      league: m.league,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate,
      status: "scheduled",
      season: "2025-26",
      ...(m.week ? { matchweek: m.week } : {}),
    });
    console.log(`  ✅ ${m.homeTeam} vs ${m.awayTeam}`);
    created++;
  }

  // 3. Insert finished
  console.log("\n🏁 Finished:");
  for (const m of FINISHED) {
    if (await exists(m.league, m.homeTeam, m.awayTeam, m.matchDate)) { skipped++; continue; }
    const result: "home" | "draw" | "away" =
      m.homeScore > m.awayScore ? "home" :
      m.homeScore < m.awayScore ? "away" : "draw";
    await db.insert(matches).values({
      league: m.league,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.matchDate,
      status: "finished",
      season: "2025-26",
      matchweek: m.week,
      actualResult: result,
      actualHomeScore: m.homeScore,
      actualAwayScore: m.awayScore,
    });
    console.log(`  ✅ ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`);
    created++;
  }

  console.log(`\n🎉 Done! Created ${created} | Skipped ${skipped} (already existed)`);
  console.log("   → http://localhost:3000/matches\n");
  process.exit(0);
}

seed().catch(e => { console.error("❌", e); process.exit(1); });
