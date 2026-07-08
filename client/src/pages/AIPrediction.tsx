import { useState, useEffect, type ReactNode } from "react";
import { useCategory } from "@/contexts/CategoryContext";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { hebrewTeamName, TeamBadge } from "@/components/TeamLogos";
import {
  Brain,
  ChevronDown,
  Users,
  AlertTriangle,
  Eye,
  GitMerge,
  Scale,
} from "lucide-react";

type League = "ligat_hael" | "ligah_leumit";

const LEAGUE_LABELS: Record<League, string> = {
  ligat_hael: "ליגת העל",
  ligah_leumit: "הליגה הלאומית",
};

const RESULT_LABELS: Record<string, string> = {
  home_win: "ניצחון בית",
  away_win: "ניצחון חוץ",
  draw: "תיקו",
};

const RISK_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  low: { label: "סיכון נמוך", color: "#13CE66", bg: "rgba(19,206,102,0.12)", dot: "🟢" },
  medium: { label: "סיכון בינוני", color: "#D4A000", bg: "rgba(212,160,0,0.12)", dot: "🟡" },
  high: { label: "סיכון גבוה", color: "#FF3B5C", bg: "rgba(255,59,92,0.12)", dot: "🔴" },
};

const CONSENSUS_LABELS: Record<string, string> = {
  strong: "הסכמה חזקה",
  moderate: "הסכמה בינונית",
  split: "הסכמה מפוצלת",
};

const AGENT_META: Record<string, { label: string; icon: string }> = {
  statistics_agent: { label: "סטטיסטיקה", icon: "📊" },
  tactical_agent: { label: "טקטיקה", icon: "⚽" },
  news_agent: { label: "חדשות", icon: "📰" },
  league_research_agent: { label: "מחקר ליגה", icon: "🔍" },
  fatigue_agent: { label: "עומס ועייפות", icon: "📅" },
  deep_prediction_agent: { label: "חיזוי עמוק", icon: "🎯" },
};

