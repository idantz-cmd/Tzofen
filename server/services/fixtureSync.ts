/**
 * Fixture Sync — autonomous import of Israeli league fixtures from
 * football.co.il (the existing, reliable `gamesByDate` scraper).
 *
 * Runs on an in-app cron (every 6h) plus one run shortly after boot, so the
 * schedule and match dates stay current with no external scheduler and no
 * admin action required.
 *
 * Design guarantees:
 * - Additive & non-destructive: existing matches — including previous seasons
 *   and already-finished results — are never deleted or overwritten. Only
 *   upcoming (unplayed) fixtures are inserted.
 * - Accurate dates: an already-scheduled fixture whose kickoff was moved on
 *   football.co.il has its date corrected in place (dedup on the stable
 *   league+teams+season key), instead of creating a duplicate row.
 * - Results are NOT touched here — scoring/results are handled separately by
 *   resultsSync, per product decision.
 */
import cron from "node-cron";
import { getDb } from "../db";
import { matches } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { fetchAllIsraeliFixtures, type ImportedMatch } from "./footballApi";

function log(msg: string): void {
  console.log(`[FixtureSync ${new Date().toISOString()}] ${msg}`);
}

/**
 * Israeli football season label in the schema's 'YYYY-YY' format
 * (e.g. a kickoff on 2026-08-15 or 2027-03-01 → '2026-27'). The label rolls
 * over in July, ahead of the August start of play.
 */
export function seasonForDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1; // 1-12
  const start = m >= 7 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function toIso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : String(d);
}

export interface FixtureSyncResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

/**
 * Import all upcoming (unplayed) fixtures for both leagues from football.co.il.
 * Idempotent — safe to run repeatedly. Dedups on
 * (league, homeTeam, awayTeam, season): each pairing occurs once per season.
 */
export async function importUpcomingFixtures(): Promise<FixtureSyncResult> {
  const db = getDb();
  if (!db) throw new Error("Database not available");

  const all = await fetchAllIsraeliFixtures();
  // Keep only fixtures that haven't been played yet — we don't import results.
  const upcoming: ImportedMatch[] = all.filter((m) => !m.actualResult);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const m of upcoming) {
    const dateObj = m.matchDate instanceof Date ? m.matchDate : new Date(m.matchDate);
    const iso = toIso(m.matchDate);
    const season = seasonForDate(dateObj);

    const existing = (
      await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.league, m.league),
            eq(matches.homeTeam, m.homeTeam),
            eq(matches.awayTeam, m.awayTeam),
            eq(matches.season, season),
          ),
        )
        .limit(1)
    )[0];

    if (!existing) {
      await db.insert(matches).values({
        league: m.league,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchDate: iso,
        season,
        status: "scheduled",
      });
      created++;
      continue;
    }

    // Never touch a match that already has a result.
    if (existing.status === "finished") {
      skipped++;
      continue;
    }

    // Correct a rescheduled kickoff in place (no duplicate row).
    if (existing.matchDate !== iso) {
      await db.update(matches).set({ matchDate: iso }).where(eq(matches.id, existing.id));
      updated++;
    } else {
      skipped++;
    }
  }

  return { created, updated, skipped, total: upcoming.length };
}

/**
 * Start the autonomous fixture-sync cron (every 6 hours) plus one immediate
 * run on boot. Errors are logged, never thrown — a scrape failure must not take
 * the server down or block startup.
 */
export function startFixtureSync(): void {
  const run = async (trigger: string) => {
    try {
      const r = await importUpcomingFixtures();
      log(`${trigger}: created ${r.created}, updated ${r.updated}, skipped ${r.skipped} (of ${r.total})`);
    } catch (err) {
      log(`import failed: ${String(err)}`);
    }
  };

  cron.schedule("0 */6 * * *", () => { void run("cron"); });
  // Populate promptly on boot, in the background (don't block server start).
  void run("startup");
  log("Fixture sync cron started (every 6h + startup run)");
}
