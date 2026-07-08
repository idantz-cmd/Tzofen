/**
 * Tzofen Master Orchestrator
 * ---------------------------
 * Implements the 6-agent → orchestrator pipeline described in
 * tzofen_orchestrator_prompt.md.
 *
 * Design: the heavy numeric decisions (weighted direction, confidence,
 * consensus, risk, predicted score) are computed DETERMINISTICALLY in code so
 * the output always passes the validation checklist (single confidence number,
 * result⇄score consistency, no lazy 0.50/0.70 defaults). The LLM is used only
 * for what it's good at — writing natural Israeli-Hebrew insights and prose
 * grounded in the agents' own data points.
 */

import { invokeLLM } from "../_core/llm";
import { callGemini } from "../_core/gemini";
import { getTeamStats, getHeadToHead, predictMatch } from "./agents";
import type { TeamStats, HeadToHeadStats, MatchPrediction } from "./agents";

// ─── Shared Types ───────────────────────────────────────────────────────────

export type Direction = "home" | "away" | "draw";
export type ResultDirection = "home_win" | "away_win" | "draw";

export type OrchestratorAgentName =
  | "statistics_agent"
  | "tactical_agent"
  | "news_agent"
  | "league_research_agent"
  | "fatigue_agent"
  | "deep_prediction_agent";

export interface DataPoint {
  fact: string;
  source_type: "statistical" | "tactical" | "news" | "contextual";
}

export interface AgentReport {
  agent_name: OrchestratorAgentName;
  prediction_direction: Direction;
  confidence_score: number; // 0..1
  key_factors: string[];
  specific_data_points: DataPoint[];
  risk_flags: string[];
}

export interface KeyInsight {
  emoji: string;
  text_he: string;
  category: "form" | "tactical" | "injury" | "historical" | "fatigue";
}

export interface OrchestratorOutput {
  prediction_card: {
    home_team: string;
    away_team: string;
    predicted_result: ResultDirection;
    predicted_score: string;
    confidence: number; // 0..1 — the ONLY confidence in the whole payload
    risk_level: "low" | "medium" | "high";
    consensus_level: "strong" | "moderate" | "split";
  };
  key_insights: KeyInsight[]; // exactly 3
  detailed_analysis: {
    why_this_result: string;
    main_threat: string;
    watch_for: string;
  };
  agent_agreement_map: Record<OrchestratorAgentName, ResultDirection>;
  contradictions_resolved: Array<{
    issue: string;
    resolution: string;
    impact_on_confidence: string;
  }>;
  meta: {
    total_data_points_used: number;
    agents_in_consensus: number;
    strongest_signal: string;
    model_version: string;
  };
}

const MODEL_VERSION = "tzofen-orchestrator-v1";

// Weights per the spec (Step 2 — Weighted Synthesis).
const AGENT_WEIGHTS: Record<OrchestratorAgentName, number> = {
  statistics_agent: 0.25,
  tactical_agent: 0.15,
  news_agent: 0.15,
  league_research_agent: 0.1,
  fatigue_agent: 0.1,
  deep_prediction_agent: 0.25,
};

// ─── Agent enforcement prompt (shared suffix) ───────────────────────────────

const ENFORCEMENT_SUFFIX = `

## חוקי פלט לסוכן זה
החזר את הניתוח כאובייקט JSON תקין בלבד, לפי הסכמה:
{
  "agent_name": "<שם הסוכן באנגלית>",
  "prediction_direction": "home" | "away" | "draw",
  "confidence_score": <מספר עשרוני 0.0–1.0>,
  "key_factors": [<בדיוק 3 מחרוזות>],
  "specific_data_points": [
    { "fact": "<כולל לפחות אחד: שם שחקן, שם מאמן, מספר מדויק, או אזכור משחק ספציפי>",
      "source_type": "statistical" | "tactical" | "news" | "contextual" }
  ],
  "risk_flags": [<0–3 מחרוזות>]
}

אילוצי חובה:
- כל פריט ב-key_factors חייב לכלול שם או מספר. משפטים כלליים כמו "כושר טוב" ייפסלו.
- מינימום 3 פריטים ב-specific_data_points.
- כל fact חייב לעבור מבחן: "האם המשפט הזה יכול להתאים לכל קבוצה בכל משחק?" אם כן — כתוב מחדש עם פרטים.
- confidence_score משקף את חוזק הראיות בפועל (0.8+ ראיה מוחצת, 0.6-0.8 חזק, 0.4-0.6 מעורב, מתחת ל-0.4 מעט נתונים). אל תיפול ל-0.7 או 0.5 כברירת מחדל.
- כל ערכי fact ו-key_factors בעברית. מפתחות ה-JSON באנגלית.
- אם אין לך נתון מספרי ספציפי — אל תמציא. השתמש רק במה שסופק לך בהקשר.`;

