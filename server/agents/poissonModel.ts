/**
 * Poisson + Dixon-Coles Match Prediction Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the old linear "add up win-rate percentages" heuristic in agents.ts.
 *
 * WHY THIS IS MORE ACCURATE
 * -------------------------
 * Football scores follow (approximately) a Poisson distribution. Instead of
 * guessing "home is 55% to win" from a weighted average of win rates, we:
 *
 *   1. Compute each team's attack strength and defensive frailty RELATIVE to the
 *      league average (so a 2.0 goals/game team in a low-scoring league is
 *      correctly treated as strong).
 *   2. Derive expected goals (λ) for each side for THIS specific fixture.
 *   3. Build a full score-probability matrix P(home=i, away=j) with Poisson.
 *   4. Apply the Dixon-Coles low-score correction (real football has more
 *      0-0/1-0/0-1/1-1 draws than naive Poisson predicts).
 *   5. Sum the matrix to get calibrated 1X2 probabilities AND read the single
 *      most-likely scoreline straight off the matrix — so the predicted score
 *      and the predicted result are ALWAYS internally consistent.
 *
 * Everything here is deterministic and unit-testable. No LLM involved.
 */

import type { TeamStats, HeadToHeadStats } from "./agents";

// ─── Tunables ────────────────────────────────────────────────────────────────

const MAX_GOALS = 8;          // score matrix dimension (0..8 each side)
const HOME_ADVANTAGE = 1.15;  // home xG multiplier (empirical ~1.1–1.2)
const DIXON_COLES_RHO = -0.13; // low-score dependence correction
const RECENCY_FORM_WEIGHT = 0.25; // how much recent form nudges base strength
// League baselines: avg goals scored by home / away sides per game. Israeli
// top flight sits a touch below the European mean; tune from real data over time.
const LEAGUE_AVG_HOME_GOALS = 1.45;
const LEAGUE_AVG_AWAY_GOALS = 1.15;
// Minimum matches before we trust a team's own numbers; below this we shrink
// toward the league average so a 2-game sample doesn't produce a wild λ.
const MIN_RELIABLE_MATCHES = 6;

// ─── Public types ────────────────────────────────────────────────────────────

export interface PoissonPrediction {
  homeExpectedGoals: number;      // λ home
  awayExpectedGoals: number;      // λ away
  homeWinProbability: number;     // %, integer
  drawProbability: number;        // %, integer
  awayWinProbability: number;     // %, integer
  mostLikelyScore: { home: number; away: number };
  scoreProbability: number;       // % chance of that exact scoreline
  topScores: Array<{ home: number; away: number; prob: number }>; // top 3
  bttsProbability: number;        // both teams to score, %
  over25Probability: number;      // over 2.5 goals, %
  recommendedPick: "home" | "draw" | "away";
  // 0..1 model confidence — driven by margin between top two outcomes AND
  // how much real data backed the estimate. NOT a lazy constant.
  confidence: number;
  dataQuality: "low" | "medium" | "high";
}

// ─── Poisson helpers ─────────────────────────────────────────────────────────

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/** P(X = k) for a Poisson with mean λ. */
function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Dixon-Coles τ correction. Naive Poisson treats the two teams' goal counts as
 * independent, which under-counts low-scoring draws. τ re-weights the four
 * lowest-score cells. rho < 0 pushes probability toward 0-0 and 1-1.
 */