export default function AIPrediction() {
  const { setCategory } = useCategory();
  useEffect(() => { setCategory("ai"); }, [setCategory]);
  const [selectedLeague, setSelectedLeague] = useState<League>("ligat_hael");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<{ home: string; away: string; logo1?: string | null; logo2?: string | null; id?: number } | null>(null);
  const [showMatchPicker, setShowMatchPicker] = useState(false);

  const { data: upcomingMatches = [], isLoading: matchesLoading } =
    trpc.matches.getUpcoming.useQuery({ league: selectedLeague });

  const predictMutation = trpc.agents.predictStructured.useMutation({
    onError: (err) => {
      const msg = err.message || "";
      if (msg.includes("429") || msg.includes("credits") || msg.includes("quota") || msg.includes("billing")) {
        toast.error("מכסת ה-AI אזלה. יש להחליף את מפתח ה-API.", { duration: 8000 });
      } else {
        toast.error(msg || "שגיאה בניבוי — נסה שוב");
      }
    },
  });

  function selectMatch(home: string, away: string, logo1?: string | null, logo2?: string | null, id?: number) {
    setHomeTeam(home);
    setAwayTeam(away);
    setSelectedMatch({ home, away, logo1, logo2, id });
    setShowMatchPicker(false);
  }

  function handlePredict() {
    const home = homeTeam.trim();
    const away = awayTeam.trim();
    if (!home || !away) {
      toast.error("בחר קבוצת בית וקבוצת חוץ");
      return;
    }
    predictMutation.mutate({
      homeTeam: home,
      awayTeam: away,
      league: selectedLeague,
      matchId: selectedMatch?.id,
    });
  }

  function reset() {
    predictMutation.reset();
    setSelectedMatch(null);
    setHomeTeam("");
    setAwayTeam("");
  }

  const pred = predictMutation.data?.prediction;

  return (
    <PageTransition>
    <div className="min-h-screen pb-24" dir="rtl" style={{ background: "#F8F6FF" }}>
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-center space-y-1"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #9D6FFF, #8B4DFF)",
                boxShadow: "0 8px 28px rgba(139,77,255,0.35)",
              }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-gradient-blue">
            חיזוי צופן — צוות אנליסטים
          </h1>
          <p className="text-sm text-muted-foreground">
            6 סוכנים מנתחים · פתרון סתירות · סינתזה משוקללת · חיזוי אחד סופי
          </p>
        </motion.div>

        {/* League selector */}
        <div className="flex gap-2 justify-center">
          {(["ligat_hael", "ligah_leumit"] as League[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setSelectedLeague(l);
                reset();
              }}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={
                selectedLeague === l
                  ? { background: "linear-gradient(135deg, #4D8FFF, #1F6BFF)", color: "white", boxShadow: "0 4px 14px rgba(31,107,255,0.40)" }
                  : { background: "#EEF3FF", color: "#1F6BFF", border: "1px solid rgba(31,107,255,0.20)" }
              }
            >
              {LEAGUE_LABELS[l]}
            </button>
          ))}
        </div>

        {/* Match selector */}
        <Card className="p-4 space-y-3">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowMatchPicker((v) => !v)}
          >
            <span className="font-bold text-sm">
              {selectedMatch
                ? `${hebrewTeamName(selectedMatch.home)} נגד ${hebrewTeamName(selectedMatch.away)}`
                : "בחר משחק קרוב"}
            </span>
            <ChevronDown
              className="w-4 h-4 text-muted-foreground transition-transform"
              style={{ transform: showMatchPicker ? "rotate(180deg)" : "rotate(0)" }}
            />
          </button>

          <AnimatePresence>
            {showMatchPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {matchesLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : upcomingMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">אין משחקים קרובים</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {upcomingMatches.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => selectMatch(m.homeTeam, m.awayTeam, (m as any).homeTeamLogo, (m as any).awayTeamLogo, m.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-right"
                      >
                        <TeamBadge teamName={m.homeTeam} logoUrl={(m as any).homeTeamLogo} size="sm" />
                        <span className="flex-1 text-sm font-medium">
                          {hebrewTeamName(m.homeTeam)} — {hebrewTeamName(m.awayTeam)}
                        </span>
                        <TeamBadge teamName={m.awayTeam} logoUrl={(m as any).awayTeamLogo} size="sm" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual entry if no match selected */}
          {!selectedMatch && (
            <div className="flex gap-2 pt-1 w-full">
              <input
                className="flex-1 min-w-0 border border-border/50 rounded-lg px-3 py-1.5 text-sm bg-background"
                placeholder="קבוצת בית"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
              />
              <span className="text-muted-foreground self-center text-sm font-bold shrink-0">נגד</span>
              <input
                className="flex-1 min-w-0 border border-border/50 rounded-lg px-3 py-1.5 text-sm bg-background"
                placeholder="קבוצת חוץ"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
              />
            </div>
          )}

          <Button
            className="w-full gap-2"
            variant="default"
            onClick={handlePredict}
            disabled={predictMutation.isPending || (!homeTeam && !selectedMatch)}
          >
            {predictMutation.isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                מפעיל צוות סוכנים...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                הפעל צוות סוכנים
              </>
            )}
          </Button>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {pred && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* ── LAYER 1 — Prediction Card ── */}
              <PredictionCard
                pred={pred}
                homeLogo={selectedMatch?.logo1}
                awayLogo={selectedMatch?.logo2}
              />

              {/* ── LAYER 2 — Key Insights ── */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-foreground/70 px-1">תובנות מפתח</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                  {pred.key_insights.map((ins, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="shrink-0 w-56 snap-start"
                    >
                      <Card className="p-4 h-full border-border/15" style={{ background: "white" }}>
                        <div className="text-2xl mb-2">{ins.emoji}</div>
                        <p className="text-sm font-medium leading-relaxed text-foreground/90">
                          {ins.text_he}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── LAYER 3 — Full Analysis ── */}
              <FullAnalysis pred={pred} />

              {/* Reset */}
              <Button variant="outline" className="w-full" onClick={reset}>
                ניבוי חדש
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </PageTransition>
  );
}

// ─── Layer 1: Prediction Card ─────────────────────────────────────────────────