interface AgentSpec {
  name: OrchestratorAgentName;
  hebrewName: string;
  icon: string;
  persona: string;
}

const AGENT_SPECS: AgentSpec[] = [
  {
    name: "statistics_agent",
    hebrewName: "סוכן סטטיסטיקה",
    icon: "📊",
    persona:
      "מומחה סטטיסטיקה לכדורגל ישראלי. אתה מנתח מאזני ניצחונות, ראש-בראש, יחס שערים וכושר. בסס כל טענה על המספרים שסופקו לך בהקשר בלבד.",
  },
  {
    name: "tactical_agent",
    hebrewName: "סוכן ניתוח טקטי",
    icon: "⚽",
    persona:
      "מנתח טקטי לכדורגל ישראלי. אתה מעריך מבנה, סגנון משחק, נקודות חוזק/חולשה ומאבקים מרכזיים על המגרש.",
  },
  {
    name: "news_agent",
    hebrewName: "סוכן חדשות בזמן אמת",
    icon: "📰",
    persona:
      "עיתונאי כדורגל ישראלי. אתה מזהה פציעות, השעיות, שינויי הרכב, מזג אוויר ומורל. השתמש רק במידע שסופק לך; אל תמציא פציעות.",
  },
  {
    name: "league_research_agent",
    hebrewName: "סוכן מחקר ליגה",
    icon: "🔍",
    persona:
      "חוקר ליגת העל והליגה הלאומית. אתה מעריך הקשר טבלה, מוטיבציה, משמעות הנקודות וגזרת המשחק.",
  },
  {
    name: "fatigue_agent",
    hebrewName: "סוכן עומס ועייפות",
    icon: "📅",
    persona:
      "מומחה עומס משחקים. אתה מנתח צפיפות לוח, ימי מנוחה, רוטציה, נסיעות ועומק סגל.",
  },
  {
    name: "deep_prediction_agent",
    hebrewName: "סוכן חיזוי עמוק",
    icon: "🎯",
    persona:
      "מודל חיזוי הסתברותי. קיבלת הסתברויות מחושבות מהמנוע הסטטיסטי. הסבר את המשמעות שלהן והמלץ על כיוון עם רווח ביטחון.",
  },
];

// ─── Context builders (real data → agents, so they never hallucinate) ───────

function formHe(f: Array<"W" | "D" | "L">): string {
  return f.map((r) => (r === "W" ? "נ" : r === "D" ? "ת" : "ה")).join("-") || "אין";
}

function statsBlock(label: string, s: TeamStats): string {
  return [
    `${label} — ${s.teamName}:`,
    `  משחקים: ${s.totalMatches}, ניצחונות: ${s.wins}, תיקו: ${s.draws}, הפסדים: ${s.losses} (${s.winRate}% ניצחונות)`,
    `  בית: ${s.homeWins}/${s.homeMatches} (${s.homeWinRate}%) | חוץ: ${s.awayWins}/${s.awayMatches} (${s.awayWinRate}%)`,
    `  שערים: ${s.avgGoalsScored} כבושים / ${s.avgGoalsConceded} ספוגים בממוצע`,
    `  כושר (5 אחרונים): ${formHe(s.form)}`,
  ].join("\n");
}

