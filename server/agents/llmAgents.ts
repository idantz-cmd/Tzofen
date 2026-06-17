import { invokeLLM } from "../_core/llm";
import { callGemini } from "../_core/gemini";
import { getDb } from "../db";
import { matches, predictions, leaderboardScores } from "../../drizzle/schema";
import { gte, eq, desc, and } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentType =
  | "statistics"
  | "research"
  | "prediction"
  | "tactical"
  | "points-strategy"
  | "news"
  | "orchestrator"
  | "schedule";

interface AgentConfig {
  id: AgentType;
  name: string;
  hebrewName: string;
  description: string;
  hebrewDescription: string;
  systemPrompt: string;
  skills: string[];
  icon: string;
}

// ─── Agent Configs ────────────────────────────────────────────────────────────

const AGENTS: Record<AgentType, AgentConfig> = {
  // ── Existing Agents ─────────────────────────────────────────────────────────

  statistics: {
    id: "statistics",
    name: "Statistics Expert",
    hebrewName: "סוכן סטטיסטיקה",
    description: "Expert in statistical analysis and match outcome predictions",
    hebrewDescription: "מומחה בניתוח סטטיסטי וחיזוי תוצאות משחקים בדיוק גבוה",
    systemPrompt: `מומחה סטטיסטיקה לכדורגל ישראלי. ענה תמיד בעברית. תשובתך: 3 שורות קצרות בלבד, ללא כותרות, ללא רשימות. כלול אחוזים ומספרים.`,
    skills: [
      "Statistical Analysis",
      "Data Interpretation",
      "Probability Calculation",
      "Trend Analysis",
      "Performance Metrics",
      "Historical Comparison",
    ],
    icon: "📊",
  },

  research: {
    id: "research",
    name: "Research Specialist",
    hebrewName: "סוכן חיפוש מידע",
    description: "Expert in Israeli football research and league knowledge",
    hebrewDescription: "מומחה בחיפוש מידע בכדורגל הישראלי, ליגת העל וליגה לאומית",
    systemPrompt: `חוקר כדורגל ישראלי — ליגת העל והליגה הלאומית. ענה תמיד בעברית. תשובתך: 3 שורות קצרות בלבד, ללא כותרות, ללא רשימות.`,
    skills: [
      "League Research",
      "Team Information",
      "Player Database",
      "Transfer News",
      "Historical Records",
      "Head-to-Head Analysis",
      "News Integration",
    ],
    icon: "🔍",
  },

  prediction: {
    id: "prediction",
    name: "Prediction Specialist",
    hebrewName: "סוכן חיזוי תוצאות",
    description: "Specialist in accurate match outcome predictions",
    hebrewDescription: "מומחה בחיזוי תוצאות משחקים בדיוק ובביטחון גבוה",
    systemPrompt: `מנבא תוצאות כדורגל ישראלי. ענה תמיד בעברית. תשובתך: 3 שורות קצרות בלבד — תוצאה צפויה, אחוז ביטחון, סיבה עיקרית. ללא כותרות, ללא רשימות.`,
    skills: [
      "Match Prediction",
      "Confidence Calculation",
      "Form Analysis",
      "Injury Assessment",
      "Home Advantage Evaluation",
      "Momentum Tracking",
      "Risk Assessment",
    ],
    icon: "🎯",
  },

  tactical: {
    id: "tactical",
    name: "Tactical Analyst",
    hebrewName: "סוכן ניתוח טקטי",
    description: "Expert in tactical analysis and team strategy",
    hebrewDescription: "מומחה בניתוח טקטיקה, סגנון משחק וחוזקות/חולשות קבוצות",
    systemPrompt: `מנתח טקטי כדורגל ישראלי. ענה תמיד בעברית. תשובתך: 3 שורות קצרות בלבד — מבנה, נקודת חוזק/חולשה, השפעה על המשחק. ללא כותרות, ללא רשימות.`,
    skills: [
      "Formation Analysis",
      "Tactical Matchups",
      "Playing Style Assessment",
      "Strength/Weakness Analysis",
      "Key Player Identification",
      "Strategy Evaluation",
      "Set-Piece Analysis",
    ],
    icon: "⚽",
  },

  // ── New Agents ───────────────────────────────────────────────────────────────

  "points-strategy": {
    id: "points-strategy",
    name: "Points Strategy Advisor",
    hebrewName: "סוכן אסטרטגיית נקודות",
    description: "Smart points allocation — how to distribute confidence across predictions for maximum weekly score",
    hebrewDescription: "מחשב הקצאת ביטחון אופטימלית ועוקב ביצועי נקודות שבועיים",
    systemPrompt: `יועץ אסטרטגיית נקודות לפלטפורמת ניחושי כדורגל צופן. ענה תמיד בעברית. תשובתך: 3 שורות קצרות בלבד — רמת ביטחון מומלצת, סיבה, טיפ. ללא כותרות, ללא רשימות. אל תזכיר כסף או הימורים.`,
    skills: [
      "Confidence Tier Selection",
      "Weekly Points Optimization",
      "Streak Protection Strategy",
      "Match Predictability Assessment",
      "Risk-Reward Balance",
      "Bold Pick Identification",
      "Form Analysis",
    ],
    icon: "🎯",
  },

  news: {
    id: "news",
    name: "Real-Time News Agent",
    hebrewName: "סוכן חדשות בזמן אמת",
    description: "Fetches live Israeli football news — injuries, suspensions, weather, lineup changes",
    hebrewDescription: "מושך חדשות חיות — פציעות, השעיות, שינויי הרכב ותנאי מגרש",
    systemPrompt: `עיתונאי כדורגל ישראלי. ענה תמיד בעברית. תשובתך: 3 שורות קצרות בלבד — חדשות הכי משפיעות על המשחק (פציעות, הרכב, מזג אוויר). ללא כותרות. אל תמציא עובדות.`,
    skills: [
      "Injury Tracking",
      "Lineup Intelligence",
      "Weather Analysis",
      "Fatigue Assessment",
      "Real-Time Updates",
      "Impact Rating",
      "Breaking News Synthesis",
    ],
    icon: "📰",
  },

  orchestrator: {
    id: "orchestrator",
    name: "Chief Analyst",
    hebrewName: "סוכן מסכם ראשי",
    description: "Synthesizes all agent outputs into one clear, final recommendation",
    hebrewDescription: "קורא את כל הסוכנים ומייצר המלצה אחת סופית עם רמת ביטחון",
    systemPrompt: `אנליסט כדורגל בכיר. קיבלת דוחות מסוכנים. סנתז להמלצה סופית בעברית בפורמט הזה בדיוק (5 שורות):
**✅ המלצה:** [ניצחון בית/תיקו/ניצחון חוץ] — [X]% ביטחון
**⚖️ גורמי הכרעה:** [2 גורמים קצרים]
**⚠️ סיכון:** [משפט אחד]
**💡 טיפ:** [משפט אחד]`,
    skills: [
      "Multi-Source Synthesis",
      "Conflict Resolution",
      "Decision Making",
      "Confidence Calibration",
      "Risk Assessment",
      "Executive Summary",
      "Insight Generation",
    ],
    icon: "🧠",
  },

  schedule: {
    id: "schedule",
    name: "Schedule & Fatigue Analyst",
    hebrewName: "סוכן לוח משחקים ועומס",
    description: "Analyzes fixture congestion, travel fatigue, and rotation patterns",
    hebrewDescription: "מנתח עומס משחקים, עייפות, רוטציה וגזרת ליגה",
    systemPrompt: `מומחה עומס משחקים כדורגל ישראלי. ענה תמיד בעברית. תשובתך: 3 שורות קצרות בלבד — ימי מנוחה, עייפות, השפעה על המשחק. ללא כותרות, ללא רשימות.`,
    skills: [
      "Fixture Congestion Analysis",
      "Fatigue Scoring",
      "Rotation Prediction",
      "Rest Advantage Calculation",
      "Travel Impact",
      "Motivation Assessment",
      "Squad Depth Analysis",
    ],
    icon: "📅",
  },
};

