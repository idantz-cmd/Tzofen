/**
 * Football Data Service â€” Scrapes football.co.il
 *
 * The scores page at https://www.football.co.il/scores/ embeds all season matches
 * in a server-rendered JavaScript variable called `gamesByDate`.
 * We extract it with a simple HTTP GET + regex parse â€” no API key needed.
 *
 * League IDs on football.co.il:
 *   902 = ×œ×™×’×ª Winner (Israeli Premier League)
 *   719 = ×œ×™×’×” ×œ××•×ž×™×ª (Liga Leumit)
 */

import * as cheerio from "cheerio";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type LeagueKey = "ligat_hael" | "ligah_leumit";

interface FootballCoIlTeam {
  id: number;
  name: string;
  hebrewName: string;
  logoUrl?: string;
}

interface FootballCoIlGame {
  id: number;
  instanceId: string;
  status: number | null; // 1 = upcoming, 3 = finished, null = TBD
  homeTeamId: FootballCoIlTeam;
  awayTeamId: FootballCoIlTeam;
  homeScore?: number;
  awayScore?: number;
  date: { sec: number; usec: number };
  hour?: string;
  round: number;
  stage: string;
  league: number; // 902 or 719
  season: string;
  stadiumId?: { hebrewName?: string };
}

export interface ImportedMatch {
  league: LeagueKey;
  homeTeam: string;
  awayTeam: string;
  matchDate: Date;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  externalId: number; // football.co.il game ID
  actualResult?: "home_win" | "draw" | "away_win";
  homeTeamScore?: number;
  awayTeamScore?: number;
}