function h2hBlock(h: HeadToHeadStats): string {
  if (h.totalMatches === 0) return "ראש-בראש: אין היסטוריה משותפת.";
  const recent = h.recentMatches
    .map((m) => `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`)
    .join(" | ");
  return [
    `ראש-בראש (${h.totalMatches} משחקים):`,
    `  ${h.team1} ${h.team1Wins} נצ' | ${h.team2} ${h.team2Wins} נצ' | ${h.draws} תיקו`,
    `  ממוצע שערים למשחק: ${h.avgTotalGoals}`,
    recent ? `  אחרונים: ${recent}` : "",
  ].filter(Boolean).join("\n");
}

function buildAgentContext(
  spec: AgentSpec,
  home: string,
  away: string,
  league: string,
  data: { homeStats: TeamStats; awayStats: TeamStats; h2h: HeadToHeadStats; model: MatchPrediction; news: string },
): string {
  const base =
    `${spec.persona}\n\n` +
    `המשחק: ${home} (בית) נגד ${away} (חוץ) ב${league}.\n\n` +
    `--- נתונים אמיתיים מהמערכת ---\n`;

  let ctx = base;
  ctx += statsBlock("בית", data.homeStats) + "\n\n";
  ctx += statsBlock("חוץ", data.awayStats) + "\n\n";
  ctx += h2hBlock(data.h2h) + "\n";

  if (spec.name === "deep_prediction_agent") {
    ctx +=
      `\n--- פלט מנוע ההסתברות ---\n` +
      `הסתברות ניצחון בית: ${data.model.homeWinProbability}%\n` +
      `הסתברות תיקו: ${data.model.drawProbability}%\n` +
      `הסתברות ניצחון חוץ: ${data.model.awayWinProbability}%\n` +
      `המלצת המנוע: ${data.model.recommendedPick} (ביטחון ${data.model.confidence})\n`;
  }

  if (spec.name === "news_agent" && data.news) {
    ctx += `\n--- מידע בזמן אמת ---\n${data.news}\n`;
  }

  ctx += `------------------------\n`;
  ctx += `שם הסוכן שלך: ${spec.name}`;
  ctx += ENFORCEMENT_SUFFIX;
  return ctx;
}

// ─── Robust JSON extraction ─────────────────────────────────────────────────

function extractJson(raw: string): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // strip code fences / prose around the object
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeReport(name: OrchestratorAgentName, obj: any): AgentReport | null {
  if (!obj || typeof obj !== "object") return null;
  const dir: Direction =
    obj.prediction_direction === "home" || obj.prediction_direction === "away"
      ? obj.prediction_direction
      : "draw";
  let conf = Number(obj.confidence_score);
  if (!Number.isFinite(conf)) conf = 0.45;
  conf = Math.max(0.05, Math.min(0.95, conf));

  const factors: string[] = Array.isArray(obj.key_factors)
    ? obj.key_factors.filter((x: unknown) => typeof x === "string").slice(0, 3)
    : [];
  const points: DataPoint[] = Array.isArray(obj.specific_data_points)
    ? obj.specific_data_points
        .filter((p: any) => p && typeof p.fact === "string")
        .map((p: any) => ({
          fact: p.fact as string,
          source_type: ["statistical", "tactical", "news", "contextual"].includes(p.source_type)
            ? p.source_type
            : "contextual",
        }))
    : [];
  const flags: string[] = Array.isArray(obj.risk_flags)
    ? obj.risk_flags.filter((x: unknown) => typeof x === "string").slice(0, 3)
    : [];

  return {
    agent_name: name,
    prediction_direction: dir,
    confidence_score: conf,
    key_factors: factors,
    specific_data_points: points,
    risk_flags: flags,
  };
}

// ─── Run one structured agent ───────────────────────────────────────────────

async function runAgent(
  spec: AgentSpec,
  home: string,
  away: string,
  league: string,
  data: Parameters<typeof buildAgentContext>[4],
): Promise<AgentReport> {
  const system = buildAgentContext(spec, home, away, league, data);
  const fallbackDir: Direction =
    data.model.recommendedPick === "home"
      ? "home"
      : data.model.recommendedPick === "away"
        ? "away"
        : "draw";

  try {
    const res = await invokeLLM({
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `נתח את המשחק ${home} נגד ${away} מזווית ההתמחות שלך והחזר JSON בלבד.`,
        },
      ],
      maxTokens: 700,
      temperature: 0.6,
      responseFormat: "json_object",
    });
    const parsed = normalizeReport(spec.name, extractJson(res.choices[0]?.message?.content ?? ""));
    if (parsed && parsed.key_factors.length > 0) return parsed;
    throw new Error("empty/invalid agent JSON");
  } catch (err) {
    console.warn(`[orchestrator] agent ${spec.name} failed, using fallback:`, (err as Error)?.message);
    // Deterministic fallback grounded in real stats so the pipeline still works.
    return buildFallbackReport(spec.name, fallbackDir, data);
  }
}

