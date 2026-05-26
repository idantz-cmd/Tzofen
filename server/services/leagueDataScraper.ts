/**
 * League Data Scraper Agent
 *
 * One-time scraper for Israeli football league data from football.co.il.
 * Organized as discrete skills that can be called independently or all at once.
 *
 * Skills:
 *   1. skillExtractTeams       — extract unique teams from gamesByDate
 *   2. skillComputeStandings   — compute standings from finished match results
 *   3. skillScrapePlayerRoster — scrape player list from each team page
 *   4. skillScrapeTeamDetails  — get city/location from team page
 *
 * Main entry point: runFullScrape(season)
 */

import * as cheerio from "cheerio";

// ─── Internal Types ──────────────────────────────────────────────────────────

interface FcIlTeam {
  id: number;
  name: string;
  hebrewName: string;
  logoUrl?: string;
}

interface FcIlGame {
  id: number;
  status: number | null; // 1 = upcoming, 3 = finished
  homeTeamId: FcIlTeam;
  awayTeamId: FcIlTeam;
  homeScore?: number;
  awayScore?: number;
  date: { sec: number; usec: number };
  round: number;
  league: number; // 902 = Ligat Ha'al, 719 = Liga Leumit
  season: string;
  stadiumId?: { hebrewName?: string };
}

type LeagueKey = "ligat_hael" | "ligah_leumit";

// ─── Constants ────────────────────────────────────────────────────────────────

const SCORES_URL = "https://www.football.co.il/scores/";
const TEAM_URL = (id: number) => `https://www.football.co.il/team/${id}`;

const LEAGUE_MAP: Record<number, LeagueKey> = {
  902: "ligat_hael",
  719: "ligah_leumit",
};

const LEAGUE_IDS = [902, 719];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ─── Core Fetch ───────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchAllGames(): Promise<FcIlGame[]> {
  const html = await fetchPage(SCORES_URL);
  const regex =
    /var\s+gamesByDate\s*=\s*(\{[\s\S]*?\});[\s\n]*(?:var|let|const|function|\n\s*\n)/;
  const m = html.match(regex) ?? html.match(/var\s+gamesByDate\s*=\s*(\{[\s\S]+?\});/);
  if (!m) throw new Error("Could not find gamesByDate variable in football.co.il");
  const raw = JSON.parse(m[1]) as Record<string, FcIlGame[]>;
  const all: FcIlGame[] = [];
  for (const games of Object.values(raw)) all.push(...games);
  return all.filter((g) => LEAGUE_IDS.includes(g.league));
}

// ─── Skill 1: Extract Teams ───────────────────────────────────────────────────

/**
 * Skill 1 — Extract all unique teams from the gamesByDate data.
 * No extra HTTP requests; team objects are embedded in each game.
 */
export async function skillExtractTeams(games: FcIlGame[]): Promise<
  Array<{
    externalId: number;
    name: string;
    hebrewName: string;
    logoUrl?: string;
    league: LeagueKey;
  }>
> {
  const seen = new Map<
    number,
    { externalId: number; name: string; hebrewName: string; logoUrl?: string; league: LeagueKey }
  >();

  for (const game of games) {
    const league = LEAGUE_MAP[game.league];
    if (!league) continue;

    for (const td of [game.homeTeamId, game.awayTeamId]) {
      if (td?.id && !seen.has(td.id)) {
        seen.set(td.id, {
          externalId: td.id,
          name: td.name ?? "",
          hebrewName: td.hebrewName || td.name || "",
          logoUrl: td.logoUrl,
          league,
        });
      }
    }
  }

  return Array.from(seen.values());
}

// ─── Skill 2: Compute Standings ───────────────────────────────────────────────

/**
 * Skill 2 — Compute league standings from finished games.
 * No HTTP requests; purely computed from the gamesByDate data.
 */
