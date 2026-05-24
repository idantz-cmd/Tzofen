/**
 * Deep Match Prediction Agent
 * Uses DB historical stats + Gemini to produce a full Hebrew match analysis:
 * result, exact score, goals, corners, cards with detailed reasoning.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env";
import { getTeamStats, getHeadToHead } from "./agents";

export interface DeepMatchPrediction {
  homeTeam: string;
  awayTeam: string;
  league: string;
  // Result
  result: "home_win" | "draw" | "away_win";
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  // Score
  predictedHomeGoals: number;
  predictedAwayGoals: number;
  totalGoalsOver25: boolean;
  // Corners
  predictedCorners: number;
  cornersOver95: boolean;
  // Cards
  predictedYellowCards: number;
  yellowCardsOver35: boolean;
  redCardExpected: boolean;
  // Explanations (Hebrew)
  resultReasoning: string;
  goalsReasoning: string;
  cornersReasoning: string;
  cardsReasoning: string;
  fullSummary: string;
  keyFactors: string[];
  confidence: "low" | "medium" | "high";
  dataPoints: number;
}

export async function deepPredictMatch(
  homeTeam: string,
  awayTeam: string,
  league: string = "ligat_hael"
): Promise<DeepMatchPrediction> {
  const [homeStats, awayStats, h2h] = await Promise.all([
    getTeamStats(homeTeam),
    getTeamStats(awayTeam),
    getHeadToHead(homeTeam, awayTeam),
  ]);

  const dataPoints = homeStats.totalMatches + awayStats.totalMatches + h2h.totalMatches * 2;
  const confidence: "low" | "medium" | "high" =
    dataPoints < 10 ? "low" : dataPoints < 30 ? "medium" : "high";

  const formHe = (f: Array<"W" | "D" | "L">) =>
    f.length ? f.map((r) => (r === "W" ? "נ" : r === "D" ? "ת" : "ה")).join("") : "אין";

  // Build context for Gemini
  const statsContext = `
== נתונים סטטיסטיים מבסיס הנתונים ==

קבוצת בית: ${homeTeam}
- משחקים: ${homeStats.totalMatches} | ניצחונות: ${homeStats.wins} | תיקו: ${homeStats.draws} | הפסדים: ${homeStats.losses}
- אחוז ניצחון כולל: ${homeStats.winRate}%
- ביתי: ${homeStats.homeWins}/${homeStats.homeMatches} (${homeStats.homeWinRate}%)
- שערים לגאמה: ${homeStats.avgGoalsScored} בעד / ${homeStats.avgGoalsConceded} נגד
- פורמה אחרונה (5 משחקים): ${formHe(homeStats.form)}

קבוצת חוץ: ${awayTeam}
- משחקים: ${awayStats.totalMatches} | ניצחונות: ${awayStats.wins} | תיקו: ${awayStats.draws} | הפסדים: ${awayStats.losses}
- אחוז ניצחון כולל: ${awayStats.winRate}%
- חוצה: ${awayStats.awayWins}/${awayStats.awayMatches} (${awayStats.awayWinRate}%)
- שערים לגאמה: ${awayStats.avgGoalsScored} בעד / ${awayStats.avgGoalsConceded} נגד
- פורמה אחרונה (5 משחקים): ${formHe(awayStats.form)}

היסטוריית ראש-בראש:
- סה"כ: ${h2h.totalMatches} משחקים
- ${homeTeam}: ${h2h.team1Wins} ניצחונות
- ${awayTeam}: ${h2h.team2Wins} ניצחונות
- תיקו: ${h2h.draws}
- ממוצע שערים למשחק בהתנגשויות: ${h2h.avgTotalGoals}
${h2h.recentMatches.length > 0 ? `- 3 אחרונים: ${h2h.recentMatches.slice(0, 3).map(m => `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`).join(" | ")}` : ""}

ליגה: ${league === "ligat_hael" ? "ליגת העל הישראלית" : "הליגה הלאומית הישראלית"}
`.trim();

  // Try Gemini for enriched analysis
  let geminiAnalysis: Partial<DeepMatchPrediction> = {};

  const apiKey = ENV.aiApiKey;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `אתה סוכן AI מומחה לכדורגל ישראלי. נתח את המשחק הבא ותן ניבוי מפורט.

${statsContext}

ענה בפורמט JSON בלבד (ללא קוד בלוק, רק JSON נקי):
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
  "resultReasoning": "<משפט קצר בעברית — מדוע הניבוי הזה>",
  "goalsReasoning": "<משפט בעברית על צפי שערים>",
  "cornersReasoning": "<משפט בעברית על צפי קרנות>",
  "cardsReasoning": "<משפט בעברית על צפי כרטיסים>",
  "fullSummary": "<פסקת ניתוח מקצועית של 3-4 משפטים בעברית>",
  "keyFactors": ["<גורם1>", "<גורם2>", "<גורם3>"]
}

הנחיות: סכום ההסתברויות חייב להיות 100. הישאר מקצועי ומדויק.`;

      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();
      const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      geminiAnalysis = JSON.parse(jsonText);
    } catch (err) {
      console.warn("Gemini prediction failed, using statistical fallback:", err);
    }
  }

  // Statistical fallback if Gemini unavailable
  const avgGoals = h2h.totalMatches >= 3
    ? h2h.avgTotalGoals
    : (homeStats.avgGoalsScored + awayStats.avgGoalsScored) / 2;

  // Base probabilities from stats
  let homeScore = 50 + 5;
  let awayScore = 45;
  if (homeStats.totalMatches >= 3) homeScore += (homeStats.homeWinRate - 50) * 0.3;
  if (awayStats.totalMatches >= 3) awayScore += (awayStats.awayWinRate - 50) * 0.3;
  if (h2h.totalMatches >= 2) {
    homeScore += (h2h.team1WinRate - 50) * 0.25;
    awayScore += (h2h.team2WinRate - 50) * 0.25;
  }
  const drawBase = avgGoals > 2.5 ? 20 : avgGoals < 1.5 ? 30 : 25;
  const total = homeScore + awayScore;
  const homeWinProb = geminiAnalysis.homeWinProb ?? Math.round(Math.max(15, Math.min(70, (homeScore / total) * (100 - drawBase))));
  const awayWinProb = geminiAnalysis.awayWinProb ?? Math.round(Math.max(10, Math.min(65, (awayScore / total) * (100 - drawBase))));
  const drawProb = geminiAnalysis.drawProb ?? (100 - homeWinProb - awayWinProb);

  const maxProb = Math.max(homeWinProb, drawProb, awayWinProb);
  const result: "home_win" | "draw" | "away_win" = geminiAnalysis.result ??
    (maxProb === homeWinProb ? "home_win" : maxProb === drawProb ? "draw" : "away_win");

  const predictedHomeGoals = geminiAnalysis.predictedHomeGoals ?? Math.round(homeStats.avgGoalsScored * 10) / 10;
  const predictedAwayGoals = geminiAnalysis.predictedAwayGoals ?? Math.round(awayStats.avgGoalsScored * 10) / 10;
  const predictedCorners = geminiAnalysis.predictedCorners ?? 9;
  const predictedYellowCards = geminiAnalysis.predictedYellowCards ?? 4;

  const resultReasoning = geminiAnalysis.resultReasoning ??
    `${homeTeam} עם ${homeStats.homeWinRate}% ניצחונות ביתיים מול ${awayTeam} עם ${awayStats.awayWinRate}% ניצחונות חוצה`;
  const goalsReasoning = geminiAnalysis.goalsReasoning ??
    `ממוצע ${homeStats.avgGoalsScored} שערים ל${homeTeam} ו-${awayStats.avgGoalsScored} ל${awayTeam}`;
  const cornersReasoning = geminiAnalysis.cornersReasoning ??
    `ניבוי סטנדרטי לרמת הליגה`;
  const cardsReasoning = geminiAnalysis.cardsReasoning ??
    `ניבוי על בסיס ממוצע הליגה`;
  const fullSummary = geminiAnalysis.fullSummary ??
    `${homeTeam} מארח את ${awayTeam} עם יתרון ביתי. ${resultReasoning}. ${goalsReasoning}.`;
  const keyFactors = geminiAnalysis.keyFactors ?? [
    `פורמה ביתית של ${homeTeam}: ${formHe(homeStats.form)}`,
    `פורמה חוצה של ${awayTeam}: ${formHe(awayStats.form)}`,
    h2h.totalMatches > 0 ? `${h2h.totalMatches} עימותים ישירים בהיסטוריה` : "אין היסטוריה ישירה",
  ];

  return {
    homeTeam,
    awayTeam,
    league,
    result,
    homeWinProb,
    drawProb,
    awayWinProb,
    predictedHomeGoals: geminiAnalysis.predictedHomeGoals ?? Math.round(predictedHomeGoals),
    predictedAwayGoals: geminiAnalysis.predictedAwayGoals ?? Math.round(predictedAwayGoals),
    totalGoalsOver25: geminiAnalysis.totalGoalsOver25 ?? (predictedHomeGoals + predictedAwayGoals > 2.5),
    predictedCorners,
    cornersOver95: geminiAnalysis.cornersOver95 ?? (predictedCorners > 9.5),
    predictedYellowCards,
    yellowCardsOver35: geminiAnalysis.yellowCardsOver35 ?? (predictedYellowCards > 3.5),
    redCardExpected: geminiAnalysis.redCardExpected ?? false,
    resultReasoning,
    goalsReasoning,
    cornersReasoning,
    cardsReasoning,
    fullSummary,
    keyFactors,
    confidence,
    dataPoints,
  };
}