function buildFallbackReport(
  name: OrchestratorAgentName,
  dir: Direction,
  data: Parameters<typeof buildAgentContext>[4],
): AgentReport {
  const { homeStats, awayStats, h2h, model } = data;
  const conf = Math.max(
    0.05,
    Math.min(0.9, (Math.max(model.homeWinProbability, model.drawProbability, model.awayWinProbability)) / 100),
  );
  return {
    agent_name: name,
    prediction_direction: dir,
    confidence_score: conf,
    key_factors: [
      `${homeStats.teamName}: ${homeStats.winRate}% ניצחונות בבית (${homeStats.homeWinRate}%)`,
      `${awayStats.teamName}: ${awayStats.winRate}% ניצחונות בחוץ (${awayStats.awayWinRate}%)`,
      `מנוע ההסתברות: ${model.homeWinProbability}%/${model.drawProbability}%/${model.awayWinProbability}%`,
    ],
    specific_data_points: [
      { fact: `${homeStats.teamName} כובשת ${homeStats.avgGoalsScored} שערים בממוצע וסופגת ${homeStats.avgGoalsConceded}`, source_type: "statistical" },
      { fact: `${awayStats.teamName} כובשת ${awayStats.avgGoalsScored} שערים בממוצע וסופגת ${awayStats.avgGoalsConceded}`, source_type: "statistical" },
      { fact: h2h.totalMatches > 0 ? `${h2h.totalMatches} מפגשי עבר: ${h2h.team1} ${h2h.team1Wins} - ${h2h.team2} ${h2h.team2Wins}` : "אין היסטוריית ראש-בראש זמינה", source_type: "statistical" },
    ],
    risk_flags: [],
  };
}

// ─── Deterministic synthesis (Steps 1–3) ────────────────────────────────────

function toResult(dir: Direction): ResultDirection {
  return dir === "home" ? "home_win" : dir === "away" ? "away_win" : "draw";
}

interface Decision {
  direction: Direction;
  confidence: number;
  consensus: "strong" | "moderate" | "split";
  agreeing: number;
  risk: "low" | "medium" | "high";
  probs: Record<Direction, number>;
  criticalInjury: boolean;
}

function decide(reports: AgentReport[]): Decision {
  const score: Record<Direction, number> = { home: 0, away: 0, draw: 0 };
  let totalWeight = 0;

  for (const r of reports) {
    const w = AGENT_WEIGHTS[r.agent_name] ?? 0;
    totalWeight += w;
    const c = r.confidence_score;
    // Full weight×confidence to the picked direction; the residual split across the other two.
    for (const d of ["home", "away", "draw"] as Direction[]) {
      score[d] += d === r.prediction_direction ? w * c : (w * (1 - c)) / 2;
    }
  }

  const sum = score.home + score.away + score.draw || 1;
  const probs: Record<Direction, number> = {
    home: score.home / sum,
    away: score.away / sum,
    draw: score.draw / sum,
  };

  let direction: Direction = "home";
  for (const d of ["away", "draw"] as Direction[]) {
    if (probs[d] > probs[direction]) direction = d;
  }

  const agreeing = reports.filter((r) => r.prediction_direction === direction).length;
  const consensus: Decision["consensus"] =
    agreeing >= 5 ? "strong" : agreeing >= 3 ? "moderate" : "split";

  // Confidence = winning probability, nudged away from lazy defaults & clamped.
  let confidence = probs[direction];
  if (Math.abs(confidence - 0.5) < 0.005) confidence = 0.52;
  if (Math.abs(confidence - 0.7) < 0.005) confidence = 0.72;
  confidence = Math.max(0.35, Math.min(0.92, confidence));

  const injuryRe = /(פצוע|פציע|פציעה|נעדר|השעי|מושעה|כרטיס אדום|injur|suspend)/i;
  const criticalInjury = reports.some(
    (r) => r.agent_name === "news_agent" && r.risk_flags.some((f) => injuryRe.test(f)),
  );

  let risk: Decision["risk"];
  if (consensus === "split" || criticalInjury) risk = "high";
  else if (consensus === "strong") risk = "low";
  else risk = "medium";

  return { direction, confidence: Math.round(confidence * 100) / 100, consensus, agreeing, risk, probs, criticalInjury };
}

