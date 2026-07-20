import { describe, it, expect } from "vitest";
import { predictWithPoisson } from "./poissonModel";
import type { TeamStats, HeadToHeadStats } from "./agents";

// ─── Fixture builders ─────────────────────────────────────────────────────────

function makeStats(
  name: string,
  opts: {
    matches?: number;
    avgScored: number;
    avgConceded: number;
    form?: Array<"W" | "D" | "L">;
  }
): TeamStats {
  const totalMatches = opts.matches ?? 20;
  return {
    teamName: name,
    totalMatches,
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
    goalsScored: Math.round(opts.avgScored * totalMatches),
    goalsConceded: Math.round(opts.avgConceded * totalMatches),
    avgGoalsScored: opts.avgScored,
    avgGoalsConceded: opts.avgConceded,
    form: opts.form ?? [],
  };
}

function emptyH2H(team1: string, team2: string): HeadToHeadStats {
  return {
    team1,
    team2,
    totalMatches: 0,
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
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("predictWithPoisson", () => {
  it("produces valid, normalized probabilities", () => {
    const home = makeStats("A", { avgScored: 1.5, avgConceded: 1.2 });
    const away = makeStats("B", { avgScored: 1.3, avgConceded: 1.4 });
    const p = predictWithPoisson(home, away, emptyH2H("A", "B"));

    const sum = p.homeWinProbability + p.drawProbability + p.awayWinProbability;
    expect(sum).toBeGreaterThanOrEqual(98);
    expect(sum).toBeLessThanOrEqual(102);
    for (const v of [p.homeWinProbability, p.drawProbability, p.awayWinProbability, p.bttsProbability, p.over25Probability]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(p.confidence).toBeGreaterThanOrEqual(0.33);
    expect(p.confidence).toBeLessThanOrEqual(0.9);
  });

  it("a strong home side vs a weak away side favors the home win + home scoreline", () => {
    const strongHome = makeStats("Strong", {
      avgScored: 2.6,
      avgConceded: 0.6,
      form: ["W", "W", "W", "W", "D"],
    });
    const weakAway = makeStats("Weak", {
      avgScored: 0.6,
      avgConceded: 2.4,
      form: ["L", "L", "D", "L", "L"],
    });
    const p = predictWithPoisson(strongHome, weakAway, emptyH2H("Strong", "Weak"));

    expect(p.recommendedPick).toBe("home");
    expect(p.homeWinProbability).toBeGreaterThan(p.awayWinProbability);
    expect(p.homeWinProbability).toBeGreaterThan(p.drawProbability);
    expect(p.homeExpectedGoals).toBeGreaterThan(p.awayExpectedGoals);
    // Most-likely scoreline must agree with a home win (never contradict the 1X2).
    expect(p.mostLikelyScore.home).toBeGreaterThan(p.mostLikelyScore.away);
  });

  it("mirrors: a strong away side vs a weak home side favors the away win", () => {
    const weakHome = makeStats("WeakHome", { avgScored: 0.7, avgConceded: 2.3 });
    const strongAway = makeStats("StrongAway", { avgScored: 2.4, avgConceded: 0.7 });
    const p = predictWithPoisson(weakHome, strongAway, emptyH2H("WeakHome", "StrongAway"));

    expect(p.recommendedPick).toBe("away");
    expect(p.awayWinProbability).toBeGreaterThan(p.homeWinProbability);
    expect(p.mostLikelyScore.away).toBeGreaterThan(p.mostLikelyScore.home);
  });

  it("evenly-matched teams stay close — no side runs away with it, draw is live", () => {
    const home = makeStats("H", { avgScored: 1.3, avgConceded: 1.3 });
    const away = makeStats("A", { avgScored: 1.3, avgConceded: 1.3 });
    const p = predictWithPoisson(home, away, emptyH2H("H", "A"));

    expect(Math.abs(p.homeWinProbability - p.awayWinProbability)).toBeLessThanOrEqual(18);
    expect(p.drawProbability).toBeGreaterThanOrEqual(20);
    expect(p.homeWinProbability).toBeLessThan(55);
    expect(p.awayWinProbability).toBeLessThan(55);
  });

  it("small samples are flagged low data quality and shrink toward the league mean", () => {
    const home = makeStats("H", { matches: 2, avgScored: 4.0, avgConceded: 0.1 });
    const away = makeStats("A", { matches: 2, avgScored: 0.1, avgConceded: 4.0 });
    const p = predictWithPoisson(home, away, emptyH2H("H", "A"));

    expect(p.dataQuality).toBe("low");
    // Despite a wild 2-game sample, λ is clamped/shrunk to a sane football range.
    expect(p.homeExpectedGoals).toBeLessThanOrEqual(4);
    expect(p.awayExpectedGoals).toBeGreaterThan(0);
  });
});