export interface ImportedStats {
  externalId: number;
  totalGoals: number;
  totalCorners: number;
  totalYellowCards: number;
  totalRedCards: number;
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SCORES_URL = "https://www.football.co.il/scores/";
const GAME_URL = (id: number) => `https://www.football.co.il/game/${id}`;

const LEAGUE_MAP: Record<number, LeagueKey> = {
  902: "ligat_hael",
  719: "ligah_leumit",
};

// â”€â”€â”€ Core Scraper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Fetch the scores page and extract the `gamesByDate` variable.
 * Returns all games for the current season (both leagues, ~500+ games).
 */
async function fetchGamesByDate(): Promise<FootballCoIlGame[]> {
  const response = await fetch(SCORES_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch football.co.il scores page: ${response.status}`);
  }

  const html = await response.text();

  // Extract the gamesByDate variable from the inline script
  const regex = /var\s+gamesByDate\s*=\s*(\{[\s\S]*?\});[\s\n]*(?:var|let|const|function|\n\s*\n)/;
  const match = html.match(regex);

  if (!match) {
    // Try a more lenient regex
    const regex2 = /var\s+gamesByDate\s*=\s*(\{[\s\S]+?\});/;
    const match2 = html.match(regex2);
    if (!match2) {
      throw new Error("Could not find gamesByDate variable in the page source");
    }
    return parseGamesByDate(match2[1]);
  }

  return parseGamesByDate(match[1]);
}

function parseGamesByDate(jsonStr: string): FootballCoIlGame[] {
  try {
    const data = JSON.parse(jsonStr) as Record<string, FootballCoIlGame[]>;
    const allGames: FootballCoIlGame[] = [];
    for (const dateGames of Object.values(data)) {
      allGames.push(...dateGames);
    }
    return allGames;
  } catch (e: any) {
    throw new Error(`Failed to parse gamesByDate JSON: ${e.message}`);
  }
}

/**
 * Convert a football.co.il game object to our ImportedMatch format.
 */
function gameToImportedMatch(game: FootballCoIlGame): ImportedMatch {
  const leagueKey = LEAGUE_MAP[game.league];
  if (!leagueKey) {
    // Default to ligat_hael for unknown league IDs
    console.warn(`Unknown league ID: ${game.league}, defaulting to ligat_hael`);
  }

  const matchDate = new Date(game.date.sec * 1000);

  let actualResult: "home_win" | "draw" | "away_win" | undefined;
  if (game.status === 3 && game.homeScore !== undefined && game.awayScore !== undefined) {
    if (game.homeScore > game.awayScore) actualResult = "home_win";
    else if (game.homeScore < game.awayScore) actualResult = "away_win";
    else actualResult = "draw";
  }

  return {
    league: leagueKey || "ligat_hael",
    homeTeam: game.homeTeamId?.hebrewName || game.homeTeamId?.name || "Unknown",
    awayTeam: game.awayTeamId?.hebrewName || game.awayTeamId?.name || "Unknown",
    matchDate,
    homeTeamLogo: game.homeTeamId?.logoUrl || null,
    awayTeamLogo: game.awayTeamId?.logoUrl || null,
    externalId: game.id,
    ...(actualResult && {
      actualResult,
      homeTeamScore: game.homeScore,
      awayTeamScore: game.awayScore,
    }),
  };
}

// â”€â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Fetch all Israeli fixtures from football.co.il for the current season.
 */
export async function fetchAllIsraeliFixtures(options?: {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}): Promise<ImportedMatch[]> {
  const allGames = await fetchGamesByDate();
  let filtered = allGames;

  // Filter by date range if specified
  if (options?.from || options?.to) {
    const fromTs = options.from ? new Date(options.from).getTime() : 0;
    const toTs = options.to ? new Date(options.to + "T23:59:59").getTime() : Infinity;

    filtered = allGames.filter((game) => {
      const gameTs = game.date.sec * 1000;
      return gameTs >= fromTs && gameTs <= toTs;
    });
  }

  return filtered.map(gameToImportedMatch);
}

/**
 * Fetch fixtures for a specific league.
 */
export async function fetchFixtures(
  league: LeagueKey,
  options?: { from?: string; to?: string }
): Promise<ImportedMatch[]> {
  const leagueId = league === "ligat_hael" ? 902 : 719;
  const allGames = await fetchGamesByDate();

  let filtered = allGames.filter((g) => g.league === leagueId);

  if (options?.from || options?.to) {
    const fromTs = options.from ? new Date(options.from).getTime() : 0;
    const toTs = options.to ? new Date(options.to + "T23:59:59").getTime() : Infinity;

    filtered = filtered.filter((game) => {
      const gameTs = game.date.sec * 1000;
      return gameTs >= fromTs && gameTs <= toTs;
    });
  }

  return filtered.map(gameToImportedMatch);
}

/**
 * Fetch only upcoming (not started) fixtures for the next 14 days.
 */
export async function fetchUpcomingFixtures(): Promise<ImportedMatch[]> {
  const allGames = await fetchGamesByDate();
  const now = Date.now();
  const twoWeeksLater = now + 14 * 24 * 60 * 60 * 1000;

  const upcoming = allGames.filter((game) => {
    const gameTs = game.date.sec * 1000;
    return game.status !== 3 && gameTs >= now && gameTs <= twoWeeksLater;
  });

  return upcoming.map(gameToImportedMatch);
}

/**
 * Fetch recently finished fixtures (last 3 days).
 */
export async function fetchRecentlyFinished(): Promise<ImportedMatch[]> {
  const allGames = await fetchGamesByDate();
  const now = Date.now();
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

  const finished = allGames.filter((game) => {
    const gameTs = game.date.sec * 1000;
    return game.status === 3 && gameTs >= threeDaysAgo && gameTs <= now;
  });

  return finished.map(gameToImportedMatch);
}

/**
 * Fetch match statistics (corners, cards) from an individual game page.
 * Stats are loaded via Opta widgets which are JS-rendered, so we attempt
 * to extract from the page source if available, otherwise return null.
 *
 * Note: This is best-effort. Opta stats may not be extractable without
 * a headless browser. In that case, admin can still enter stats manually.
 */
export async function fetchMatchStats(externalId: number): Promise<ImportedStats | null> {
  try {
    const response = await fetch(GAME_URL(externalId), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try to extract currentGame variable for basic score data
    const gameRegex = /var\s+currentGame\s*=\s*(\{[\s\S]*?\});/;
    const gameMatch = html.match(gameRegex);

    if (!gameMatch) return null;

    let gameData: any;
    try {
      gameData = JSON.parse(gameMatch[1]);
    } catch {
      return null;
    }

    const totalGoals = (gameData.homeScore || 0) + (gameData.awayScore || 0);

    // Opta stats are rendered client-side, so we can't easily extract corners/cards
    // from the HTML source. Return just the goals for now.
    // The admin can manually add corners/cards, or we can enhance this later
    // with a proper Opta API integration.

    // Try to find stats in the HTML (sometimes they're pre-rendered)
    const $ = cheerio.load(html);
    let totalCorners = 0;
    let totalYellowCards = 0;
    let totalRedCards = 0;

    // Look for Opta stat rows that might be pre-rendered
    $(".Opta-Stat").each((_, el) => {
      const label = $(el).find(".Opta-Stat-Label").text().trim().toLowerCase();
      const homeVal = parseInt($(el).find(".Opta-Home .Opta-Stat-Value").text()) || 0;
      const awayVal = parseInt($(el).find(".Opta-Away .Opta-Stat-Value").text()) || 0;

      if (label.includes("corner")) {
        totalCorners = homeVal + awayVal;
      }
      if (label.includes("yellow")) {
        totalYellowCards = homeVal + awayVal;
      }
      if (label.includes("red card")) {
        totalRedCards = homeVal + awayVal;
      }
    });

    // If no Opta stats found in HTML, try to count events from page source
    if (totalCorners === 0 && totalYellowCards === 0) {
      // Count yellow/red card icons in the events section
      const yellowCards = (html.match(/yellow[-_]?card/gi) || []).length;
      const redCards = (html.match(/red[-_]?card/gi) || []).length;
      // These are rough estimates from page markup
      if (yellowCards > 0) totalYellowCards = Math.floor(yellowCards / 2); // Divide by 2 as they appear in markup multiple times
      if (redCards > 0) totalRedCards = Math.floor(redCards / 2);
    }

    return {
      externalId,
      totalGoals,
      totalCorners,
      totalYellowCards,
      totalRedCards,
    };
  } catch {
    return null;
  }
}

// â”€â”€â”€ Exports for backward compatibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startYear = month < 8 ? year - 1 : year;
  const endYear = (startYear + 1) % 100;
  return `${startYear % 100}/${endYear.toString().padStart(2, "0")}`;
}