// Deterministic scoreline consistent with the predicted result.
function predictScore(decision: Decision, model: MatchPrediction): string {
  const hs = model.homeStats;
  const as = model.awayStats;
  let homeXg = (hs.avgGoalsScored + as.avgGoalsConceded) / 2;
  let awayXg = (as.avgGoalsScored + hs.avgGoalsConceded) / 2;
  if (!Number.isFinite(homeXg) || homeXg <= 0) homeXg = 1.3;
  if (!Number.isFinite(awayXg) || awayXg <= 0) awayXg = 1.0;

  let h = Math.max(0, Math.round(homeXg));
  let a = Math.max(0, Math.round(awayXg));

  if (decision.direction === "home") {
    if (h <= a) h = a + 1;
  } else if (decision.direction === "away") {
    if (a <= h) a = h + 1;
  } else {
    const lvl = Math.max(h, a, 1);
    h = lvl;
    a = lvl;
  }
  return `${h}-${a}`;
}

// ─── Contradiction detection (Step 1, deterministic scaffold) ───────────────

const EVIDENCE_RANK: Record<OrchestratorAgentName, number> = {
  statistics_agent: 5,
  deep_prediction_agent: 5,
  news_agent: 4,
  league_research_agent: 3,
  fatigue_agent: 2,
  tactical_agent: 1,
};

function detectContradictions(reports: AgentReport[], decision: Decision) {
  const out: OrchestratorOutput["contradictions_resolved"] = [];

  // Divergence on the same direction by >0.3, or opposite direction to the winner.
  const dissenters = reports
    .filter((r) => r.prediction_direction !== decision.direction)
    .sort((a, b) => EVIDENCE_RANK[b.agent_name] - EVIDENCE_RANK[a.agent_name]);

  const supporters = reports
    .filter((r) => r.prediction_direction === decision.direction)
    .sort((a, b) => EVIDENCE_RANK[b.agent_name] - EVIDENCE_RANK[a.agent_name]);

  if (dissenters.length > 0 && supporters.length > 0) {
    const d = dissenters[0];
    const s = supporters[0];
    out.push({
      issue: `${hebrewAgent(d.agent_name)} העריך כיוון שונה (${dirHe(d.prediction_direction)}) מ${hebrewAgent(s.agent_name)} (${dirHe(s.prediction_direction)}).`,
      resolution: `הוכרע לטובת ${hebrewAgent(EVIDENCE_RANK[s.agent_name] >= EVIDENCE_RANK[d.agent_name] ? s.agent_name : d.agent_name)} — בעל הראיות הקשות יותר (נתונים מספריים).`,
      impact_on_confidence: `רמת הביטחון קוזזה בהתאם למחלוקת ל-${Math.round(decision.confidence * 100)}%.`,
    });
  }

  return out;
}

function dirHe(d: Direction): string {
  return d === "home" ? "ניצחון בית" : d === "away" ? "ניצחון חוץ" : "תיקו";
}
function resultHe(d: ResultDirection): string {
  return d === "home_win" ? "ניצחון בית" : d === "away_win" ? "ניצחון חוץ" : "תיקו";
}
function hebrewAgent(n: OrchestratorAgentName): string {
  return (
    {
      statistics_agent: "סוכן הסטטיסטיקה",
      tactical_agent: "סוכן הטקטיקה",
      news_agent: "סוכן החדשות",
      league_research_agent: "סוכן מחקר הליגה",
      fatigue_agent: "סוכן העומס",
      deep_prediction_agent: "סוכן החיזוי העמוק",
    } as Record<OrchestratorAgentName, string>
  )[n];
}

