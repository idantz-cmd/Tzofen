/**
 * Agent Team Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * Coordinates all prediction agents into one unified, high-accuracy analysis:
 *
 *   1. StatsAgent       — DB historical stats, form, H2H
 *   2. DeepPredAgent    — Gemini AI deep prediction
 *   3. NewsAgent        — Real-time news (Google RSS) filtered by team names
 *   4. QALayer          — Validates each agent output, scores 0-100
 *   5. SynthesisAgent   — Gemini re-run with ALL context merged → final result
 *
 * The orchestrator shares a live context object among agents so each one
 * can enrich the next one's input.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env";
import { getTeamStats, getHeadToHead } from "./agents";
import type { TeamStats, HeadToHeadStats } from "./agents";
import { deepPredictMatch } from "./deepPredictionAgent";
import type { DeepMatchPrediction } from "./deepPredictionAgent";
import { fetchIsraeliFootballNews } from "./newsScraperAgent";
import type { NewsItem } from "./newsScraperAgent";

// ── Shared context (lives for the duration of one orchestration run) ──────────

export interface AgentSharedContext {
  homeTeam: string;
  awayTeam: string;
  league: string;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  h2h?: HeadToHeadStats;
  matchNews: NewsItem[];
  homeNews: NewsItem[];
  awayNews: NewsItem[];
  deepPrediction?: DeepMatchPrediction;
  timestamp: string;
}

// ── Agent report (QA output per agent) ───────────────────────────────────────

export interface AgentReport {
  agentId: string;
  agentName: string;
  status: "success" | "failed" | "partial";
  executionMs: number;
  qaScore: number;       // 0–100
  qaIssues: string[];
  summary: string;
}

// ── Final orchestrated prediction ─────────────────────────────────────────────

export interface OrchestratedPrediction extends DeepMatchPrediction {
  agentReports: AgentReport[];
  qaOverallScore: number;       // weighted average of all agent QA scores
  qaReport: string;             // human-readable QA summary
  newsInfluence: string;        // how news affected the final prediction
  newsHeadlines: string[];      // top relevant headlines used
  contextSummary: string;       // what data was available
  orchestratedAt: string;
  orchestratorVersion: string;
}

// ── QA Layer ──────────────────────────────────────────────────────────────────

function qaDeepPrediction(pred: DeepMatchPrediction): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  const probSum = pred.homeWinProb + pred.drawProb + pred.awayWinProb;
  if (Math.abs(probSum - 100) > 3) {
    issues.push(`הסתברויות מסכמות ${probSum}% (צריך 100%)`);
    score -= 20;
  }

  if (pred.predictedHomeGoals < 0 || pred.predictedHomeGoals > 6) {
    issues.push(`שערי בית חריגים: ${pred.predictedHomeGoals}`);
    score -= 10;
  }
  if (pred.predictedAwayGoals < 0 || pred.predictedAwayGoals > 6) {
    issues.push(`שערי חוץ חריגים: ${pred.predictedAwayGoals}`);
    score -= 10;
  }

  if (!pred.resultReasoning || pred.resultReasoning.length < 10) {
    issues.push("נימוק תוצאה קצר מדי");
    score -= 15;
  }
  if (!pred.fullSummary || pred.fullSummary.length < 30) {
    issues.push("סיכום קצר מדי");
    score -= 15;
  }

  // Consistency check: result vs probabilities
  const maxProb = Math.max(pred.homeWinProb, pred.drawProb, pred.awayWinProb);
  const expectedResult =
    maxProb === pred.homeWinProb ? "home_win" :
    maxProb === pred.drawProb    ? "draw"     : "away_win";
  if (pred.result !== expectedResult) {
    issues.push(`תוצאה (${pred.result}) לא עקבית עם הסתברויות (${expectedResult} הגבוה ביותר)`);
    score -= 15;
  }

  return { score: Math.max(0, score), issues };
}

function qaStats(stats: TeamStats): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  if (stats.totalMatches === 0) {
    issues.push("אין נתונים היסטוריים בבסיס הנתונים");
    score = 40;
  } else if (stats.totalMatches < 5) {
    issues.push(`מספר משחקים נמוך (${stats.totalMatches}) — ביטחון נמוך`);
    score -= 20;
  }
  return { score: Math.max(0, score), issues };
}

function qaNews(news: NewsItem[]): { score: number; issues: string[] } {
  if (news.length === 0) return { score: 50, issues: ["לא נמצאו ידיעות עדכניות"] };
  if (news.length < 3)   return { score: 70, issues: [`רק ${news.length} ידיעות נמצאו`] };
  return { score: 100, issues: [] };
}

// ── News filtering for a specific team ────────────────────────────────────────

function filterNewsForTeam(news: NewsItem[], teamName: string): NewsItem[] {
  const name = teamName.toLowerCase();
  return news.filter(
    (n) =>
      n.title.toLowerCase().includes(name) ||
      n.summary.toLowerCase().includes(name)
  );
}

// ── Synthesis prompt (Gemini) ─────────────────────────────────────────────────

function buildSynthesisPrompt(ctx: AgentSharedContext, deep: DeepMatchPrediction): string {
  const formHe = (f: Array<"W" | "D" | "L">) =>
    f.length ? f.map((r) => (r === "W" ? "נ" : r === "D" ? "ת" : "ה")).join("") : "אין";

  const newsSection =
    ctx.matchNews.length > 0
      ? `== ידיעות עדכניות שנמצאו (${ctx.matchNews.length}) ==\n` +
        ctx.matchNews
          .slice(0, 10)
          .map((n) => `• [${n.source}] ${n.title}`)
          .join("\n")
      : "לא נמצאו ידיעות עדכניות.";

  const statsSection = ctx.homeStats && ctx.awayStats && ctx.h2h
    ? `== נתונים סטטיסטיים ==
${ctx.homeTeam}: ${ctx.homeStats.wins}נ/${ctx.homeStats.draws}ת/${ctx.homeStats.losses}ה | בית: ${ctx.homeStats.homeWinRate}% | פורמה: ${formHe(ctx.homeStats.form)}
${ctx.awayTeam}: ${ctx.awayStats.wins}נ/${ctx.awayStats.draws}ת/${ctx.awayStats.losses}ה | חוץ: ${ctx.awayStats.awayWinRate}% | פורמה: ${formHe(ctx.awayStats.form)}
ראש-בראש: ${ctx.h2h.totalMatches} משחקים — ${ctx.homeTeam} ${ctx.h2h.team1Wins}נ / ${ctx.awayTeam} ${ctx.h2h.team2Wins}נ / ${ctx.h2h.draws}ת`
    : "נתונים סטטיסטיים לא זמינים.";

  const deepSection = `== ניתוח AI ראשוני ==
הסתברויות: בית ${deep.homeWinProb}% | תיקו ${deep.drawProb}% | חוץ ${deep.awayWinProb}%
תוצאה מנובאת: ${deep.result} | תוצאה: ${deep.predictedHomeGoals}–${deep.predictedAwayGoals}
ניתוח ראשוני: ${deep.resultReasoning}`;

  return `אתה סוכן AI בכיר — מנהל צוות ניתוח כדורגל ישראלי. קיבלת דוחות ממספר סוכנים על המשחק:
${ctx.homeTeam} נגד ${ctx.awayTeam} (${ctx.league === "ligat_hael" ? "ליגת העל" : "הליגה הלאומית"})

${statsSection}

${deepSection}

${newsSection}

משימתך: סנתז את כל המידע לניבוי מאוחד, מדויק ומפורט יותר. שים לב במיוחד לידיעות עדכניות (פציעות, השעיות, משחק לחץ, מאמן חדש, שחקן חוזר).

ענה בפורמט JSON בלבד:
{
  "result": "home_win" | "draw" | "away_win",
  "homeWinProb": <0-100>,
  "drawProb": <0-100>,
  "awayWinProb": <0-100>,
  "predictedHomeGoals": <0-5>,
  "predictedAwayGoals": <0-5>,
  "totalGoalsOver25": true | false,
  "predictedCorners": <4-14>,
  "cornersOver95": true | false,
  "predictedYellowCards": <1-7>,
  "yellowCardsOver35": true | false,
  "redCardExpected": true | false,
  "resultReasoning": "<נימוק מקצועי 1-2 משפטים בעברית>",
  "goalsReasoning": "<נימוק שערים>",
  "cornersReasoning": "<נימוק קרנות>",
  "cardsReasoning": "<נימוק כרטיסים>",
  "fullSummary": "<ניתוח מקיף 4-5 משפטים המשלב סטטיסטיקה + חדשות>",
  "keyFactors": ["<גורם1>", "<גורם2>", "<גורם3>", "<גורם4>"],
  "newsInfluence": "<משפט 1-2 כיצד החדשות השפיעו על הניבוי>",
  "newsHeadlines": ["<כותרת1>", "<כותרת2>", "<כותרת3>"]
}

חשוב: הסתברויות חייבות לסכום 100. הישאר מקצועי ומדויק.`;
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────

export async function orchestrateMatchPrediction(
  homeTeam: string,
  awayTeam: string,
  league = "ligat_hael"
): Promise<OrchestratedPrediction> {
  const t0 = Date.now();
  const ctx: AgentSharedContext = {
    homeTeam,
    awayTeam,
    league,
    matchNews: [],
    homeNews: [],
    awayNews: [],
    timestamp: new Date().toISOString(),
  };
  const reports: AgentReport[] = [];

  // ── Step 1: Run all data-gathering agents in parallel ──────────────────────
  const [statsResult, newsResult, deepResult] = await Promise.allSettled([
    // Agent A: Statistics
    (async () => {
      const t = Date.now();
      const [homeStats, awayStats, h2h] = await Promise.all([
        getTeamStats(homeTeam),
        getTeamStats(awayTeam),
        getHeadToHead(homeTeam, awayTeam),
      ]);
      ctx.homeStats = homeStats;
      ctx.awayStats = awayStats;
      ctx.h2h = h2h;

      const homeQa = qaStats(homeStats);
      const awayQa = qaStats(awayStats);
      const score = Math.round((homeQa.score + awayQa.score) / 2);

      reports.push({
        agentId: "stats",
        agentName: "סוכן סטטיסטיקה",
        status: "success",
        executionMs: Date.now() - t,
        qaScore: score,
        qaIssues: [...homeQa.issues, ...awayQa.issues],
        summary: `${homeTeam}: ${homeStats.totalMatches} משחקים | ${awayTeam}: ${awayStats.totalMatches} משחקים | H2H: ${h2h.totalMatches}`,
      });
      return { homeStats, awayStats, h2h };
    })(),

    // Agent B: News Scraper
    (async () => {
      const t = Date.now();
      const allNews = await fetchIsraeliFootballNews();
      const homeNews = filterNewsForTeam(allNews, homeTeam);
      const awayNews = filterNewsForTeam(allNews, awayTeam);
      const matchNews = Array.from(
        new Map(
          [...homeNews, ...awayNews].map((n) => [n.id, n])
        ).values()
      ).slice(0, 15);

      ctx.matchNews = matchNews;
      ctx.homeNews  = homeNews;
      ctx.awayNews  = awayNews;

      const qa = qaNews(matchNews);
      reports.push({
        agentId: "news",
        agentName: "סוכן חדשות",
        status: "success",
        executionMs: Date.now() - t,
        qaScore: qa.score,
        qaIssues: qa.issues,
        summary: `${homeNews.length} ידיעות על ${homeTeam} | ${awayNews.length} ידיעות על ${awayTeam}`,
      });
      return matchNews;
    })(),

    // Agent C: Deep Prediction (Gemini round 1)
    (async () => {
      const t = Date.now();
      const deep = await deepPredictMatch(homeTeam, awayTeam, league);
      ctx.deepPrediction = deep;

      const qa = qaDeepPrediction(deep);
      reports.push({
        agentId: "deep_pred",
        agentName: "סוכן ניבוי עמוק",
        status: qa.issues.length > 2 ? "partial" : "success",
        executionMs: Date.now() - t,
        qaScore: qa.score,
        qaIssues: qa.issues,
        summary: `${deep.result} | בית ${deep.homeWinProb}% | תיקו ${deep.drawProb}% | חוץ ${deep.awayWinProb}%`,
      });
      return deep;
    })(),
  ]);

  // Extract deep prediction base (used as fallback)
  const basePred: DeepMatchPrediction =
    deepResult.status === "fulfilled"
      ? deepResult.value
      : {
          homeTeam, awayTeam, league,
          result: "home_win",
          homeWinProb: 45, drawProb: 27, awayWinProb: 28,
          predictedHomeGoals: 1, predictedAwayGoals: 1,
          totalGoalsOver25: false,
          predictedCorners: 9, cornersOver95: false,
          predictedYellowCards: 4, yellowCardsOver35: false,
          redCardExpected: false,
          resultReasoning: "נתונים מוגבלים — ניבוי סטטיסטי בסיסי",
          goalsReasoning: "ממוצע ליגתי",
          cornersReasoning: "ממוצע ליגתי",
          cardsReasoning: "ממוצע ליגתי",
          fullSummary: "ניבוי על בסיס נתונים חלקיים בלבד.",
          keyFactors: ["נתונים מוגבלים"],
          confidence: "low",
          dataPoints: 0,
        };

  // ── Step 2: Synthesis — Gemini round 2 with ALL context ───────────────────
  let finalPred = { ...basePred };
  let newsInfluence = "לא נמצאו ידיעות משפיעות";
  let newsHeadlines: string[] = [];
  const synthT = Date.now();
  let synthStatus: AgentReport["status"] = "failed";

  const apiKey = ENV.aiApiKey;
  if (apiKey && ctx.deepPrediction) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = buildSynthesisPrompt(ctx, ctx.deepPrediction);
      const resp = await model.generateContent(prompt);
      const raw = resp.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(raw);

      newsInfluence = parsed.newsInfluence ?? newsInfluence;
      newsHeadlines = parsed.newsHeadlines ?? [];

      // Merge synthesis into final prediction
      finalPred = {
        ...basePred,
        result: parsed.result ?? basePred.result,
        homeWinProb: parsed.homeWinProb ?? basePred.homeWinProb,
        drawProb: parsed.drawProb ?? basePred.drawProb,
        awayWinProb: parsed.awayWinProb ?? basePred.awayWinProb,
        predictedHomeGoals: parsed.predictedHomeGoals ?? basePred.predictedHomeGoals,
        predictedAwayGoals: parsed.predictedAwayGoals ?? basePred.predictedAwayGoals,
        totalGoalsOver25: parsed.totalGoalsOver25 ?? basePred.totalGoalsOver25,
        predictedCorners: parsed.predictedCorners ?? basePred.predictedCorners,
        cornersOver95: parsed.cornersOver95 ?? basePred.cornersOver95,
        predictedYellowCards: parsed.predictedYellowCards ?? basePred.predictedYellowCards,
        yellowCardsOver35: parsed.yellowCardsOver35 ?? basePred.yellowCardsOver35,
        redCardExpected: parsed.redCardExpected ?? basePred.redCardExpected,
        resultReasoning: parsed.resultReasoning ?? basePred.resultReasoning,
        goalsReasoning: parsed.goalsReasoning ?? basePred.goalsReasoning,
        cornersReasoning: parsed.cornersReasoning ?? basePred.cornersReasoning,
        cardsReasoning: parsed.cardsReasoning ?? basePred.cardsReasoning,
        fullSummary: parsed.fullSummary ?? basePred.fullSummary,
        keyFactors: parsed.keyFactors ?? basePred.keyFactors,
      };

      // QA the synthesis output
      const synQa = qaDeepPrediction(finalPred);
      synthStatus = synQa.issues.length > 2 ? "partial" : "success";
      reports.push({
        agentId: "synthesis",
        agentName: "סוכן סינתזה (מנהל)",
        status: synthStatus,
        executionMs: Date.now() - synthT,
        qaScore: synQa.score,
        qaIssues: synQa.issues,
        summary: `ניבוי מאוחד: ${finalPred.result} | ${finalPred.homeWinProb}%/${finalPred.drawProb}%/${finalPred.awayWinProb}%`,
      });
    } catch (err) {
      synthStatus = "failed";
      reports.push({
        agentId: "synthesis",
        agentName: "סוכן סינתזה (מנהל)",
        status: "failed",
        executionMs: Date.now() - synthT,
        qaScore: 0,
        qaIssues: [`שגיאת Gemini: ${(err as Error).message?.slice(0, 60)}`],
        summary: "נכשל — משתמש בתוצאת ניבוי עמוק ישיר",
      });
    }
  }

  // ── Step 3: QA Overall Score ───────────────────────────────────────────────
  const weights: Record<string, number> = {
    stats: 0.25,
    news: 0.15,
    deep_pred: 0.30,
    synthesis: 0.30,
  };
  const qaOverallScore = Math.round(
    reports.reduce((sum, r) => sum + r.qaScore * (weights[r.agentId] ?? 0.1), 0)
  );

  const allIssues = reports.flatMap((r) => r.qaIssues);
  const qaReport =
    allIssues.length === 0
      ? "✓ כל הסוכנים עברו בדיקת איכות ללא בעיות"
      : `${allIssues.length} בעיות זוהו: ${allIssues.slice(0, 3).join(" | ")}`;

  // ── Context summary ────────────────────────────────────────────────────────
  const contextSummary = [
    ctx.homeStats ? `${homeTeam}: ${ctx.homeStats.totalMatches} משחקים בDB` : `${homeTeam}: אין נתונים`,
    ctx.awayStats ? `${awayTeam}: ${ctx.awayStats.totalMatches} משחקים בDB` : `${awayTeam}: אין נתונים`,
    ctx.h2h       ? `H2H: ${ctx.h2h.totalMatches} עימותים` : "H2H: אין",
    `${ctx.matchNews.length} ידיעות עדכניות שולבו`,
    `זמן ריצה כולל: ${Date.now() - t0}ms`,
  ].join(" | ");

  return {
    ...finalPred,
    agentReports: reports,
    qaOverallScore,
    qaReport,
    newsInfluence,
    newsHeadlines,
    contextSummary,
    orchestratedAt: new Date().toISOString(),
    orchestratorVersion: "1.0",
  };
}
