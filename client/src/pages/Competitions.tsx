import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { TeamBadge } from "@/components/TeamLogos";
import { Swords, Trophy, Crown, Medal, ChevronDown, ChevronUp, CheckCircle2, XCircle, Brain, Star } from "lucide-react";
import { Card } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  points: number;
  correct: number;
  total: number;
}

interface MatchResult {
  home: string;
  away: string;
  score: string;
  result: "home" | "draw" | "away";
  date: string;
  aiPrediction: "home" | "draw" | "away";
  aiCorrect: boolean;
  aiConfidence: number;
}

interface Competition {
  id: number;
  match: MatchResult;
  winner: string;
  loser: string;
  winnerPrediction: "home" | "draw" | "away";
  loserPrediction: "home" | "draw" | "away";
}

// ─── Synthetic Data ───────────────────────────────────────────────────────────

const TOURNAMENT_NAME = "טורניר ליגת העל 25/26";

const USERS: User[] = [
  { id: 1,  name: "יאיר כהן",       points: 50, correct: 14, total: 18 },
  { id: 2,  name: "מיכל לוי",       points: 30, correct: 12, total: 18 },
  { id: 3,  name: "אורי גולדברג",   points: 10, correct: 11, total: 18 },
  { id: 4,  name: "נועה פרידמן",    points: 0,  correct: 10, total: 18 },
  { id: 5,  name: "שי ברקוביץ",     points: 0,  correct: 10, total: 18 },
  { id: 6,  name: "תמר אביב",       points: 0,  correct: 9,  total: 18 },
  { id: 7,  name: "רון שמיר",       points: 0,  correct: 9,  total: 18 },
  { id: 8,  name: "דנה כץ",         points: 0,  correct: 8,  total: 18 },
  { id: 9,  name: "ליאור נחמיאס",   points: 0,  correct: 8,  total: 18 },
  { id: 10, name: "שירה מזרחי",     points: 0,  correct: 8,  total: 18 },
  { id: 11, name: "עמית טל",        points: 0,  correct: 7,  total: 18 },
  { id: 12, name: "גל בן-דוד",      points: 0,  correct: 7,  total: 18 },
  { id: 13, name: "יובל שפירא",     points: 0,  correct: 7,  total: 18 },
  { id: 14, name: "אייל רוזן",      points: 0,  correct: 6,  total: 18 },
  { id: 15, name: "נטלי עמר",       points: 0,  correct: 6,  total: 18 },
  { id: 16, name: "בן חיון",        points: 0,  correct: 6,  total: 18 },
  { id: 17, name: "לילך ברון",      points: 0,  correct: 5,  total: 18 },
  { id: 18, name: "ניר סגל",        points: 0,  correct: 5,  total: 18 },
  { id: 19, name: "הדר אלון",       points: 0,  correct: 4,  total: 18 },
  { id: 20, name: "רותם פז",        points: 0,  correct: 3,  total: 18 },
];