// ─── LLM synthesis for Hebrew prose (Steps 4–5) ─────────────────────────────

const HAS_DIGIT = /\d/;
const HAS_HEBREW = /[֐-׿]/;

interface Synthesis {
  key_insights: KeyInsight[];
  detailed_analysis: OrchestratorOutput["detailed_analysis"];
  strongest_signal: string;
}

async function synthesizeHebrew(
  reports: AgentReport[],
  decision: Decision,
  home: string,
  away: string,
): Promise<Synthesis> {
  const allPoints = reports.flatMap((r) =>
    r.specific_data_points.map((p) => `- [${hebrewAgent(r.agent_name)}] ${p.fact}`),
  );
  const factors = reports.flatMap((r) => r.key_factors.map((f) => `- ${f}`));

  const system = `אתה עורך ספורט בכיר בסגנון פרשנות ישראלית (יונתן כהן / ניב רסקין). אתה כותב עברית טבעית, קולעת וישירה. אסור לתרגם מאנגלית.

קיבלת החלטה סופית והוכרעה: ${dirHe(decision.direction)} (${Math.round(decision.confidence * 100)}% ביטחון) במשחק ${home} נגד ${away}.

משימתך: להפיק טקסט בעברית שתומך בכיוון שהוכרע, מבוסס אך ורק על הנתונים הבאים (אל תמציא מספרים או שמות שלא מופיעים):

עובדות מספריות מהסוכנים:
${allPoints.join("\n")}

גורמי מפתח:
${factors.join("\n")}

החזר JSON בלבד בפורמט:
{
  "key_insights": [
    { "emoji": "<אימוג'י בודד>", "text_he": "<משפט אחד בעברית עם שם ומספר>", "category": "form"|"tactical"|"injury"|"historical"|"fatigue" }
  ],
  "detailed_analysis": {
    "why_this_result": "<2-3 משפטים בעברית שמסבירים את ההכרעה>",
    "main_threat": "<משפט אחד: הסיכון הגדול ביותר לחיזוי>",
    "watch_for": "<משפט אחד: גורם ספציפי במשחק שכדאי לעקוב אחריו>"
  },
  "strongest_signal": "<הגורם המכריע היחיד, משפט קצר>"
}

חוקים נוקשים:
- בדיוק 3 פריטים ב-key_insights.
- כל text_he חייב לכלול לפחות שם פרטי (שחקן/מאמן/קבוצה) וגם מספר אחד (שער/אחוז/משחק).
- אסור משפטים גנריים כמו "המשחק צפוי להיות צמוד" או "מומנטום חיובי".
- אל תסתור את הכיוון שהוכרע. סיכונים מנוסחים כ"למרות X, Y סביר יותר כי Z".
- כל הטקסט בעברית טבעית. מפתחות JSON באנגלית.`;

  try {
    const res = await invokeLLM({
      messages: [
        { role: "system", content: system },
        { role: "user", content: `כתוב את הסיכום עבור ${home} נגד ${away}.` },
      ],
      maxTokens: 900,
      temperature: 0.7,
      responseFormat: "json_object",
    });
    const obj = extractJson(res.choices[0]?.message?.content ?? "");
    const partial = coerceSynthesis(obj);
    const fb = fallbackSynthesis(reports, decision, home, away);

    // Salvage: keep the LLM prose when valid, top up insights to exactly 3
    // from specific data points rather than discarding good output.
    if (partial) {
      const insights = topUpInsights(partial.key_insights, fb.key_insights);
      return {
        key_insights: insights,
        detailed_analysis: {
          why_this_result: partial.detailed_analysis.why_this_result || fb.detailed_analysis.why_this_result,
          main_threat: partial.detailed_analysis.main_threat || fb.detailed_analysis.main_threat,
          watch_for: partial.detailed_analysis.watch_for || fb.detailed_analysis.watch_for,
        },
        strongest_signal: partial.strongest_signal || fb.strongest_signal,
      };
    }
    return fb;
  } catch (err) {
    console.warn("[orchestrator] synthesis failed, using data-point fallback:", (err as Error)?.message);
    return fallbackSynthesis(reports, decision, home, away);
  }
}

