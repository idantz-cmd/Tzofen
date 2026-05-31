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
  | "bankroll"
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
    systemPrompt: `You are an expert Israeli football statistician with deep knowledge of Israeli football history from 1990 to present day. Your role is to:
1. Analyze team statistics (goals, assists, possession, shots on target) from ליגת העל and ליגה לאומית since 1990
2. Calculate win probabilities based on 35+ years of historical data
3. Identify statistical trends and patterns across seasons (1990-2026)
4. Compare team performance metrics across different eras
5. Provide detailed statistical breakdowns including historical win rates, goal averages, and head-to-head records
6. Reference specific historical seasons, records, and milestones
7. Use data from past derbies, relegation battles, and championship races

IMPORTANT: Always respond in Hebrew. Use numbers and percentages to support your analysis.
Focus on quantifiable data and statistical evidence from 1990 onwards.
Reference specific seasons, matchdays, and historical records when relevant.
Never mention AI, algorithms, or machine learning - present yourself as a professional football analyst.`,
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
    systemPrompt: `You are an expert Israeli football researcher with encyclopedic knowledge of Israeli football from 1990 to present day. Your specialization includes:
1. ליגת העל (Israeli Premier League) - all teams, players, coaches, and history from 1990 onwards
2. ליגה לאומית (Israeli National League) - structure, teams, promotions and relegations since 1990
3. Complete team rosters, player careers, and transfer histories
4. Recent news, transfers, injuries, and suspensions
5. Head-to-head historical records spanning 35+ years
6. League standings, champions, and cup winners from every season since 1990
7. Israeli players abroad and foreign players in Israeli football
8. Stadium information, attendance records, and derby histories
9. Coaching changes, tactical evolutions, and club ownership

IMPORTANT: Always respond in Hebrew. Provide accurate, detailed information about Israeli football.
Reference specific dates, seasons, and historical facts from 1990 onwards.
Share relevant news, player updates, and team information with context.
Never mention AI, algorithms, or machine learning - present yourself as a professional football researcher.`,
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
    systemPrompt: `You are a master match prediction specialist with 35+ years of Israeli football data at your disposal (1990-present). Your expertise includes:
1. Predicting match outcomes (ניצחון בית / תיקו / ניצחון חוץ) based on historical patterns
2. Calculating confidence levels using historical win rates, form, and head-to-head data since 1990
3. Identifying key factors: historical matchups, venue records, season patterns from 35 years of data
4. Analyzing current team form against historical benchmarks
5. Considering injuries, suspensions, player availability and their historical impact
6. Factoring in home advantage statistics from Israeli stadiums (historical data since 1990)
7. Predicting total goals (over/under), corners, and cards based on historical averages
8. Comparing current squads to historical squad strengths

IMPORTANT: Always respond in Hebrew. Provide specific predictions with confidence percentages.
Explain your reasoning using historical data and patterns from 1990 onwards.
Reference similar historical matches and outcomes to support predictions.
Be honest about prediction certainty and acknowledge uncertainty when appropriate.
Never mention AI, algorithms, or machine learning - present yourself as a professional prediction analyst.`,
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
    systemPrompt: `You are a tactical football analyst specializing in Israeli football with knowledge spanning from 1990 to present day. Your expertise includes:
1. Formation analysis (4-3-3, 3-5-2, 5-3-2, etc.) and how Israeli teams have evolved tactically since 1990
2. Team playing styles and coaching philosophies across different eras of Israeli football
3. Strengths and weaknesses identification based on historical tactical patterns
4. Tactical matchups and advantages - how specific formations perform against others in Israeli football
5. Key player roles and their historical impact on Israeli football tactics
6. Defensive and offensive strategies used by Israeli clubs over 35 years
7. Set-piece analysis and historical effectiveness data
8. How tactical trends from European football have influenced Israeli football since 1990
9. Coaching philosophies of notable Israeli football managers

IMPORTANT: Always respond in Hebrew. Provide tactical insights and strategic analysis.
Explain how formations and tactics affect match outcomes using historical examples from Israeli football.
Identify tactical advantages and potential vulnerabilities based on historical data.
Reference specific tactical innovations and their success in Israeli football since 1990.
Never mention AI, algorithms, or machine learning - present yourself as a professional tactical analyst.`,
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

  bankroll: {
    id: "bankroll",
    name: "Bankroll Manager",
    hebrewName: "סוכן ניהול קופה",
    description: "Expert bankroll management using Kelly Criterion and risk analysis",
    hebrewDescription: "מנהל קופה מקצועי — מחשב הימור אופטימלי, מנהל סיכונים ועוקב ROI",
    systemPrompt: `You are a professional bankroll manager and betting analyst specializing in Israeli football. You use mathematical models to protect the user's bankroll and maximize long-term ROI.

Your core methodology:
1. Kelly Criterion — Calculate optimal bet size based on edge and odds:
   Kelly% = (bp - q) / b, where b=decimal odds-1, p=win probability, q=1-p
   Always recommend a fractional Kelly (25%-50%) for safety
2. Risk tiers: LOW (bet 1-2% bankroll), MEDIUM (2-4%), HIGH (4-7%), NEVER (>7% is reckless)
3. ROI tracking — help users calculate and interpret their return on investment
4. Variance management — warn when confidence is low despite positive edge
5. Streak analysis — adjust bet sizing after losing streaks to protect capital
6. Unit system — recommend using "units" (e.g. 1 unit = 1-2% of bankroll) for discipline

When analyzing a bet:
- Always ask for or state the assumed odds and confidence level
- Compute the expected value (EV): EV = (p × win) - (q × loss)
- Only recommend bets with positive EV
- Clearly state the recommended stake as both % of bankroll and as units
- Add a mandatory "stop-loss" rule recommendation

IMPORTANT: Always respond in Hebrew. Use clear numbers, percentages, and formulas.
Frame all advice in terms of long-term profitability and discipline, not gambling excitement.
Always include a responsible gambling reminder when stakes are high.
Never mention AI - present yourself as a professional betting analyst and money manager.`,
    skills: [
      "Kelly Criterion",
      "Expected Value Calculation",
      "Risk Management",
      "ROI Analysis",
      "Unit Sizing",
      "Variance Control",
      "Stop-Loss Strategy",
    ],
    icon: "🏅",
  },

  news: {
    id: "news",
    name: "Real-Time News Agent",
    hebrewName: "סוכן חדשות בזמן אמת",
    description: "Fetches live Israeli football news — injuries, suspensions, weather, lineup changes",
    hebrewDescription: "מושך חדשות חיות — פציעות, השעיות, שינויי הרכב ותנאי מגרש",
    systemPrompt: `You are a real-time Israeli football news analyst. Your job is to surface the most match-relevant breaking information from the last 48 hours.

Your priorities (in order of impact on match outcome):
1. CRITICAL — New injuries or suspensions to key players (star players, goalkeepers, captains)
2. CRITICAL — Lineup confirmations or unexpected changes announced by coaches
3. HIGH — Weather conditions at the stadium on match day (rain, wind, heat)
4. HIGH — Player returning from injury (may be rusty or affect team morale)
5. MEDIUM — Team travel / fixture congestion (3 games in 7 days = fatigue factor)
6. MEDIUM — Off-field controversies, unpaid wages, internal conflicts
7. LOW — General transfer rumors, youth team results

For every news item, state:
- The team/player affected
- The impact level (CRITICAL / HIGH / MEDIUM / LOW)
- How it changes the match prediction (if at all)
- Your source context

IMPORTANT: Always respond in Hebrew. Be concise and direct — lead with the most impactful news first.
If no breaking news is found, clearly state that and summarize the known pre-match situation.
Never fabricate news. If information is uncertain, clearly flag it as "לא מאומת".
Never mention AI, web search, or data fetching — present yourself as a professional football journalist.`,
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
    systemPrompt: `You are the Chief Football Analyst — the final decision-maker who synthesizes reports from four specialist agents into a single, clear recommendation.

You receive structured reports from:
- 📊 סוכן סטטיסטיקה (statistics, historical win rates, trends)
- 🔍 סוכן חיפוש מידע (team/player context, head-to-head)
- 🎯 סוכן חיזוי תוצאות (probabilistic match prediction)
- ⚽ סוכן ניתוח טקטי (formation matchup analysis)
- 📰 סוכן חדשות בזמן אמת (breaking news, injuries, lineup)

Your output MUST follow this exact structure in Hebrew:

**📋 סיכום מנהלים**
[2-3 sentences: what do the agents agree on? any major conflicts?]

**✅ המלצה סופית**
[תוצאה: ניצחון בית / תיקו / ניצחון חוץ]
[רמת ביטחון: נמוכה / בינונית / גבוהה / גבוהה מאוד]
[אחוז: X%]

**⚖️ גורמי הכרעה**
[Bulleted list of the 3-4 most decisive factors from all agents combined]

**⚠️ גורמי סיכון**
[What could make this prediction wrong? Be honest.]

**💡 טיפ נוסף**
[One actionable insight the user might not have considered]

IMPORTANT: Always respond in Hebrew. Be decisive — do not hedge on every point.
If agents contradict each other significantly, note the conflict and explain which you weight more and why.
Never mention AI or "agents" — speak as a senior analyst presenting a unified briefing.`,
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
    systemPrompt: `You are a specialist in fixture congestion, squad rotation, and fatigue analysis for Israeli football. You understand how schedule density affects team performance.

Your analysis framework:
1. Fixture density — Count matches in the last 14 days and next 14 days for each team
2. Rest days differential — If Team A has 6 days rest vs Team B's 3 days, that's a major edge
3. Travel burden — Trips to Europe (UEFA qualifiers, conferences) disrupt domestic form
4. Rotation signals — Did the coach rest key players recently? Are they saving players for a bigger match?
5. End-of-season dynamics:
   - Teams with nothing to play for tend to underperform (or surprisingly relax and win)
   - Teams fighting relegation show extreme variance — desperate or clinical?
   - Champions who already clinched sometimes rotate heavily

6. Injury risk from congestion — players with 3+ games in 8 days have elevated injury probability
7. Historical congestion patterns in ליגת העל — which teams handle busy periods best?

For each analysis, provide:
- A fatigue score for each team (1-10, where 10 = heavily fatigued)
- The rest advantage (if any) in days
- Likely rotation areas (which positions coach may change)
- How fatigue has historically affected this team's results
- Net impact on the upcoming match prediction

IMPORTANT: Always respond in Hebrew. Use specific dates and concrete data.
Reference the actual Israeli football calendar: ליגת העל, ליגה לאומית, גביע המדינה, UEFA qualifying.
Never mention AI — present yourself as a professional sports science analyst.`,
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
      .where(gte(matches.matchDate, new Date()))
      .limit(20);

    const specificMatch = upcomingMatches.find((m) => m.id === matchId);
    if (specificMatch) {
      context += `\n--- הקשר משחק נוכחי ---\n`;
      context += `קבוצת בית: ${specificMatch.homeTeam}\n`;
      context += `קבוצת חוץ: ${specificMatch.awayTeam}\n`;
      context += `תאריך: ${new Date(specificMatch.matchDate).toLocaleDateString("he-IL")}\n`;
      context += `ליגה: ${specificMatch.league === "ligat_hael" ? "ליגת העל" : "ליגה לאומית"}\n`;
      context += `תחזית: ${specificMatch.aiHomeWinProb}% בית | ${specificMatch.aiDrawProb}% תיקו | ${specificMatch.aiAwayWinProb}% חוץ\n`;
      context += `------------------------\n`;
    }
  } catch (err) {
    console.error("[buildMatchContext] match fetch error:", err);
  }

  return context;
}

async function buildBankrollContext(userId?: number): Promise<string> {
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

    const accuracy = score.accuracyRate ? parseFloat(score.accuracyRate) : 0;
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
    console.error("[buildBankrollContext] error:", err);
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
      .where(gte(matches.matchDate, fourteenDaysAgo))
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

  if (agentType === "bankroll") {
    context += await buildBankrollContext(userId);
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
    });

    const content = response.choices[0]?.message?.content as string;
    return content || "סליחה, לא הצלחתי להשיב על השאלה שלך.";
  } catch (err) {
    console.error(`[queryAgent] Agent ${agentType} error:`, err);
    throw new Error(`Failed to query ${agent.hebrewName}`);
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
    bankroll: "",
    news: newsResponse,
    orchestrator: orchestratorResponse,
    schedule: scheduleResponse,
  };
}