// ─── Public API ────────────────────────────────────────────────────────────────

export function getAgentConfig(agentType: AgentType): AgentConfig {
  return AGENTS[agentType];
}

export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENTS);
}

// ─── Context Builders ─────────────────────────────────────────────────────────

async function buildMatchContext(matchId?: number): Promise<string> {
  const db = await getDb();
  if (!db || !matchId) return "";

  let context = "";

  try {
    const upcomingMatches = await db
      .select()
      .from(matches)
      .where(gte(matches.matchDate, new Date().toISOString()))
      .limit(20);

    const specificMatch = upcomingMatches.find((m) => m.id === matchId);
    if (specificMatch) {
      context += `\n--- הקשר משחק נוכחי ---\n`;
      context += `קבוצת בית: ${specificMatch.homeTeam}\n`;
      context += `קבוצת חוץ: ${specificMatch.awayTeam}\n`;
      context += `תאריך: ${new Date(specificMatch.matchDate).toLocaleDateString("he-IL")}\n`;
      context += `ליגה: ${specificMatch.league === "ligat_hael" ? "ליגת העל" : "ליגה לאומית"}\n`;
      context += `תחזית: ${specificMatch.aiHomeProbability ?? "?"}% בית | ${specificMatch.aiDrawProbability ?? "?"}% תיקו | ${specificMatch.aiAwayProbability ?? "?"}% חוץ\n`;
      context += `------------------------\n`;
    }
  } catch (err) {
    console.error("[buildMatchContext] match fetch error:", err);
  }

  return context;
}