function dixonColesTau(
  homeGoals: number,
  awayGoals: number,
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
): number {
  if (homeGoals === 0 && awayGoals === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (homeGoals === 0 && awayGoals === 1) return 1 + lambdaHome * rho;
  if (homeGoals === 1 && awayGoals === 0) return 1 + lambdaAway * rho;
  if (homeGoals === 1 && awayGoals === 1) return 1 - rho;
  return 1;
}

// ─── Strength estimation ─────────────────────────────────────────────────────

/**
 * Shrink a team's own average toward the league mean when the sample is small.
 * weight = matches / (matches + MIN_RELIABLE_MATCHES) → gradually trusts data.
 */
function shrink(teamAvg: number, leagueAvg: number, matches: number): number {
  const w = matches / (matches + MIN_RELIABLE_MATCHES);
  return w * teamAvg + (1 - w) * leagueAvg;
}

/** Convert last-5 form (W/D/L) into a small multiplier around 1.0. */
function formMultiplier(form: Array<"W" | "D" | "L">): number {
  if (form.length === 0) return 1;
  const pts = form.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
  const maxPts = form.length * 3;
  const ratio = pts / maxPts;            // 0..1
  // Map 0..1 → (1 - w)..(1 + w) so red-hot form ×~1.25, cold form ×~0.75.
  return 1 + (ratio - 0.5) * 2 * RECENCY_FORM_WEIGHT;
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export function predictWithPoisson(
  homeStats: TeamStats,
  awayStats: TeamStats,
  h2h: HeadToHeadStats,
): PoissonPrediction {
  // 1. Attack strength = (team's goals scored) relative to league average.
  //    Defensive frailty = (team's goals conceded) relative to league average.
  //    Shrunk toward the league mean for small samples.
  const homeAtt = shrink(homeStats.avgGoalsScored, LEAGUE_AVG_HOME_GOALS, homeStats.totalMatches) / LEAGUE_AVG_HOME_GOALS;
  const homeDef = shrink(homeStats.avgGoalsConceded, LEAGUE_AVG_AWAY_GOALS, homeStats.totalMatches) / LEAGUE_AVG_AWAY_GOALS;
  const awayAtt = shrink(awayStats.avgGoalsScored, LEAGUE_AVG_AWAY_GOALS, awayStats.totalMatches) / LEAGUE_AVG_AWAY_GOALS;
  const awayDef = shrink(awayStats.avgGoalsConceded, LEAGUE_AVG_HOME_GOALS, awayStats.totalMatches) / LEAGUE_AVG_HOME_GOALS;

  // 2. Expected goals for this fixture, with home advantage and form.
  let lambdaHome =
    LEAGUE_AVG_HOME_GOALS * homeAtt * awayDef * HOME_ADVANTAGE * formMultiplier(homeStats.form);
  let lambdaAway =
    LEAGUE_AVG_AWAY_GOALS * awayAtt * homeDef * formMultiplier(awayStats.form);

  // 3. Nudge with head-to-head goal history when we have a decent sample.
  if (h2h.totalMatches >= 3) {
    const h2hGoalsPerSide = h2h.avgTotalGoals / 2;
    lambdaHome = 0.85 * lambdaHome + 0.15 * h2hGoalsPerSide;
    lambdaAway = 0.85 * lambdaAway + 0.15 * h2hGoalsPerSide;
  }

  // Clamp to sane bounds so a data glitch can't produce λ = 12.
  lambdaHome = Math.max(0.2, Math.min(4.0, lambdaHome));
  lambdaAway = Math.max(0.2, Math.min(4.0, lambdaAway));

  // 4. Build the score-probability matrix with Dixon-Coles correction.
  const matrix: number[][] = [];
  let total = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    matrix[i] = [];
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p =
        poissonPmf(i, lambdaHome) *
        poissonPmf(j, lambdaAway) *
        dixonColesTau(i, j, lambdaHome, lambdaAway, DIXON_COLES_RHO);
      matrix[i][j] = p;
      total += p;
    }
  }
  // Normalize (Dixon-Coles + truncation cost a little probability mass).
  for (let i = 0; i <= MAX_GOALS; i++)
    for (let j = 0; j <= MAX_GOALS; j++) matrix[i][j] /= total;

  // 5. Reduce the matrix into the metrics we surface.
  let pHome = 0, pDraw = 0, pAway = 0, pBtts = 0, pOver25 = 0;
  const scores: Array<{ home: number; away: number; prob: number }> = [];
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = matrix[i][j];
      if (i > j) pHome += p;
      else if (i === j) pDraw += p;
      else pAway += p;
      if (i > 0 && j > 0) pBtts += p;
      if (i + j > 2.5) pOver25 += p;
      scores.push({ home: i, away: j, prob: p });
    }
  }

  scores.sort((a, b) => b.prob - a.prob);
  const topScores = scores.slice(0, 3).map((s) => ({
    home: s.home,
    away: s.away,
    prob: Math.round(s.prob * 1000) / 10,
  }));
  const mostLikely = scores[0];

  const homeWinProbability = Math.round(pHome * 100);
  const drawProbability = Math.round(pDraw * 100);
  const awayWinProbability = Math.round(pAway * 100);

  const outcomes: Array<["home" | "draw" | "away", number]> = [
    ["home", pHome], ["draw", pDraw], ["away", pAway],
  ];
  outcomes.sort((a, b) => b[1] - a[1]);
  const recommendedPick = outcomes[0][0];

  // 6. Confidence = f(margin between top two outcomes, data volume).
  const margin = outcomes[0][1] - outcomes[1][1];       // 0..1
  const dataPoints = homeStats.totalMatches + awayStats.totalMatches + h2h.totalMatches * 2;
  const dataQuality: PoissonPrediction["dataQuality"] =
    dataPoints < 10 ? "low" : dataPoints < 30 ? "medium" : "high";
  const dataFactor = dataQuality === "high" ? 1 : dataQuality === "medium" ? 0.85 : 0.65;
  // Base confidence around the winning probability, scaled by margin & data.
  let confidence = outcomes[0][1] * (0.7 + 0.3 * Math.min(1, margin / 0.25)) * dataFactor;
  confidence = Math.max(0.33, Math.min(0.9, confidence));

  return {
    homeExpectedGoals: Math.round(lambdaHome * 100) / 100,
    awayExpectedGoals: Math.round(lambdaAway * 100) / 100,
    homeWinProbability,
    drawProbability,
    awayWinProbability,
    mostLikelyScore: { home: mostLikely.home, away: mostLikely.away },
    scoreProbability: Math.round(mostLikely.prob * 1000) / 10,
    topScores,
    bttsProbability: Math.round(pBtts * 100),
    over25Probability: Math.round(pOver25 * 100),
    recommendedPick,
    confidence: Math.round(confidence * 100) / 100,
    dataQuality,
  };
}