// winnerPoints computed dynamically: 10 if winnerPrediction === aiPrediction, else 5
const COMPETITIONS: Competition[] = [
  {
    id: 1,
    match: { home: "מכבי חיפה", away: "הפועל תל אביב", score: "2-1", result: "home", date: "12.10.25", aiPrediction: "home", aiCorrect: true, aiConfidence: 72 },
    winner: "יאיר כהן", loser: "רותם פז",
    winnerPrediction: "home", loserPrediction: "away",
  },
  {
    id: 2,
    match: { home: "מכבי תל אביב", away: "בני סכנין", score: "3-0", result: "home", date: "19.10.25", aiPrediction: "home", aiCorrect: true, aiConfidence: 81 },
    winner: "מיכל לוי", loser: "הדר אלון",
    winnerPrediction: "home", loserPrediction: "draw",
  },
  {
    id: 3,
    match: { home: "הפועל באר שבע", away: "עירוני קריית שמונה", score: "1-1", result: "draw", date: "26.10.25", aiPrediction: "home", aiCorrect: false, aiConfidence: 65 },
    winner: "אורי גולדברג", loser: "שי ברקוביץ",
    winnerPrediction: "draw", loserPrediction: "home",
  },
  {
    id: 4,
    match: { home: "ביתר ירושלים", away: "מכבי חיפה", score: "0-2", result: "away", date: "02.11.25", aiPrediction: "draw", aiCorrect: false, aiConfidence: 55 },
    winner: "נועה פרידמן", loser: "ניר סגל",
    winnerPrediction: "away", loserPrediction: "home",
  },
  {
    id: 5,
    match: { home: "מכבי נתניה", away: "הפועל חיפה", score: "1-2", result: "away", date: "09.11.25", aiPrediction: "away", aiCorrect: true, aiConfidence: 60 },
    winner: "תמר אביב", loser: "לילך ברון",
    winnerPrediction: "away", loserPrediction: "home",
  },
  {
    id: 6,
    match: { home: "הפועל תל אביב", away: "מכבי פתח תקווה", score: "2-2", result: "draw", date: "23.11.25", aiPrediction: "home", aiCorrect: false, aiConfidence: 58 },
    winner: "רון שמיר", loser: "בן חיון",
    winnerPrediction: "draw", loserPrediction: "home",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESULT_LABEL: Record<string, string> = { home: "ניצחון בית", draw: "תיקו", away: "ניצחון חוץ" };
const PRIZE_COLORS = ["#F5C300", "#A8A9AD", "#CD7F32"];
const PRIZE_LABELS = ["🥇 מקום 1", "🥈 מקום 2", "🥉 מקום 3"];
const PRIZES = [50, 30, 10];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4" style={{ color: "#F5C300" }} />;
  if (rank === 2) return <Medal className="w-4 h-4" style={{ color: "#A8A9AD" }} />;
  if (rank === 3) return <Medal className="w-4 h-4" style={{ color: "#CD7F32" }} />;
  return <span className="text-xs text-muted-foreground font-bold w-4 text-center">{rank}</span>;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function PrizeBar() {
  return (
    <Card className="p-4 mb-6" style={{ background: "linear-gradient(135deg, rgba(245,195,0,0.06), rgba(31,107,255,0.04))", border: "1px solid rgba(245,195,0,0.20)" }}>
      <p className="text-xs font-black text-center mb-3" style={{ color: "#B38900" }}>🏆 פרסי הטורניר</p>
      <div className="flex justify-center gap-4">
        {PRIZE_LABELS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-sm font-black" style={{ color: PRIZE_COLORS[i] }}>{PRIZES[i]}</span>
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="text-[9px] font-bold" style={{ color: PRIZE_COLORS[i] }}>נקודות</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Leaderboard() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? USERS : USERS.slice(0, 10);

  return (
    <div className="mb-8">
      <h2 className="text-sm font-black mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4" style={{ color: "#1F6BFF" }} />
        טבלת דירוג — {TOURNAMENT_NAME}
      </h2>
      <Card className="overflow-hidden">
        {shown.map((u, i) => {
          const rank = i + 1;
          const isPrize = rank <= 3;
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border/10 last:border-0"
              style={isPrize ? { background: `${PRIZE_COLORS[rank - 1]}08` } : {}}
            >
              <div className="w-5 flex items-center justify-center shrink-0">
                <RankBadge rank={rank} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-none">{u.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{u.correct}/{u.total} נכון</p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-sm font-black" style={{ color: isPrize ? PRIZE_COLORS[rank - 1] : undefined }}>{u.points}</p>
                <p className="text-[9px] text-muted-foreground">נקודות</p>
              </div>
              {isPrize && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${PRIZE_COLORS[rank - 1]}20`, color: PRIZE_COLORS[rank - 1] }}>
                  +{PRIZES[rank - 1]}
                </span>
              )}
            </div>
          );
        })}
      </Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-2 py-2 text-xs text-muted-foreground flex items-center justify-center gap-1 hover:text-foreground transition-colors"
      >
        {expanded ? <><ChevronUp className="w-3 h-3" /> הצג פחות</> : <><ChevronDown className="w-3 h-3" /> הצג את כל 20 המשתתפים</>}
      </button>
    </div>
  );
}

function CompetitionCard({ comp }: { comp: Competition }) {
  const [open, setOpen] = useState(false);
  const { match } = comp;
  const matchedAI = comp.winnerPrediction === match.aiPrediction;
  const winnerPts = matchedAI ? 10 : 5;

  return (
    <Card className="overflow-hidden mb-3">
      <button className="w-full text-right" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3 p-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamBadge teamName={match.home} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold leading-none truncate">{match.home} — {match.away}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{match.date} · {match.score}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${match.aiCorrect ? "text-green-600" : "text-red-500"}`}
              style={{ background: match.aiCorrect ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }}>
              AI {match.aiCorrect ? "✓" : "✗"}
            </span>
            {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/10 pt-3 space-y-3">

              {/* AI prediction row */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(139,77,255,0.06)", border: "1px solid rgba(139,77,255,0.12)" }}>
                <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: "#8B4DFF" }} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold" style={{ color: "#8B4DFF" }}>חיזוי AI — {match.aiConfidence}% ביטחון</p>
                  <p className="text-[10px] text-muted-foreground">{RESULT_LABEL[match.aiPrediction]} → תוצאה בפועל: {match.score} ({RESULT_LABEL[match.result]})</p>
                </div>
                {match.aiCorrect
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              </div>

              {/* Winner vs Loser */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg text-center" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <p className="text-[9px] text-green-600 font-bold mb-1">🏆 מנצח</p>
                  <p className="text-xs font-black">{comp.winner}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ניחש: {RESULT_LABEL[comp.winnerPrediction]}</p>
                  <p className="text-sm font-black text-green-600 mt-1">+{winnerPts} נק'</p>
                  {matchedAI && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block"
                      style={{ background: "rgba(139,77,255,0.12)", color: "#8B4DFF" }}>
                      ✨ חיזה כמו AI
                    </span>
                  )}
                </div>
                <div className="p-2.5 rounded-lg text-center" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p className="text-[9px] text-red-400 font-bold mb-1">💔 מפסיד</p>
                  <p className="text-xs font-black">{comp.loser}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">ניחש: {RESULT_LABEL[comp.loserPrediction]}</p>
                  <p className="text-sm font-black text-red-400 mt-1">0 נק'</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Competitions() {
  const [tab, setTab] = useState<"tournament" | "duels">("tournament");

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <Navigation />

      <main className="max-w-lg mx-auto px-4 pt-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(31,107,255,0.15), rgba(139,77,255,0.10))", border: "1px solid rgba(31,107,255,0.25)" }}>
              <Swords className="w-5 h-5" style={{ color: "#1F6BFF" }} />
            </div>
            <div>
              <h1 className="text-xl font-black">תחרויות</h1>
              <p className="text-xs text-muted-foreground">עונת 25/26 · 20 משתתפים</p>
            </div>
            <span className="mr-auto text-[10px] font-black px-2 py-1 rounded-full"
              style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
              🔴 פעיל
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
          {(["tournament", "duels"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200"
              style={tab === t ? { background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", color: "#1F6BFF" } : { color: "#888" }}
            >
              {t === "tournament" ? "🏆 טורניר" : "⚔️ דו-קרב"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "tournament" ? (
            <motion.div key="tournament" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <PrizeBar />

              {/* Podium */}
              <Card className="p-4 mb-6" style={{ background: "linear-gradient(135deg, rgba(245,195,0,0.05), rgba(31,107,255,0.04))" }}>
                <p className="text-xs font-black text-center mb-4">🏅 פודיום</p>
                <div className="flex items-end justify-center gap-3">
                  {/* 2nd */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold text-center leading-tight max-w-16">{USERS[1].name}</p>
                    <div className="w-16 rounded-t-lg flex flex-col items-center py-2" style={{ height: 60, background: "rgba(168,169,173,0.15)", border: "1px solid rgba(168,169,173,0.25)" }}>
                      <span className="text-xs font-black" style={{ color: "#A8A9AD" }}>🥈</span>
                      <span className="text-xs font-black">{USERS[1].points}</span>
                      <span className="text-[9px] text-muted-foreground">נק׳</span>
                    </div>
                  </div>
                  {/* 1st */}
                  <div className="flex flex-col items-center gap-1">
                    <Star className="w-4 h-4" style={{ color: "#F5C300" }} />
                    <p className="text-[10px] font-bold text-center leading-tight max-w-16">{USERS[0].name}</p>
                    <div className="w-16 rounded-t-lg flex flex-col items-center py-2" style={{ height: 80, background: "rgba(245,195,0,0.12)", border: "1px solid rgba(245,195,0,0.30)" }}>
                      <span className="text-xs font-black" style={{ color: "#F5C300" }}>🥇</span>
                      <span className="text-xs font-black">{USERS[0].points}</span>
                      <span className="text-[9px] text-muted-foreground">נק׳</span>
                    </div>
                  </div>
                  {/* 3rd */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold text-center leading-tight max-w-16">{USERS[2].name}</p>
                    <div className="w-16 rounded-t-lg flex flex-col items-center py-2" style={{ height: 45, background: "rgba(205,127,50,0.12)", border: "1px solid rgba(205,127,50,0.25)" }}>
                      <span className="text-xs font-black" style={{ color: "#CD7F32" }}>🥉</span>
                      <span className="text-xs font-black">{USERS[2].points}</span>
                      <span className="text-[9px] text-muted-foreground">נק׳</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Leaderboard />
            </motion.div>
          ) : (
            <motion.div key="duels" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <p className="text-xs text-muted-foreground mb-4">6 דו-קרב הושלמו בעונה 25/26. לחץ על כל אחד לפרטים.</p>
              {COMPETITIONS.map((comp) => (
                <CompetitionCard key={comp.id} comp={comp} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
