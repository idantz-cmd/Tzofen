import { useState, useEffect } from "react";
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
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import {
  Brain,
  Target,
  TrendingUp,
  ChevronDown,
  Users,
  CheckCircle2,
  Newspaper,
  Sparkles,
} from "lucide-react";

type League = "ligat_hael" | "ligah_leumit";

const LEAGUE_LABELS: Record<League, string> = {
  ligat_hael: "ליגת העל",
  ligah_leumit: "הליגה הלאומית",
};

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

  const predictMutation = trpc.agents.queryAll.useMutation({
    onError: (err) => {
      const msg = err.message || "";
      if (msg.includes("429") || msg.includes("credits") || msg.includes("quota") || msg.includes("billing")) {
        toast.error("מכסת ה-AI אזלה. יש להחליף את מפתח ה-GEMINI_API_KEY.", { duration: 8000 });
      } else {
        toast.error(msg || "שגיאה בניבוי — נסה שוב");
      }
    },
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
    predictMutation.mutate({
      message: `נתח את המשחק הכדורגל הישראלי: ${home} נגד ${away} ב${LEAGUE_LABELS[selectedLeague]}. תן חיזוי מקצועי ומפורט — מי צפוי לנצח, הסיבות העיקריות, ונתונים סטטיסטיים רלוונטיים.`,
    });
  }

  const pred = predictMutation.data;

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
            צוות סוכני AI
          </h1>
          <p className="text-sm text-muted-foreground">
            8 סוכנים במקביל · חדשות בזמן אמת · QA · סינתזת GPT-4.1 Nano
          </p>
        </motion.div>

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
              {/* Match header */}
              <Card className="p-5">
                <div className="flex items-center justify-around gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <TeamBadge teamName={homeTeam} logoUrl={selectedMatch?.logo1} size="lg" showName />
                  </div>
                  <span className="text-xl font-black text-muted-foreground/40 shrink-0">נגד</span>
                  <div className="flex flex-col items-center gap-2">
                    <TeamBadge teamName={awayTeam} logoUrl={selectedMatch?.logo2} size="lg" showName />
                  </div>
                </div>
              </Card>

              {/* Orchestrator summary */}
              {pred.responses.orchestrator?.response && (
                <Card className="p-5 border-primary/20" style={{ background: "rgba(31,107,255,0.04)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <h3 className="font-black text-sm">סיכום AI מקצועי</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mr-auto" style={{ background: "#8B4DFF", color: "white" }}>GPT-4o</span>
                  </div>
                  <div className="text-sm leading-relaxed text-foreground/90 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pr-4 [&>strong]:font-bold">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                      {pred.responses.orchestrator.response}
                    </ReactMarkdown>
                  </div>
                </Card>
              )}

              {/* Specialist agent sections */}
              {([
                { key: "prediction", label: "חיזוי תוצאה",     icon: Target,       color: "#1F6BFF", bg: "rgba(31,107,255,0.05)"  },
                { key: "statistics", label: "ניתוח סטטיסטי",   icon: TrendingUp,   color: "#13CE66", bg: "rgba(19,206,102,0.05)"  },
                { key: "tactical",   label: "ניתוח טקטי",      icon: Users,        color: "#8B4DFF", bg: "rgba(139,77,255,0.05)"  },
                { key: "news",       label: "חדשות רלוונטיות",  icon: Newspaper,    color: "#FF3B5C", bg: "rgba(255,59,92,0.05)"   },
                { key: "research",   label: "מחקר ליגה",        icon: Sparkles,     color: "#D4A000", bg: "rgba(212,160,0,0.05)"   },
                { key: "schedule",   label: "לוח עומסים",       icon: CheckCircle2, color: "#475569", bg: "rgba(71,85,105,0.05)"  },
              ] as const).map(({ key, label, icon: Icon, color, bg }) => {
                const agentResp = pred.responses[key];
                if (!agentResp?.response) return null;
                return (
                  <Card key={key} className="p-4 border-border/15" style={{ background: bg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                      <h4 className="text-xs font-bold" style={{ color }}>{label}</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{agentResp.response}</p>
                  </Card>
                );
              })}

              {/* Reset */}
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