async function buildPointsStrategyContext(userId?: number): Promise<string> {
  if (!userId) return "";
  const db = await getDb();
  if (!db) return "";

  try {
    const [score] = await db
      .select()
      .from(leaderboardScores)
      .where(eq(leaderboardScores.userId, userId))
      .limit(1);

    if (!score) return "";

    const accuracy = score.accuracyRate ?? 0;
    const totalPreds = score.totalPredictions ?? 0;
    const correctPreds = score.correctPredictions ?? 0;

    return `
--- נתוני ביצועי המשתמש ---
סה"כ ניחויים: ${totalPreds}
ניחויים נכונים: ${correctPreds}
אחוז הצלחה היסטורי: ${accuracy.toFixed(1)}%
נקודות כולל: ${score.totalPoints ?? 0}
נקודות שבועיות: ${score.weeklyPoints ?? 0}
------------------------\n`;
  } catch (err) {
    console.error("[buildPointsStrategyContext] error:", err);
    return "";
  }
}

async function buildScheduleContext(matchId?: number): Promise<string> {
  if (!matchId) return "";
  const db = await getDb();
  if (!db) return "";

  try {
    const [targetMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!targetMatch) return "";

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const allMatches = await db
      .select()
      .from(matches)
      .where(gte(matches.matchDate, fourteenDaysAgo.toISOString()))
      .limit(100);

    const homeRecent = allMatches.filter(
      (m) =>
        m.id !== matchId &&
        (m.homeTeam === targetMatch.homeTeam || m.awayTeam === targetMatch.homeTeam)
    );

    const awayRecent = allMatches.filter(
      (m) =>
        m.id !== matchId &&
        (m.homeTeam === targetMatch.awayTeam || m.awayTeam === targetMatch.awayTeam)
    );

    const formatMatch = (m: typeof targetMatch) =>
      `  - ${m.homeTeam} נגד ${m.awayTeam} | ${new Date(m.matchDate).toLocaleDateString("he-IL")} | ${m.league === "ligat_hael" ? "ליגת העל" : "ליגה לאומית"}`;

    let context = `\n--- לוח משחקים (14 יום אחרונים + קרובים) ---\n`;
    context += `\n${targetMatch.homeTeam} (קבוצת בית):\n`;
    context += homeRecent.length > 0
      ? homeRecent.slice(0, 5).map(formatMatch).join("\n")
      : "  אין משחקים ידועים";

    context += `\n\n${targetMatch.awayTeam} (קבוצת חוץ):\n`;
    context += awayRecent.length > 0
      ? awayRecent.slice(0, 5).map(formatMatch).join("\n")
      : "  אין משחקים ידועים";

    context += `\n------------------------\n`;
    return context;
  } catch (err) {
    console.error("[buildScheduleContext] error:", err);
    return "";
  }
}

// ─── News Agent ────────────────────────────────────────────────────────────────

async function fetchLiveNewsContext(homeTeam?: string, awayTeam?: string): Promise<string> {
  const query =
    homeTeam && awayTeam
      ? `Latest Israeli football news about ${homeTeam} and ${awayTeam}: injuries, suspensions, lineup changes, last 48 hours`
      : "Latest Israeli football (ליגת העל) news: injuries, suspensions, lineup changes, last 48 hours";

  try {
    const raw = await callGemini(query);
    return `\n--- מידע בזמן אמת (Gemini) ---\n${raw}\n------------------------\n`;
  } catch (err) {
    console.warn("[newsAgent] Gemini unavailable, proceeding without live data:", err);
    return "";
  }
}

