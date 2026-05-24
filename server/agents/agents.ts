import { getDb } from "../db";
import { matches } from "../../drizzle/schema";
import { or, eq, and, isNotNull } from "drizzle-orm";

export type AgentType = "statistics" | "research" | "prediction" | "tactical";

export interface TeamStats {
  teamName: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  homeWins: number;
  homeMatches: number;
  homeWinRate: number;
  awayWins: number;
  awayMatches: number;
  awayWinRate: number;
  goalsScored: number;
  goalsConceded: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  form: Array<"W" | "D" | "L">; // last 5
}

export interface HeadToHeadStats {
  team1: string;
  team2: string;
  totalMatches: number;
  team1Wins: number;
  team2Wins: number;
  draws: number;
  team1WinRate: number;
  team2WinRate: number;
  team1GoalsScored: number;
  team2GoalsScored: number;
  avgTotalGoals: number;
  recentMatches: Array<{
    date: Date;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    result: "home_win" | "draw" | "away_win";
  }>;
}

export interface MatchPrediction {
  homeTeam: string;
  awayTeam: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  recommendedPick: "home_win" | "draw" | "away_win";
  confidence: "low" | "medium" | "high";
  reasoning: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: HeadToHeadStats;
}

export async function getTeamStats(teamName: string): Promise<TeamStats> {
  const db = getDb();

  const allMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        or(eq(matches.homeTeam, teamName), eq(matches.awayTeam, teamName)),
        isNotNull(matches.actualResult)
      )
    );

  const stats: TeamStats = {
    teamName,
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
    homeWins: 0,
    homeMatches: 0,
    homeWinRate: 0,
    awayWins: 0,
    awayMatches: 0,
    awayWinRate: 0,
    goalsScored: 0,
    goalsConceded: 0,
    avgGoalsScored: 0,
    avgGoalsConceded: 0,
    form: [],
  };

  const completedMatches = allMatches.filter((m) => m.actualResult !== null);
  stats.totalMatches = completedMatches.length;

  for (const m of completedMatches) {
    const isHome = m.homeTeam === teamName;
    const scored = isHome ? (m.homeTeamScore ?? 0) : (m.awayTeamScore ?? 0);
    const conceded = isHome ? (m.awayTeamScore ?? 0) : (m.homeTeamScore ?? 0);
    stats.goalsScored += scored;
    stats.goalsConceded += conceded;

    const teamWon =
      (isHome && m.actualResult === "home_win") ||
      (!isHome && m.actualResult === "away_win");
    const teamDrew = m.actualResult === "draw";

    if (isHome) {
      stats.homeMatches++;
      if (teamWon) stats.homeWins++;
    } else {
      stats.awayMatches++;
      if (teamWon) stats.awayWins++;
    }

    if (teamWon) stats.wins++;
    else if (teamDrew) stats.draws++;
    else stats.losses++;
  }

  if (stats.totalMatches > 0) {
    stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
    stats.avgGoalsScored = Math.round((stats.goalsScored / stats.totalMatches) * 10) / 10;
    stats.avgGoalsConceded = Math.round((stats.goalsConceded / stats.totalMatches) * 10) / 10;
  }
  if (stats.homeMatches > 0)
    stats.homeWinRate = Math.round((stats.homeWins / stats.homeMatches) * 100);
  if (stats.awayMatches > 0)
    stats.awayWinRate = Math.round((stats.awayWins / stats.awayMatches) * 100);

  // Form: last 5 completed matches sorted by date desc
  const sorted = [...completedMatches].sort(
    (a, b) => b.matchDate.getTime() - a.matchDate.getTime()
  );
  stats.form = sorted.slice(0, 5).map((m) => {
    const isHome = m.homeTeam === teamName;
    const won =
      (isHome && m.actualResult === "home_win") ||
      (!isHome && m.actualResult === "away_win");
    const drew = m.actualResult === "draw";
    return won ? "W" : drew ? "D" : "L";
  });

  return stats;
}

export async function getHeadToHead(team1: string, team2: string): Promise<HeadToHeadStats> {
  const db = getDb();

  const h2hMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        or(
          and(eq(matches.homeTeam, team1), eq(matches.awayTeam, team2)),
          and(eq(matches.homeTeam, team2), eq(matches.awayTeam, team1))
        ),
        isNotNull(matches.actualResult)
      )
    );

  const stats: HeadToHeadStats = {
    team1,
    team2,
    totalMatches: h2hMatches.length,
    team1Wins: 0,
    team2Wins: 0,
    draws: 0,
    team1WinRate: 0,
    team2WinRate: 0,
    team1GoalsScored: 0,
    team2GoalsScored: 0,
    avgTotalGoals: 0,
    recentMatches: [],
  };

  let totalGoals = 0;

  for (const m of h2hMatches) {
    totalGoals += (m.homeTeamScore ?? 0) + (m.awayTeamScore ?? 0);

    if (m.homeTeam === team1) {
      stats.team1GoalsScored += m.homeTeamScore ?? 0;
      stats.team2GoalsScored += m.awayTeamScore ?? 0;
    } else {
      stats.team1GoalsScored += m.awayTeamScore ?? 0;
      stats.team2GoalsScored += m.homeTeamScore ?? 0;
    }

    const team1Won =
      (m.homeTeam === team1 && m.actualResult === "home_win") ||
      (m.awayTeam === team1 && m.actualResult === "away_win");
    const team2Won =
      (m.homeTeam === team2 && m.actualResult === "home_win") ||
      (m.awayTeam === team2 && m.actualResult === "away_win");

    if (team1Won) stats.team1Wins++;
    else if (team2Won) stats.team2Wins++;
    else stats.draws++;
  }

  if (stats.totalMatches > 0) {
    stats.team1WinRate = Math.round((stats.team1Wins / stats.totalMatches) * 100);
    stats.team2WinRate = Math.round((stats.team2Wins / stats.totalMatches) * 100);
    stats.avgTotalGoals = Math.round((totalGoals / stats.totalMatches) * 10) / 10;
  }

  // Last 5 H2H sorted by date desc
  const sorted = [...h2hMatches].sort(
    (a, b) => b.matchDate.getTime() - a.matchDate.getTime()
  );
  stats.recentMatches = sorted.slice(0, 5).map((m) => ({
    date: m.matchDate,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeTeamScore ?? 0,
    awayScore: m.awayTeamScore ?? 0,
    result: m.actualResult as "home_win" | "draw" | "away_win",
  }));

  return stats;
}