export async function skillComputeStandings(
  games: FcIlGame[],
  leagueId: number,
  season: string
): Promise<
  Array<{
    externalTeamId: number;
    teamName: string;
    teamLogo?: string;
    league: LeagueKey;
    season: string;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    form: string;
  }>
> {
  const leagueKey = LEAGUE_MAP[leagueId];
  if (!leagueKey) return [];

  const finished = games
    .filter(
      (g) =>
        g.league === leagueId &&
        g.status === 3 &&
        g.homeScore !== undefined &&
        g.awayScore !== undefined
    )
    .sort((a, b) => a.date.sec - b.date.sec);

  type Row = {
    teamId: number;
    teamName: string;
    teamLogo?: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    results: ("W" | "D" | "L")[];
  };

  const stats = new Map<number, Row>();

  const ensure = (td: FcIlTeam): Row => {
    if (!stats.has(td.id)) {
      stats.set(td.id, {
        teamId: td.id,
        teamName: td.hebrewName || td.name,
        teamLogo: td.logoUrl,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        results: [],
      });
    }
    return stats.get(td.id)!;
  };

  for (const g of finished) {
    const home = ensure(g.homeTeamId);
    const away = ensure(g.awayTeamId);
    const hg = g.homeScore!;
    const ag = g.awayScore!;

    home.played++;
    away.played++;
    home.gf += hg;
    home.ga += ag;
    away.gf += ag;
    away.ga += hg;

    if (hg > ag) {
      home.won++;
      home.results.push("W");
      away.lost++;
      away.results.push("L");
    } else if (hg < ag) {
      away.won++;
      away.results.push("W");
      home.lost++;
      home.results.push("L");
    } else {
      home.drawn++;
      home.results.push("D");
      away.drawn++;
      away.results.push("D");
    }
  }

  const rows = Array.from(stats.values())
    .map((t, i) => ({
      externalTeamId: t.teamId,
      teamName: t.teamName,
      teamLogo: t.teamLogo,
      league: leagueKey,
      season,
      position: i + 1,
      played: t.played,
      won: t.won,
      drawn: t.drawn,
      lost: t.lost,
      goalsFor: t.gf,
      goalsAgainst: t.ga,
      goalDifference: t.gf - t.ga,
      points: t.won * 3 + t.drawn,
      form: t.results.slice(-5).join(""),
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  return rows.map((r, i) => ({ ...r, position: i + 1 }));
}

// ─── Skill 3: Scrape Player Roster ───────────────────────────────────────────

/**
 * Skill 3 — Scrape player roster from a team page on football.co.il.
 * Tries multiple strategies: embedded JSON variables → HTML parsing.
 */
export async function skillScrapePlayerRoster(teamExternalId: number): Promise<
  Array<{ name: string; position?: string; jerseyNumber?: number }>
> {
  try {
    const html = await fetchPage(TEAM_URL(teamExternalId));

    // Strategy A: embedded JSON variable
    const patterns = [
      /var\s+currentTeam\s*=\s*(\{[\s\S]+?\});/,
      /var\s+teamData\s*=\s*(\{[\s\S]+?\});/,
      /var\s+squadData\s*=\s*(\[[\s\S]+?\]);/,
      /var\s+teamPlayers\s*=\s*(\[[\s\S]+?\]);/,
      /var\s+players\s*=\s*(\[[\s\S]+?\]);/,
    ];

    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (!m) continue;
      try {
        const data = JSON.parse(m[1]);
        const list: any[] = Array.isArray(data)
          ? data
          : (data.players ?? data.squad ?? data.squadPlayers ?? []);
        if (list.length > 0) {
          return list
            .map((p: any) => ({
              name:
                p.hebrewName ?? p.name ?? p.fullName ?? p.lastName ?? "",
              position:
                p.position ?? p.positionName ?? p.positionHebrewName ?? undefined,
              jerseyNumber:
                p.jerseyNumber ?? p.number ?? p.shirtNumber ?? undefined,
            }))
            .filter((p) => p.name.length > 0)
            .slice(0, 40);
        }
      } catch {
        // try next pattern
      }
    }

    // Strategy B: cheerio HTML parsing
    const $ = cheerio.load(html);
    const players: Array<{ name: string; position?: string; jerseyNumber?: number }> = [];

    $(".player-item, .squad-player, .team-player, [class*='PlayerItem'], [class*='player-row']").each(
      (_, el) => {
        const name = $(el)
          .find("[class*='name'], .player-name, .name")
          .first()
          .text()
          .trim();
        const position = $(el)
          .find("[class*='position']")
          .first()
          .text()
          .trim();
        const num = parseInt(
          $(el).find("[class*='number'], [class*='jersey']").first().text().trim()
        );
        if (name.length > 1) {
          players.push({
            name,
            position: position || undefined,
            jerseyNumber: isNaN(num) ? undefined : num,
          });
        }
      }
    );

    // Strategy C: table rows fallback
    if (players.length === 0) {
      $("table tr").each((_, el) => {
        const cells = $(el).find("td");
        if (cells.length < 2) return;
        const name = cells.eq(1).text().trim();
        if (name.length > 2 && !/^\d+$/.test(name)) {
          players.push({ name });
        }
      });
    }

    return players.slice(0, 40);
  } catch (err) {
    console.warn(`[Skill3] Failed for team ${teamExternalId}:`, err);
    return [];
  }
}

// ─── Skill 4: Team Details (City) ─────────────────────────────────────────────

/**
 * Skill 4 — Scrape team city/location from the team page.
 */
export async function skillScrapeTeamDetails(
  teamExternalId: number
): Promise<{ city?: string }> {
  try {
    const html = await fetchPage(TEAM_URL(teamExternalId));

    // Try embedded JSON first
    const m = html.match(/var\s+currentTeam\s*=\s*(\{[\s\S]+?\});/);
    if (m) {
      try {
        const data = JSON.parse(m[1]);
        const city =
          data.city ??
          data.cityName ??
          data.hebrewCityName ??
          data.location ??
          data.stadiumCity;
        if (city && typeof city === "string") return { city };
      } catch {}
    }

    // Try HTML
    const $ = cheerio.load(html);
    const cityText = $("[class*='city'], [class*='location'], [class*='stadium']")
      .first()
      .text()
      .trim();
    if (cityText && cityText.length < 50) return { city: cityText };

    return {};
  } catch {
    return {};
  }
}

// ─── Main Entry: Run Full Scrape ──────────────────────────────────────────────

export interface ScrapeResult {
  teams: number;
  standings: { ligat_hael: number; ligah_leumit: number };
  players: number;
  errors: string[];
}

/**
 * Run all four skills and return results.
 * NOTE: DB persistence for teams/leaguePlayers/leagueStandings was removed
 * in the schema migration. This function now returns scraped data only.
 */
export async function runFullScrape(season = "25/26"): Promise<ScrapeResult> {
  const errors: string[] = [];
  const allGames = await fetchAllGames();

  const extractedTeams = await skillExtractTeams(allGames);
  const teamsInserted = extractedTeams.length;

  let standingsLigatHael = 0;
  let standingsLigahLeumit = 0;
  for (const leagueId of LEAGUE_IDS) {
    const rows = await skillComputeStandings(allGames, leagueId, season);
    if (leagueId === 902) standingsLigatHael = rows.length;
    else standingsLigahLeumit = rows.length;
  }

  let playersTotal = 0;
  for (const team of extractedTeams) {
    try {
      const players = await skillScrapePlayerRoster(team.externalId);
      playersTotal += players.length;
    } catch (e: any) {
      errors.push(`[Skill3] ${team.name}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return {
    teams: teamsInserted,
    standings: { ligat_hael: standingsLigatHael, ligah_leumit: standingsLigahLeumit },
    players: playersTotal,
    errors: errors.slice(0, 20),
  };
}