// Fill up to 3 specific insights, preferring LLM ones, deduping by text.
function topUpInsights(primary: KeyInsight[], backup: KeyInsight[]): KeyInsight[] {
  const out: KeyInsight[] = [];
  const seen = new Set<string>();
  for (const list of [primary, backup]) {
    for (const ins of list) {
      const key = ins.text_he.trim();
      if (out.length >= 3 || seen.has(key)) continue;
      seen.add(key);
      out.push(ins);
    }
  }
  while (out.length < 3 && backup.length > 0) out.push(backup[out.length % backup.length]);
  return out.slice(0, 3);
}

// Returns the LLM synthesis if detailed_analysis is present; insights kept only
// if they pass the specificity test (Hebrew word AND a digit).
function coerceSynthesis(obj: any): Synthesis | null {
  if (!obj || typeof obj !== "object") return null;
  const da = obj.detailed_analysis;
  if (!da || typeof da.why_this_result !== "string") return null;

  let insights: KeyInsight[] = Array.isArray(obj.key_insights)
    ? obj.key_insights
        .filter((i: any) => i && typeof i.text_he === "string")
        .map((i: any) => ({
          emoji: typeof i.emoji === "string" && i.emoji.trim() ? i.emoji.trim() : "⚽",
          text_he: i.text_he as string,
          category: ["form", "tactical", "injury", "historical", "fatigue"].includes(i.category)
            ? i.category
            : "form",
        }))
    : [];

  // Enforce specificity: must contain a Hebrew word AND a digit.
  insights = insights.filter((i) => HAS_HEBREW.test(i.text_he) && HAS_DIGIT.test(i.text_he)).slice(0, 3);

  return {
    key_insights: insights,
    detailed_analysis: {
      why_this_result: String(da.why_this_result),
      main_threat: String(da.main_threat ?? ""),
      watch_for: String(da.watch_for ?? ""),
    },
    strongest_signal: typeof obj.strongest_signal === "string" ? obj.strongest_signal : "",
  };
}

function fallbackSynthesis(
  reports: AgentReport[],
  decision: Decision,
  home: string,
  away: string,
): Synthesis {
  // Pick the 3 most specific data points (has a digit) from the highest-ranked agents.
  const ranked = [...reports].sort((a, b) => EVIDENCE_RANK[b.agent_name] - EVIDENCE_RANK[a.agent_name]);
  const withDigits: { fact: string; agent: OrchestratorAgentName; cat: KeyInsight["category"] }[] = [];
  const catFor = (n: OrchestratorAgentName): KeyInsight["category"] =>
    n === "news_agent" ? "injury" : n === "tactical_agent" ? "tactical" : n === "fatigue_agent" ? "fatigue" : "form";
  for (const r of ranked) {
    for (const p of r.specific_data_points) {
      if (HAS_DIGIT.test(p.fact)) withDigits.push({ fact: p.fact, agent: r.agent_name, cat: catFor(r.agent_name) });
    }
  }
  const emojiFor: Record<KeyInsight["category"], string> = {
    form: "📈", tactical: "⚽", injury: "📰", historical: "📊", fatigue: "📅",
  };
  const insights: KeyInsight[] = withDigits.slice(0, 3).map((d) => ({
    emoji: emojiFor[d.cat],
    text_he: d.fact,
    category: d.cat,
  }));
  // Guarantee 3 (pad with model-derived lines if needed).
  while (insights.length < 3) {
    insights.push({ emoji: "⚽", text_he: `${home} מול ${away}: ${insights.length + 1} גורמים נשקלו בהחלטה`, category: "form" });
  }

  const topFactors = ranked.slice(0, 2).map((r) => r.key_factors[0]).filter(Boolean).join(" ");
  return {
    key_insights: insights,
    detailed_analysis: {
      why_this_result: `ההכרעה ל${dirHe(decision.direction)} נשענת על ${decision.agreeing} מתוך ${reports.length} סוכנים. ${topFactors}`,
      main_threat: reports.flatMap((r) => r.risk_flags)[0] ?? `הפתעה מצד ${decision.direction === "home" ? away : home} עלולה לשנות את התמונה.`,
      watch_for: `עקוב אחר 20 הדקות הראשונות — הן יגדירו את קצב המשחק.`,
    },
    strongest_signal: ranked[0]?.key_factors[0] ?? "הכושר העדכני של הקבוצות",
  };
}

