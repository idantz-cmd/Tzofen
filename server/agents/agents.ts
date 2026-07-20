import { getDb } from "../db";
import { matches } from "../../drizzle/schema";
import { or, eq, and, isNotNull } from "drizzle-orm";
import { predictWithPoisson } from "./poissonModel";
import type { PoissonPrediction } from "./poissonModel";

export type { AgentType } from "./llmAgents";

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
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    result: "home" | "draw" | "away";
  }>;
}

export interface MatchPrediction {
  homeTeam: string;
  awayTeam: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  recommendedPick: "home" | "draw" | "away";
  confidence: "low" | "medium" | "high";
  reasoning: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  h2h: HeadToHeadStats;
  poisson?: PoissonPrediction;
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
    const scored = isHome ? (m.actualHomeScore ?? 0) : (m.actualAwayScore ?? 0);
    const conceded = isHome ? (m.actualAwayScore ?? 0) : (m.actualHomeScore ?? 0);
    stats.goalsScored += scored;
    stats.goalsConceded += conceded;

    const teamWon =
      (isHome && m.actualResult === "home") ||
      (!isHome && m.actualResult === "away");
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
    (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );
  stats.form = sorted.slice(0, 5).map((m) => {
    const isHome = m.homeTeam === teamName;
    const won =
      (isHome && m.actualResult === "home") ||
      (!isHome && m.actualResult === "away");
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
    totalGoals += (m.actualHomeScore ?? 0) + (m.actualAwayScore ?? 0);

    if (m.homeTeam === team1) {
      stats.team1GoalsScored += m.actualHomeScore ?? 0;
      stats.team2GoalsScored += m.actualAwayScore ?? 0;
    } else {
      stats.team1GoalsScored += m.actualAwayScore ?? 0;
      stats.team2GoalsScored += m.actualHomeScore ?? 0;
    }

    const team1Won =
      (m.homeTeam === team1 && m.actualResult === "home") ||
      (m.awayTeam === team1 && m.actualResult === "away");
    const team2Won =
      (m.homeTeam === team2 && m.actualResult === "home") ||
      (m.awayTeam === team2 && m.actualResult === "away");

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
    (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );
  stats.recentMatches = sorted.slice(0, 5).map((m) => ({
    date: m.matchDate,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.actualHomeScore ?? 0,
    awayScore: m.actualAwayScore ?? 0,
    result: m.actualResult as "home" | "draw" | "away",
  }));

  return stats;
}

export async function predictMatch(
  homeTeam: string,
  awayTeam: string,
  // Optional prefetched data — pass these from the orchestrator to avoid
  // re-querying the DB (it already loaded them).
  prefetched?: {
    homeStats?: TeamStats;
    awayStats?: TeamStats;
    h2h?: HeadToHeadStats;
  }
): Promise<MatchPrediction> {
  const [homeStats, awayStats, h2h] = await Promise.all([
    prefetched?.homeStats ?? getTeamStats(homeTeam),
    prefetched?.awayStats ?? getTeamStats(awayTeam),
    prefetched?.h2h ?? getHeadToHead(homeTeam, awayTeam),
  ]);

  // Poisson + Dixon-Coles engine: models goals as a stochastic process, reads
  // the 1X2 probabilities and the most-likely scoreline off one matrix — so the
  // predicted result and score can never contradict each other.
  const poisson = predictWithPoisson(homeStats, awayStats, h2h);

  const formHe = (f: Array<"W" | "D" | "L">) =>
    f.map((r) => (r === "W" ? "נ" : r === "D" ? "ת" : "ה")).join("-") || "אין נתונים";

  const reasoning = [
    `${homeTeam}: ${homeStats.wins}נ/${homeStats.draws}ת/${homeStats.losses}ה, ` +
      `xG ${poisson.homeExpectedGoals}, פורמה ${formHe(homeStats.form)}`,
    `${awayTeam}: ${awayStats.wins}נ/${awayStats.draws}ת/${awayStats.losses}ה, ` +
      `xG ${poisson.awayExpectedGoals}, פורמה ${formHe(awayStats.form)}`,
    `תוצאה סבירה: ${poisson.mostLikelyScore.home}-${poisson.mostLikelyScore.away} ` +
      `(${poisson.scoreProbability}%)`,
    h2h.totalMatches > 0
      ? `ראש-בראש: ${h2h.totalMatches} משחקים — ${homeTeam} ${h2h.team1Wins}, ${awayTeam} ${h2h.team2Wins}, ${h2h.draws} תיקו`
      : "אין היסטוריית ראש-בראש",
  ].join(" | ");

  return {
    homeTeam,
    awayTeam,
    homeWinProbability: poisson.homeWinProbability,
    drawProbability: poisson.drawProbability,
    awayWinProbability: poisson.awayWinProbability,
    recommendedPick: poisson.recommendedPick,
    // Map the model's numeric confidence onto the existing 3-level enum.
    confidence: poisson.confidence >= 0.66 ? "high" : poisson.confidence >= 0.5 ? "medium" : "low",
    reasoning,
    homeStats,
    awayStats,
    h2h,
    poisson,
  };
}

export { getAgentConfig, getAllAgents, queryAgent, queryMultipleAgents } from "./llmAgents";
