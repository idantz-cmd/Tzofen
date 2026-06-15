import { useState, useEffect } from "react";
import { useCategory } from "@/contexts/CategoryContext";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "@/components/Navigation";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { hebrewTeamName, TeamBadge } from "@/components/TeamLogos";
import {
  Brain,
  Target,
  CircleDot,
  Flag,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  Zap,
  Users,
  CheckCircle2,
  XCircle,
  Newspaper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type League = "ligat_hael" | "ligah_leumit";

const LEAGUE_LABELS: Record<League, string> = {
  ligat_hael: "ליגת העל",
  ligah_leumit: "הליגה הלאומית",
};

function ProbBar({
  homeProb,
  drawProb,
  awayProb,
  homeLabel,
  awayLabel,
}: {
  homeProb: number;
  drawProb: number;
  awayProb: number;
  homeLabel: string;
  awayLabel: string;
}) {
  const homeLevel = homeProb >= 60 ? "ביטחון גבוה" : homeProb >= 40 ? "ביטחון בינוני" : "ביטחון נמוך";
  const awayLevel = awayProb >= 60 ? "ביטחון גבוה" : awayProb >= 40 ? "ביטחון בינוני" : "ביטחון נמוך";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        <span>{homeLabel}</span>
        <span>תיקו</span>
        <span>{awayLabel}</span>
      </div>
      <div className="flex h-6 rounded-full overflow-hidden text-xs font-bold">
        <div
          className="flex items-center justify-center transition-all"
          style={{ width: `${homeProb}%`, background: "#1F6BFF", color: "white" }}
        >
          {homeProb >= 15 ? `${homeProb}%` : ""}
        </div>
        <div
          className="flex items-center justify-center transition-all"
          style={{ width: `${drawProb}%`, background: "#6B7280", color: "white" }}
        >
          {drawProb >= 12 ? `${drawProb}%` : ""}
        </div>
        <div
          className="flex items-center justify-center transition-all"
          style={{ width: `${awayProb}%`, background: "#13CE66", color: "white" }}
        >
          {awayProb >= 15 ? `${awayProb}%` : ""}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span style={{ color: "#1F6BFF" }}>{homeLevel}</span>
        <span style={{ color: "#13CE66" }}>{awayLevel}</span>
      </div>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: "low" | "medium" | "high" }) {
  const map = {
    low:    { label: "ביטחון נמוך",   bg: "#FF3B5C", color: "white" },
    medium: { label: "ביטחון בינוני", bg: "#FFC91F", color: "#15151E" },
    high:   { label: "ביטחון גבוה",   bg: "#13CE66", color: "white" },
  };
  const { label, bg, color } = map[level];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

function StatChip({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl p-3 gap-0.5"
      style={{ background: color }}
    >
      <span className="text-[11px] text-muted-foreground font-medium leading-tight text-center">{label}</span>
      <span className="text-xl font-black leading-tight" style={{ direction: "ltr" }}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

function AiAccuracyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card
        className="p-3 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, rgba(139,77,255,0.06), rgba(31,107,255,0.06))", border: "1px solid rgba(139,77,255,0.18)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #9D6FFF, #8B4DFF)" }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: "#8B4DFF" }}>8 סוכני AI במקביל · Gemini 2.0 Flash</p>
          <p className="text-[11px] text-muted-foreground">סטטיסטיקה · מחקר · טקטיקה · חדשות · חיזוי · לוח · QA · אורקסטרציה</p>
        </div>
        <span
          className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "#FFC91F", color: "#15151E" }}
        >
          BETA
        </span>
      </Card>
    </motion.div>
  );
}

