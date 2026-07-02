import type { Request, Response } from "express";
import { importUpcomingFixtures } from "../services/fixtureSync";

/**
 * Scheduled-import endpoint (POST /api/scheduled/importMatches).
 * Imports upcoming fixtures from football.co.il via the shared fixtureSync
 * logic. Also runnable autonomously by the in-app cron (startFixtureSync).
 */
export async function importMatchesHandler(_req: Request, res: Response) {
  try {
    const result = await importUpcomingFixtures();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[importMatchesHandler] failed:", err);
    res.status(500).json({ error: "Fixture import failed", detail: String(err) });
  }
}