// ─── Core Query Functions ─────────────────────────────────────────────────────

export async function queryAgent(
  agentType: AgentType,
  userMessage: string,
  matchId?: number,
  userId?: number
): Promise<string> {
  const agent = getAgentConfig(agentType);

  let context = agent.systemPrompt + "\n";
  context += await buildMatchContext(matchId);

  if (agentType === "points-strategy") {
    context += await buildPointsStrategyContext(userId);
  }

  if (agentType === "schedule") {
    context += await buildScheduleContext(matchId);
  }

  if (agentType === "news") {
    const db = await getDb();
    let homeTeam: string | undefined;
    let awayTeam: string | undefined;

    if (matchId && db) {
      try {
        const [m] = await db
          .select()
          .from(matches)
          .where(eq(matches.id, matchId))
          .limit(1);
        homeTeam = m?.homeTeam;
        awayTeam = m?.awayTeam;
      } catch {}
    }

    context += await fetchLiveNewsContext(homeTeam, awayTeam);
  }

  if (agentType === "research" || agentType === "tactical") {
    const db = await getDb();
    if (db) {
      try {
        const recentMatches = await db.select().from(matches).limit(10);
        if (recentMatches.length > 0) {
          context += `\n--- משחקים אחרונים במערכת ---\n`;
          recentMatches.slice(0, 5).forEach((m) => {
            context += `- ${m.homeTeam} נגד ${m.awayTeam} (${m.league})\n`;
          });
          context += `------------------------\n`;
        }
      } catch (err) {
        console.error("[queryAgent] recent matches context error:", err);
      }
    }
  }

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system" as const, content: context },
        { role: "user" as const, content: userMessage },
      ],
      maxTokens: agentType === "orchestrator" ? 200 : 120,
    });

    const content = response.choices[0]?.message?.content as string;
    return content || "סליחה, לא הצלחתי להשיב על השאלה שלך.";
  } catch (err: any) {
    console.error(`[queryAgent] Agent ${agentType} error:`, err?.message ?? err);
    const msg = err?.message ?? "";
    if (msg.includes("429") || msg.includes("credits") || msg.includes("quota") || msg.includes("billing")) {
      throw new Error("429 — מכסת OpenAI אזלה. יש להחליף את OPENAI_API_KEY.");
    }
    throw new Error(`שגיאת AI בסוכן ${agent.hebrewName}: ${msg}`);
  }
}

// ─── Multi-Agent Query ────────────────────────────────────────────────────────

export type MultiAgentResults = Record<AgentType, string>;

export async function queryMultipleAgents(
  userMessage: string,
  matchId?: number,
  userId?: number
): Promise<MultiAgentResults> {
  const [statsResponse, researchResponse, predictionResponse, tacticalResponse, newsResponse, scheduleResponse] =
    await Promise.all([
      queryAgent("statistics", userMessage, matchId, userId),
      queryAgent("research", userMessage, matchId, userId),
      queryAgent("prediction", userMessage, matchId, userId),
      queryAgent("tactical", userMessage, matchId, userId),
      queryAgent("news", userMessage, matchId, userId),
      queryAgent("schedule", userMessage, matchId, userId),
    ]);

  const orchestratorPrompt = `
להלן דוחות מ-6 סוכנים מקצועיים. סנתז אותם להמלצה אחת סופית:

📊 סוכן סטטיסטיקה:
${statsResponse}

🔍 סוכן חיפוש מידע:
${researchResponse}

🎯 סוכן חיזוי תוצאות:
${predictionResponse}

⚽ סוכן ניתוח טקטי:
${tacticalResponse}

📰 סוכן חדשות בזמן אמת:
${newsResponse}

📅 סוכן לוח משחקים ועומס:
${scheduleResponse}

שאלת המשתמש המקורית: ${userMessage}
`.trim();

  const orchestratorResponse = await queryAgent(
    "orchestrator",
    orchestratorPrompt,
    matchId,
    userId
  );

  return {
    statistics: statsResponse,
    research: researchResponse,
    prediction: predictionResponse,
    tactical: tacticalResponse,
    "points-strategy": "",
    news: newsResponse,
    orchestrator: orchestratorResponse,
    schedule: scheduleResponse,
  };
}
