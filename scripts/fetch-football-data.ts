/**
 * Fetch real Liga HaAl + Liga Leumit data from API-Football (RapidAPI)
 *
 * Prerequisites:
 *   1. Go to https://rapidapi.com/api-sports/api/api-football
 *   2. Click "Subscribe to Test" → choose the FREE plan (100 req/day)
 *   3. Make sure RAPIDAPI_KEY is set in .env.local
 *
 * Run:
 *   npx tsx scripts/fetch-football-data.ts [options]
 *
 * Options:
 *   --season 2024          Fetch a specific season (default: current)
 *   --from-season 2016     Fetch all seasons from year to today
 *   --teams-only           Only update team logos
 *   --standings-only       Only update standings
 *   --dry-run              Preview what would be inserted (no DB writes)
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // fallback to .env
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import { matches, teams, leagueStandings } from "../drizzle/schema";
import fs from "fs";

// ── Config ─────────────────────────────────────────────────────────────────
// Supports two modes:
//   1. Direct: set APISPORTS_KEY in .env.local  (from dashboard.api-football.com)
//   2. RapidAPI: set RAPIDAPI_KEY in .env.local (from rapidapi.com)
const APISPORTS_KEY = process.env.APISPORTS_KEY ?? "";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";

const USE_DIRECT = !!APISPORTS_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Israeli league IDs on API-Football (api-sports.io)
const LEAGUES = {
  ligat_hael: 383,   // Ligat Ha'al — Israel Premier League
  ligah_leumit: 382, // Liga Leumit
} as const;

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "betingapp.db");

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (flag: string) => args.includes(flag);

const SEASON_ARG = getArg("--season");
const FROM_SEASON = getArg("--from-season");
const TEAMS_ONLY = hasFlag("--teams-only");
const STANDINGS_ONLY = hasFlag("--standings-only");
const DRY_RUN = hasFlag("--dry-run");

// Current season: if before July, it's the previous year
const currentYear = new Date().getFullYear();
const DEFAULT_SEASON = new Date().getMonth() < 6 ? currentYear - 1 : currentYear;
const SEASONS_TO_FETCH: number[] = FROM_SEASON
  ? Array.from({ length: currentYear - parseInt(FROM_SEASON) + 1 }, (_, i) => parseInt(FROM_SEASON) + i)
  : [parseInt(SEASON_ARG ?? String(DEFAULT_SEASON))];

// ── DB ──────────────────────────────────────────────────────────────────────
function getDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const client = createClient({ url: `file:${DB_PATH}` });
  return drizzle(client);
}

// ── API helpers ─────────────────────────────────────────────────────────────
async function apiGet<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const headers: Record<string, string> = USE_DIRECT
    ? { "x-apisports-key": APISPORTS_KEY }
    : { "X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com" };

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${endpoint} → ${res.status}: ${body}`);
  }

  const json = await res.json() as { response: T; errors: Record<string, string> };
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API error: ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

// Free plan = 10 req/min → wait 7s between each call
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
const RATE_DELAY = 7000;

// ── Result helpers ───────────────────────────────────────────────────────────
function toResult(home: number, away: number): "home_win" | "draw" | "away_win" {
  if (home > away) return "home_win";
  if (home < away) return "away_win";
  return "draw";
}

// ── Fetch teams + logos ──────────────────────────────────────────────────────
async function fetchTeams(leagueKey: keyof typeof LEAGUES, season: number) {
  const leagueId = LEAGUES[leagueKey];
  console.log(`\n📦 Teams — ${leagueKey} ${season}...`);

  type TeamResponse = { team: { id: number; name: string; logo: string }; venue: { city: string } }[];
  const data = await apiGet<TeamResponse>("teams", { league: leagueId, season });

  if (!DRY_RUN) {
    const db = getDb();
    for (const { team, venue } of data) {
      const existing = await db.select().from(teams).where(eq(teams.externalId, team.id)).limit(1);
      if (existing.length > 0) {
        await db.update(teams)
          .set({ logoUrl: team.logo, hebrewName: team.name, city: venue?.city ?? null })
          .where(eq(teams.externalId, team.id));
      } else {
        await db.insert(teams).values({
          externalId: team.id,
          name: team.name,
          hebrewName: team.name,
          logoUrl: team.logo,
          city: venue?.city ?? null,
          league: leagueKey,
          season: String(season),
        });
      }
      console.log(`  ✅ ${team.name} (id:${team.id}) — logo saved`);
    }
  } else {
    console.log(`  [DRY RUN] Would upsert ${data.length} teams`);
  }

  return data;
}

// ── Fetch standings ──────────────────────────────────────────────────────────
async function fetchStandings(leagueKey: keyof typeof LEAGUES, season: number) {
  const leagueId = LEAGUES[leagueKey];
  console.log(`\n📊 Standings — ${leagueKey} ${season}...`);

  type StandingGroup = { league: { standings: { rank: number; team: { id: number; name: string; logo: string }; all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }; goalsDiff: number; points: number; form: string }[][] } };
  const data = await apiGet<StandingGroup[]>("standings", { league: leagueId, season });

  const table = data[0]?.league?.standings?.[0];
  if (!table) { console.log("  ⚠️ No standings data"); return; }

  if (!DRY_RUN) {
    const db = getDb();
    // Clear existing for this league+season
    // (no bulk delete in drizzle-libsql — do it row by row or via raw)
    for (const row of table) {
      const existing = await db.select().from(leagueStandings)
        .where(and(eq(leagueStandings.externalTeamId, row.team.id), eq(leagueStandings.season, String(season))))
        .limit(1);

      const values = {
        externalTeamId: row.team.id,
        teamName: row.team.name,
        teamLogo: row.team.logo,
        league: leagueKey,
        season: String(season),
        position: row.rank,
        played: row.all.played,
        won: row.all.win,
        drawn: row.all.draw,
        lost: row.all.lose,
        goalsFor: row.all.goals.for,
        goalsAgainst: row.all.goals.against,
        goalDifference: row.goalsDiff,
        points: row.points,
        form: row.form ?? null,
      };

      if (existing.length > 0) {
        await db.update(leagueStandings).set(values).where(eq(leagueStandings.id, existing[0].id));
      } else {
        await db.insert(leagueStandings).values(values);
      }
      console.log(`  ${row.rank}. ${row.team.name} — ${row.points}pts`);
    }
  } else {
    console.log(`  [DRY RUN] Would upsert ${table.length} standings rows`);
  }
}

// ── Fetch fixtures (matches + results) ─────────────────────────────────────
async function fetchFixtures(leagueKey: keyof typeof LEAGUES, season: number) {
  const leagueId = LEAGUES[leagueKey];
  console.log(`\n⚽ Fixtures — ${leagueKey} ${season}...`);

  type Fixture = {
    fixture: { id: number; date: string; status: { short: string } };
    league: { round: string };
    teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
    goals: { home: number | null; away: number | null };
    score: { fulltime: { home: number | null; away: number | null } };
  };
  const data = await apiGet<Fixture[]>("fixtures", { league: leagueId, season });
  console.log(`  Found ${data.length} fixtures`);

  if (!DRY_RUN) {
    const db = getDb();
    let inserted = 0, updated = 0, skipped = 0;

    for (const f of data) {
      const matchDate = new Date(f.fixture.date);
      const statusShort = f.fixture.status.short;
      const isFinished = ["FT", "AET", "PEN"].includes(statusShort);
      const isCancelled = ["CANC", "SUSP", "ABD", "WO"].includes(statusShort);
      if (isCancelled) { skipped++; continue; }

      const homeScore = f.score.fulltime.home ?? f.goals.home ?? null;
      const awayScore = f.score.fulltime.away ?? f.goals.away ?? null;

      // Parse round number from "Regular Season - 12" → 12
      const roundMatch = f.league.round.match(/\d+/);
      const round = roundMatch ? parseInt(roundMatch[0]) : null;

      // Check if already exists (by externalId)
      const existing = await db.select().from(matches).where(eq(matches.externalId, f.fixture.id)).limit(1);

      const values = {
        league: leagueKey,
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeTeamLogo: f.teams.home.logo,
        awayTeamLogo: f.teams.away.logo,
        matchDate,
        round,
        externalId: f.fixture.id,
        resultPublished: isFinished,
        homeTeamScore: isFinished ? (homeScore ?? null) : null,
        awayTeamScore: isFinished ? (awayScore ?? null) : null,
        actualResult: isFinished && homeScore !== null && awayScore !== null
          ? toResult(homeScore, awayScore)
          : null,
      };

      if (existing.length > 0) {
        await db.update(matches).set(values).where(eq(matches.id, existing[0].id));
        updated++;
      } else {
        await db.insert(matches).values(values as any);
        inserted++;
      }
    }
    console.log(`  ✅ Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
  } else {
    const finished = data.filter(f => ["FT", "AET", "PEN"].includes(f.fixture.status.short));
    console.log(`  [DRY RUN] Would insert/update ${data.length} fixtures (${finished.length} completed)`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!APISPORTS_KEY && !RAPIDAPI_KEY) {
    console.error("❌ No API key found. Add one of these to .env.local:");
    console.error("   APISPORTS_KEY=xxx   ← from https://dashboard.api-football.com/register (recommended, free)");
    console.error("   RAPIDAPI_KEY=xxx    ← from RapidAPI after subscribing to API-Football");
    process.exit(1);
  }
  console.log(`   Mode    : ${USE_DIRECT ? "Direct (api-sports.io)" : "RapidAPI"}`);

  console.log("🚀 BetingApp Football Data Fetcher");
  console.log(`   Seasons : ${SEASONS_TO_FETCH.join(", ")}`);
  console.log(`   Leagues : ligat_hael (${LEAGUES.ligat_hael}), ligah_leumit (${LEAGUES.ligah_leumit})`);
  console.log(`   Dry run : ${DRY_RUN}`);
  if (DRY_RUN) console.log("\n⚠️  DRY RUN — no database writes\n");

  for (const season of SEASONS_TO_FETCH) {
    for (const leagueKey of Object.keys(LEAGUES) as (keyof typeof LEAGUES)[]) {
      try {
        if (!STANDINGS_ONLY) await fetchTeams(leagueKey, season);
        await sleep(RATE_DELAY);

        if (!TEAMS_ONLY) await fetchStandings(leagueKey, season);
        await sleep(RATE_DELAY);

        if (!TEAMS_ONLY && !STANDINGS_ONLY) await fetchFixtures(leagueKey, season);
        await sleep(RATE_DELAY);
      } catch (err: any) {
        console.error(`\n❌ ${leagueKey} ${season}: ${err.message}`);
        if (err.message.includes("not subscribed")) {
          console.error("\n👉 Subscribe at: https://rapidapi.com/api-sports/api/api-football");
          process.exit(1);
        }
      }
    }
  }

  console.log("\n🎉 Done!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