export default function AIPrediction() {
  const { setCategory } = useCategory();
  useEffect(() => { setCategory("ai"); }, [setCategory]);
  const [selectedLeague, setSelectedLeague] = useState<League>("ligat_hael");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<{ home: string; away: string; logo1?: string | null; logo2?: string | null } | null>(null);
  const [showMatchPicker, setShowMatchPicker] = useState(false);

  const { data: upcomingMatches = [], isLoading: matchesLoading } =
    trpc.matches.getUpcoming.useQuery({ league: selectedLeague });

  const predictMutation = trpc.agents.orchestratePredict.useMutation({
    onError: (err) => toast.error(err.message || "שגיאה בניבוי"),
  });

  function selectMatch(home: string, away: string, logo1?: string | null, logo2?: string | null) {
    setHomeTeam(home);
    setAwayTeam(away);
    setSelectedMatch({ home, away, logo1, logo2 });
    setShowMatchPicker(false);
  }

  function handlePredict() {
    const home = homeTeam.trim();
    const away = awayTeam.trim();
    if (!home || !away) {
      toast.error("בחר קבוצת בית וקבוצת חוץ");
      return;
    }
    predictMutation.mutate({ homeTeam: home, awayTeam: away, league: selectedLeague });
  }

  const pred = predictMutation.data;

  const resultLabel = pred
    ? pred.result === "home_win"
      ? `${hebrewTeamName(pred.homeTeam)} מנצחת`
      : pred.result === "away_win"
      ? `${hebrewTeamName(pred.awayTeam)} מנצחת`
      : "תיקו"
    : null;

  const resultBg =
    pred?.result === "home_win"
      ? "rgba(19,206,102,0.13)"
      : pred?.result === "away_win"
      ? "rgba(255,59,92,0.13)"
      : "rgba(255,201,31,0.13)";

  function qaScoreBg(score: number) {
    if (score >= 75) return { bg: "#13CE66", color: "white" };
    if (score >= 50) return { bg: "#FFC91F", color: "#15151E" };
    return { bg: "#FF3B5C", color: "white" };
  }

  return (
    <PageTransition>
    <div className="min-h-screen pb-24" dir="rtl">
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
            צוות סוכני AI
          </h1>
          <p className="text-sm text-muted-foreground">
            8 סוכנים במקביל · חדשות בזמן אמת · QA · סינתזת Gemini
          </p>
        </motion.div>

        {/* AI accuracy banner */}
        <AiAccuracyBanner />

        {/* League selector */}
        <div className="flex gap-2 justify-center">
          {(["ligat_hael", "ligah_leumit"] as League[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setSelectedLeague(l);
                setSelectedMatch(null);
                setHomeTeam("");
                setAwayTeam("");
                predictMutation.reset();
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
                        onClick={() => selectMatch(m.homeTeam, m.awayTeam, (m as any).homeTeamLogo, (m as any).awayTeamLogo)}
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
            <div className="flex gap-2 pt-1">
              <input
                className="flex-1 border border-border/50 rounded-lg px-3 py-1.5 text-sm bg-background"
                placeholder="קבוצת בית"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
              />
              <span className="text-muted-foreground self-center text-sm font-bold">נגד</span>
              <input
                className="flex-1 border border-border/50 rounded-lg px-3 py-1.5 text-sm bg-background"
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
              {/* Match header */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ConfidenceBadge level={pred.confidence} />
                    {"qaOverallScore" in pred && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          background: qaScoreBg((pred as any).qaOverallScore).bg,
                          color: qaScoreBg((pred as any).qaOverallScore).color,
                        }}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        QA {(pred as any).qaOverallScore}/100
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{pred.dataPoints} נקודות מידע</span>
                </div>

                <div className="flex items-center justify-around gap-4 mb-5">
                  <div className="flex flex-col items-center gap-2">
                    <TeamBadge teamName={pred.homeTeam} logoUrl={selectedMatch?.logo1} size="lg" showName />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-black tabular-nums" style={{ direction: "ltr" }}>
                      {pred.predictedHomeGoals} – {pred.predictedAwayGoals}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-xs font-bold"
                      style={{ background: resultBg }}
                    >
                      {resultLabel}
                    </Badge>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <TeamBadge teamName={pred.awayTeam} logoUrl={selectedMatch?.logo2} size="lg" showName />
                  </div>
                </div>

                <ProbBar
                  homeProb={pred.homeWinProb}
                  drawProb={pred.drawProb}
                  awayProb={pred.awayWinProb}
                  homeLabel={hebrewTeamName(pred.homeTeam)}
                  awayLabel={hebrewTeamName(pred.awayTeam)}
                />
              </Card>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                <StatChip
                  label="סה״כ שערים"
                  value={`${pred.predictedHomeGoals + pred.predictedAwayGoals}`}
                  sub={pred.totalGoalsOver25 ? "מעל 2.5 ✓" : "מתחת 2.5"}
                  color="rgba(19,206,102,0.10)"
                />
                <StatChip
                  label="קרנות"
                  value={`${pred.predictedCorners}`}
                  sub={pred.cornersOver95 ? "מעל 9.5 ✓" : "מתחת 9.5"}
                  color="rgba(31,107,255,0.08)"
                />
                <StatChip
                  label="כרטיסים צהובים"
                  value={`${pred.predictedYellowCards}`}
                  sub={pred.yellowCardsOver35 ? "מעל 3.5 ✓" : "מתחת 3.5"}
                  color="rgba(255,201,31,0.12)"
                />
              </div>

              {pred.redCardExpected && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "rgba(255,59,92,0.10)", color: "#CC1F45" }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  צפוי כרטיס אדום במשחק זה
                </div>
              )}

              {/* Analysis sections */}
              <Card className="p-4 space-y-4">
                <h3 className="font-black text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  ניתוח מפורט
                </h3>

                {[
                  { icon: <Target className="w-4 h-4" />, title: "תוצאה",   text: pred.resultReasoning,  color: "#13CE66" },
                  { icon: <CircleDot className="w-4 h-4" />, title: "שערים", text: pred.goalsReasoning,   color: "#1F6BFF" },
                  { icon: <Flag className="w-4 h-4" />,      title: "קרנות", text: pred.cornersReasoning, color: "#8B4DFF" },
                  { icon: <AlertTriangle className="w-4 h-4" />, title: "כרטיסים", text: pred.cardsReasoning, color: "#FFC91F" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "#F0F4FF", color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-0.5">{item.title}</p>
                      <p className="text-sm leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Summary */}
              <Card
                className="p-4 border-primary/20"
                style={{ background: "rgba(31,107,255,0.05)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-black text-sm">סיכום מקצועי</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{pred.fullSummary}</p>
              </Card>

              {/* Key factors */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4" style={{ color: "#FFC91F" }} />
                  <h3 className="font-black text-sm">גורמים מרכזיים</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pred.keyFactors.map((factor, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={
                        i % 2 === 0
                          ? { background: "rgba(31,107,255,0.10)", color: "#1F4CB3", border: "1px solid rgba(31,107,255,0.22)" }
                          : { background: "rgba(139,77,255,0.10)", color: "#6B2FD6", border: "1px solid rgba(139,77,255,0.22)" }
                      }
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </Card>

              {/* News headlines */}
              {"newsHeadlines" in pred && Array.isArray((pred as any).newsHeadlines) && (pred as any).newsHeadlines.length > 0 && (
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4" style={{ color: "#FF3B5C" }} />
                    <h3 className="font-black text-sm">חדשות רלוונטיות</h3>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-auto"
                      style={{ background: "#FF3B5C" }}
                    >
                      LIVE
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {(pred as any).newsHeadlines.map((h: string, i: number) => (
                      <li key={i} className="text-xs text-foreground/80 leading-relaxed flex gap-2">
                        <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  {"newsInfluence" in pred && (pred as any).newsInfluence && (
                    <p className="text-xs italic text-muted-foreground border-t border-border/40 pt-2">
                      {(pred as any).newsInfluence}
                    </p>
                  )}
                </Card>
              )}

              {/* Agent reports */}
              {"agentReports" in pred && Array.isArray((pred as any).agentReports) && (
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-black text-sm">דוחות סוכנים</h3>
                    {"qaOverallScore" in pred && (
                      <span className="text-xs text-muted-foreground mr-auto">
                        ציון ממוצע: <strong>{(pred as any).qaOverallScore}/100</strong>
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(pred as any).agentReports.map((report: any) => {
                      const qs = qaScoreBg(report.qaScore);
                      return (
                        <div
                          key={report.agentId}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 border border-border/15"
                        >
                          {report.status === "success" ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#13CE66" }} />
                          ) : report.status === "partial" ? (
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#FFC91F" }} />
                          ) : (
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#FF3B5C" }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold">{report.agentName}</span>
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: qs.bg, color: qs.color }}
                              >
                                {report.qaScore}/100
                              </span>
                              <span className="text-[10px] text-muted-foreground mr-auto" dir="ltr">
                                {report.executionMs}ms
                              </span>
                            </div>
                            <p className="text-xs text-foreground/70 mt-0.5 leading-snug">{report.summary}</p>
                            {report.qaIssues.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {report.qaIssues.map((issue: string, j: number) => (
                                  <li key={j} className="text-[10px] text-orange-600 flex gap-1">
                                    <span>⚠</span>{issue}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {"qaReport" in pred && (pred as any).qaReport && (
                    <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">
                      {(pred as any).qaReport}
                    </p>
                  )}
                </Card>
              )}

              {/* New prediction button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  predictMutation.reset();
                  setSelectedMatch(null);
                  setHomeTeam("");
                  setAwayTeam("");
                }}
              >
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