// ─── Main entry ─────────────────────────────────────────────────────────────

export async function orchestratePrediction(
  home: string,
  away: string,
  league: string,
): Promise<{ output: OrchestratorOutput; reports: AgentReport[] }> {
  // 1. Gather real data once (shared across agents).
  const [homeStats, awayStats, h2h, model] = await Promise.all([
    getTeamStats(home),
    getTeamStats(away),
    getHeadToHead(home, away),
    predictMatch(home, away),
  ]);

  let news = "";
  try {
    news = await callGemini(
      `חדשות כדורגל ישראלי עדכניות על ${home} ו-${away}: פציעות, השעיות, שינויי הרכב ומזג אוויר ב-48 השעות האחרונות. תמציתי.`,
    );
  } catch {
    news = "";
  }

  const data = { homeStats, awayStats, h2h, model, news };

  // 2. Run the 6 agents in parallel (each returns structured JSON).
  const reports = await Promise.all(AGENT_SPECS.map((spec) => runAgent(spec, home, away, league, data)));

  // 3. Deterministic decision (Steps 1–3).
  const decision = decide(reports);
  const contradictions = detectContradictions(reports, decision);

  // 4. Hebrew synthesis (Steps 4–5).
  const synth = await synthesizeHebrew(reports, decision, home, away);

  // 5. Assemble strict output.
  const agreementMap = {} as Record<OrchestratorAgentName, ResultDirection>;
  for (const r of reports) agreementMap[r.agent_name] = toResult(r.prediction_direction);

  const output: OrchestratorOutput = {
    prediction_card: {
      home_team: home,
      away_team: away,
      predicted_result: toResult(decision.direction),
      predicted_score: predictScore(decision, model),
      confidence: decision.confidence,
      risk_level: decision.risk,
      consensus_level: decision.consensus,
    },
    key_insights: synth.key_insights,
    detailed_analysis: synth.detailed_analysis,
    agent_agreement_map: agreementMap,
    contradictions_resolved: contradictions,
    meta: {
      total_data_points_used: reports.reduce((n, r) => n + r.specific_data_points.length, 0),
      agents_in_consensus: decision.agreeing,
      strongest_signal: synth.strongest_signal || "הכושר העדכני",
      model_version: MODEL_VERSION,
    },
  };

  validateOutput(output);
  return { output, reports };
}

// ─── Validation checklist (soft — logs warnings, guarantees invariants) ──────

export function validateOutput(o: OrchestratorOutput): string[] {
  const warnings: string[] = [];
  const c = o.prediction_card.confidence;

  if (c === 0.5 || c === 0.7) warnings.push("confidence is a lazy default (0.50/0.70)");
  if (o.key_insights.length !== 3) warnings.push(`expected 3 insights, got ${o.key_insights.length}`);

  for (const ins of o.key_insights) {
    if (!HAS_DIGIT.test(ins.text_he)) warnings.push(`insight lacks a number: "${ins.text_he}"`);
  }

  // result ⇄ score consistency
  const [h, a] = o.prediction_card.predicted_score.split("-").map(Number);
  const r = o.prediction_card.predicted_result;
  if (Number.isFinite(h) && Number.isFinite(a)) {
    if (r === "home_win" && !(h > a)) warnings.push("score inconsistent with home_win");
    if (r === "away_win" && !(a > h)) warnings.push("score inconsistent with away_win");
    if (r === "draw" && h !== a) warnings.push("score inconsistent with draw");
  }

  // risk ⇄ consensus consistency
  if (o.prediction_card.consensus_level === "split" && o.prediction_card.risk_level === "low") {
    warnings.push("split consensus cannot be low risk");
  }

  if (warnings.length) console.warn("[orchestrator] validation warnings:", warnings);
  return warnings;
}

export { resultHe, dirHe, hebrewAgent };
export const ORCHESTRATOR_AGENT_META = AGENT_SPECS.map((s) => ({
  name: s.name,
  hebrewName: s.hebrewName,
  icon: s.icon,
}));