export async function predictMatch(
  homeTeam: string,
  awayTeam: string
): Promise<MatchPrediction> {
  const [homeStats, awayStats, h2h] = await Promise.all([
    getTeamStats(homeTeam),
    getTeamStats(awayTeam),
    getHeadToHead(homeTeam, awayTeam),
  ]);

  // Score-based probability calculation
  // Base: home advantage ~5%, general draw rate ~25%
  let homeScore = 50 + 5; // home advantage
  let awayScore = 50 - 5;

  // Factor 1: win rates (weight 30%)
  if (homeStats.totalMatches >= 3) {
    homeScore += (homeStats.homeWinRate - 50) * 0.3;
  }
  if (awayStats.totalMatches >= 3) {
    awayScore += (awayStats.awayWinRate - 50) * 0.3;
  }

  // Factor 2: form (weight 20%) — W=3, D=1, L=0
  const formScore = (form: Array<"W" | "D" | "L">) =>
    form.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const maxFormScore = 15; // 5 matches × 3 points
  if (homeStats.form.length > 0) {
    homeScore += ((formScore(homeStats.form) / maxFormScore) * 100 - 50) * 0.2;
  }
  if (awayStats.form.length > 0) {
    awayScore += ((formScore(awayStats.form) / maxFormScore) * 100 - 50) * 0.2;
  }

  // Factor 3: H2H (weight 25%)
  if (h2h.totalMatches >= 2) {
    homeScore += (h2h.team1WinRate - 50) * 0.25;
    awayScore += (h2h.team2WinRate - 50) * 0.25;
  }

  // Factor 4: avg goals (affects draw probability)
  const avgGoalsInGame =
    h2h.totalMatches >= 3
      ? h2h.avgTotalGoals
      : (homeStats.avgGoalsScored + awayStats.avgGoalsScored) / 2;

  // More goals per game → lower draw probability
  const drawBase = avgGoalsInGame > 2.5 ? 20 : avgGoalsInGame < 1.5 ? 30 : 25;

  // Normalize to 100%
  const total = homeScore + awayScore;
  const rawHome = (homeScore / total) * (100 - drawBase);
  const rawAway = (awayScore / total) * (100 - drawBase);

  const homeWinProbability = Math.round(Math.max(15, Math.min(70, rawHome)));
  const awayWinProbability = Math.round(Math.max(10, Math.min(65, rawAway)));
  const drawProbability = 100 - homeWinProbability - awayWinProbability;

  // Pick recommendation
  const max = Math.max(homeWinProbability, drawProbability, awayWinProbability);
  const recommendedPick: "home_win" | "draw" | "away_win" =
    max === homeWinProbability
      ? "home_win"
      : max === drawProbability
        ? "draw"
        : "away_win";

  // Confidence based on data availability
  const dataPoints =
    homeStats.totalMatches + awayStats.totalMatches + h2h.totalMatches * 2;
  const confidence: "low" | "medium" | "high" =
    dataPoints < 10 ? "low" : dataPoints < 30 ? "medium" : "high";

  // Hebrew reasoning
  const formHe = (f: Array<"W" | "D" | "L">) =>
    f.map((r) => (r === "W" ? "נ" : r === "D" ? "ת" : "ה")).join("-") || "אין נתונים";

  const reasoning = [
    `${homeTeam}: ${homeStats.wins}נ/${homeStats.draws}ת/${homeStats.losses}ה (${homeStats.winRate}% ניצחונות), פורמה: ${formHe(homeStats.form)}`,
    `${awayTeam}: ${awayStats.wins}נ/${awayStats.draws}ת/${awayStats.losses}ה (${awayStats.winRate}% ניצחונות), פורמה: ${formHe(awayStats.form)}`,
    h2h.totalMatches > 0
      ? `ראש-בראש: ${h2h.totalMatches} משחקים — ${homeTeam} ${h2h.team1Wins} נצ', ${awayTeam} ${h2h.team2Wins} נצ', ${h2h.draws} תיקו`
      : "אין היסטוריית ראש-בראש",
  ].join(" | ");

  return {
    homeTeam,
    awayTeam,
    homeWinProbability,
    drawProbability,
    awayWinProbability,
    recommendedPick,
    confidence,
    reasoning,
    homeStats,
    awayStats,
    h2h,
  };
}

// Legacy stubs — kept for router compatibility
export function getAllAgents() {
  return [];
}

export async function queryAgent(
  _agentType: AgentType,
  _userMessage: string,
  _matchId?: number
): Promise<string> {
  throw new Error("Agents not configured");
}

export async function queryMultipleAgents(
  _userMessage: string,
  _matchId?: number
): Promise<Record<AgentType, string>> {
  throw new Error("Agents not configured");
}