function PredictionCard({
  pred,
  homeLogo,
  awayLogo,
}: {
  pred: NonNullable<ReturnType<typeof trpc.agents.predictStructured.useMutation>["data"]>["prediction"];
  homeLogo?: string | null;
  awayLogo?: string | null;
}) {
  const card = pred.prediction_card;
  const risk = RISK_META[card.risk_level] ?? RISK_META.medium;
  const confPct = Math.round(card.confidence * 100);
  const totalAgents = Object.keys(pred.agent_agreement_map).length;

  return (
    <Card className="p-5 space-y-4" style={{ background: "linear-gradient(135deg, #ffffff, #F5F1FF)" }}>
      {/* Teams + score */}
      <div className="flex items-center justify-around gap-3">
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamBadge teamName={card.home_team} logoUrl={homeLogo} size="lg" showName />
        </div>
        <div className="flex flex-col items-center shrink-0">
          <span className="text-4xl font-black text-foreground tracking-tight">
            {card.predicted_score}
          </span>
          <span className="text-[11px] font-bold text-primary mt-0.5">
            {RESULT_LABELS[card.predicted_result] ?? ""}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamBadge teamName={card.away_team} logoUrl={awayLogo} size="lg" showName />
        </div>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-muted-foreground">רמת ביטחון</span>
          <span className="text-foreground">{confPct}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E8E2F5" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confPct}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #4D8FFF, #8B4DFF)" }}
          />
        </div>
      </div>

      {/* Risk + consensus */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ background: risk.bg, color: risk.color }}
        >
          <span>{risk.dot}</span>
          {risk.label}
        </span>
        <span className="text-xs font-bold text-muted-foreground">
          {pred.meta.agents_in_consensus}/{totalAgents} סוכנים מסכימים · {CONSENSUS_LABELS[card.consensus_level]}
        </span>
      </div>
    </Card>
  );
}

// ─── Layer 3: Full Analysis (accordion) ───────────────────────────────────────

function FullAnalysis({
  pred,
}: {
  pred: NonNullable<ReturnType<typeof trpc.agents.predictStructured.useMutation>["data"]>["prediction"];
}) {
  const da = pred.detailed_analysis;
  const sections = [
    da.why_this_result && {
      key: "why",
      title: "למה החיזוי הזה?",
      icon: Brain,
      color: "#1F6BFF",
      content: <p className="text-sm leading-relaxed text-foreground/85">{da.why_this_result}</p>,
    },
    (da.main_threat || da.watch_for) && {
      key: "surprise",
      title: "מה יכול להפתיע?",
      icon: AlertTriangle,
      color: "#D4A000",
      content: (
        <div className="space-y-2 text-sm text-foreground/85">
          {da.main_threat && (
            <p className="flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#FF3B5C" }} />
              <span>{da.main_threat}</span>
            </p>
          )}
          {da.watch_for && (
            <p className="flex gap-2">
              <Eye className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#8B4DFF" }} />
              <span>{da.watch_for}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: "agents",
      title: "מפת הסכמת סוכנים",
      icon: GitMerge,
      color: "#13CE66",
      content: (
        <div className="space-y-1.5">
          {Object.entries(pred.agent_agreement_map).map(([agent, result]) => {
            const meta = AGENT_META[agent] ?? { label: agent, icon: "🤖" };
            return (
              <div key={agent} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground/80">
                  <span>{meta.icon}</span>
                  {meta.label}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {RESULT_LABELS[result] ?? result}
                </span>
              </div>
            );
          })}
        </div>
      ),
    },
    pred.contradictions_resolved.length > 0 && {
      key: "contradictions",
      title: "סתירות שזוהו ונפתרו",
      icon: Scale,
      color: "#8B4DFF",
      content: (
        <div className="space-y-3">
          {pred.contradictions_resolved.map((c, i) => (
            <div key={i} className="text-sm space-y-1 border-r-2 pr-3" style={{ borderColor: "#8B4DFF" }}>
              <p className="text-foreground/85"><strong>הסתירה:</strong> {c.issue}</p>
              <p className="text-foreground/75"><strong>הפתרון:</strong> {c.resolution}</p>
              <p className="text-muted-foreground text-xs">{c.impact_on_confidence}</p>
            </div>
          ))}
        </div>
      ),
    },
  ].filter(Boolean) as Array<{ key: string; title: string; icon: any; color: string; content: ReactNode }>;

  const [open, setOpen] = useState<string | null>("why");

  return (
    <Card className="divide-y divide-border/40 overflow-hidden">
      {sections.map(({ key, title, icon: Icon, color, content }) => {
        const isOpen = open === key;
        return (
          <div key={key}>
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setOpen(isOpen ? null : key)}
            >
              <span className="flex items-center gap-2 font-bold text-sm">
                <Icon className="w-4 h-4" style={{ color }} />
                {title}
              </span>
              <ChevronDown
                className="w-4 h-4 text-muted-foreground transition-transform"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">{content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Meta footer */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/20">
        <span>{pred.meta.total_data_points_used} נתונים נותחו</span>
        <span>אות מכריע: {pred.meta.strongest_signal}</span>
      </div>
    </Card>
  );
}
