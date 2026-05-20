/**
 * Scheduled Import Handler
 * 
 * Heartbeat callback at /api/scheduled/importMatches
 * Runs periodically to:
 * 1. Import upcoming fixtures (next 14 days) from football.co.il
 * 2. Update results for recently finished matches
 * 3. Import advanced stats for finished matches (best-effort)
 */
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { matches, matchAdvancedStats } from "../../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  fetchUpcomingFixtures,
  fetchRecentlyFinished,
  fetchMatchStats,
} from "../services/footballApi";
import { publishMatchResult } from "../services/publishResult";

export async function importMatchesHandler(req: Request, res: Response) {
  try {
    // Authenticate - must be an admin
    const user = await sdk.authenticateRequest(req);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "admin-only" });
    }

    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const results = {
      upcomingCreated: 0,
      upcomingSkipped: 0,
      resultsUpdated: 0,
      statsImported: 0,
      errors: [] as string[],
    };

    // Step 1: Import upcoming fixtures from football.co.il
    try {
      const upcoming = await fetchUpcomingFixtures();
      for (const match of upcoming) {
        const existing = await db.select()
          .from(matches)
          .where(eq(matches.externalId, match.externalId))
          .limit(1);

        if (existing.length > 0) {
          results.upcomingSkipped++;
          continue;
        }

        await db.insert(matches).values({
          league: match.league,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          matchDate: match.matchDate,
          homeTeamLogo: match.homeTeamLogo,
          awayTeamLogo: match.awayTeamLogo,
          externalId: match.externalId,
        });
        results.upcomingCreated++;
      }
    } catch (error: any) {
      results.errors.push(`Upcoming import: ${error.message}`);
    }

    // Step 2: Update results for recently finished matches (with full scoring)
    try {
      const finished = await fetchRecentlyFinished();
      for (const match of finished) {
        if (!match.actualResult) continue;

        const existing = await db.select()
          .from(matches)
          .where(
            and(
              eq(matches.externalId, match.externalId),
              isNull(matches.actualResult)
            )
          )
          .limit(1);

        if (existing.length === 0) continue;

        // Use the shared publish workflow
        try {
          await publishMatchResult({
            matchId: existing[0].id,
            homeScore: match.homeTeamScore!,
            awayScore: match.awayTeamScore!,
          });
          results.resultsUpdated++;
        } catch (pubErr: any) {
          results.errors.push(`Publish match ${existing[0].id}: ${pubErr.message}`);
        }
      }
    } catch (error: any) {
      results.errors.push(`Results import: ${error.message}`);
    }

    // Step 3: Import advanced stats for matches with results but no stats (best-effort)
    try {
      const matchesWithResults = await db.select()
        .from(matches)
        .where(eq(matches.resultPublished, true));

      for (const match of matchesWithResults) {
        if (!match.externalId) continue;

        // Check if stats already exist
        const existingStats = await db.select()
          .from(matchAdvancedStats)
          .where(eq(matchAdvancedStats.matchId, match.id))
          .limit(1);

        if (existingStats.length > 0) continue;

        try {
          const stats = await fetchMatchStats(match.externalId);
          if (!stats) continue;
          // Only save if we got meaningful data
          if (stats.totalCorners === 0 && stats.totalYellowCards === 0 && stats.totalRedCards === 0) continue;

          const totalGoals = (match.homeTeamScore || 0) + (match.awayTeamScore || 0);

          await db.insert(matchAdvancedStats).values({
            matchId: match.id,
            totalGoals,
            totalCorners: stats.totalCorners,
            totalYellowCards: stats.totalYellowCards,
            totalRedCards: stats.totalRedCards,
          });
          results.statsImported++;
        } catch {
          // Skip individual match stats failures silently
        }
      }
    } catch (error: any) {
      results.errors.push(`Stats import: ${error.message}`);
    }

    console.log("[Scheduled Import]", JSON.stringify(results));
    res.json({ ok: true, ...results });
  } catch (error: any) {
    console.error("[Scheduled Import] Error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url, taskUid: (error as any).taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

