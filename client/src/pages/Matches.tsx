import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import PredictionChart from "@/components/PredictionChart";
import { TeamLogo, getTeamColors } from "@/components/TeamLogos";
import { ErrorState } from "@/components/ui/ErrorState";
import { MatchCardSkeleton } from "@/components/ui/skeletons/MatchCardSkeleton";
import { ConfettiCelebration } from "@/components/animations/ConfettiCelebration";
import {
  Target,
  Trophy,
  Clock,
  Lock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Flame,
} from "lucide-react";

export default function Matches() {
  const { isAuthenticated } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState<"ligat_hael" | "ligah_leumit">("ligat_hael");
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const utils = trpc.useUtils();

  const { data: matches = [], isLoading: matchesLoading, error: matchesError, refetch: refetchMatches } =
    trpc.matches.getUpcoming.useQuery({ league: selectedLeague });

  const { data: completedMatches = [], isLoading: completedLoading, error: completedError, refetch: refetchCompleted } =
    trpc.matches.getCompleted.useQuery({ league: selectedLeague });

  const { data: userPredictions = [] } = trpc.matches.getUserPredictions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitPredictionMutation = trpc.matches.submitPrediction.useMutation({
    onSuccess: () => {
      toast.success("החיזוי שלך ננעל בהצלחה! 🎯");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
      utils.matches.getUserPredictions.invalidate();
    },
    onError: (error: any) => {
      toast.error(`${error.message}`);
    },
  });

  const handleSubmitPrediction = (matchId: number, prediction: "home_win" | "draw" | "away_win") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    submitPredictionMutation.mutate({ matchId, prediction });
  };

  const filteredMatches = matches.filter((m: any) => m.league === selectedLeague);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("he-IL", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <ConfettiCelebration trigger={showConfetti} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-black text-foreground">משחקים וחיזויים</h1>
          <p className="text-sm text-muted-foreground mt-1">חזה תוצאות • צבור נקודות • עלה בדירוג</p>
        </motion.div>

        <div className="flex gap-2 mb-5">
          <Button
            variant={activeTab === "upcoming" ? "default" : "outline"}
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 h-11 font-bold ${activeTab !== "upcoming" ? "border-border/30 text-muted-foreground hover:text-foreground" : ""}`}
          >
            <Clock className="w-4 h-4 ml-1.5" />
            משחקים קרובים
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className={`flex-1 h-11 font-bold ${activeTab !== "completed" ? "border-border/30 text-muted-foreground hover:text-foreground" : ""}`}
          >
            <CheckCircle2 className="w-4 h-4 ml-1.5" />
            תוצאות
          </Button>
        </div>

        <Tabs
          value={selectedLeague}
          onValueChange={(v) => setSelectedLeague(v as "ligat_hael" | "ligah_leumit")}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted/10 border border-border/20 h-10">
            <TabsTrigger value="ligat_hael" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary font-bold text-sm">
              ליגת העל
            </TabsTrigger>
            <TabsTrigger value="ligah_leumit" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 font-bold text-sm">
              ליגה לאומית
            </TabsTrigger>
          </TabsList>

          {(["ligat_hael", "ligah_leumit"] as const).map((league) => (
            <TabsContent key={league} value={league} className="mt-5">
              {activeTab === "upcoming" ? (
                matchesError ? (
                  <ErrorState title="שגיאה בטעינת משחקים" message={matchesError.message} onRetry={refetchMatches} />
                ) : (
                  <MatchList
                    matches={filteredMatches}
                    isLoading={matchesLoading}
                    userPredictions={userPredictions}
                    isAuthenticated={isAuthenticated}
                    onSubmitPrediction={handleSubmitPrediction}
                    isSubmitting={submitPredictionMutation.isPending}
                    formatDate={formatDate}
                    expandedMatch={expandedMatch}
                    setExpandedMatch={setExpandedMatch}
                  />
                )
              ) : (
                completedError ? (
                  <ErrorState title="שגיאה בטעינת תוצאות" message={completedError.message} onRetry={refetchCompleted} />
                ) : (
                  <CompletedList
                    matches={completedMatches}
                    isLoading={completedLoading}
                    userPredictions={userPredictions}
                    formatDate={formatDate}
                  />
                )
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}

/* ===== Match List ===== */
function MatchList({
  matches,
  isLoading,
  userPredictions,
  isAuthenticated,
  onSubmitPrediction,
  isSubmitting,
  formatDate,
  expandedMatch,
  setExpandedMatch,
}: {
  matches: any[];
  isLoading: boolean;
  userPredictions: any[];
  isAuthenticated: boolean;
  onSubmitPrediction: (matchId: number, prediction: "home_win" | "draw" | "away_win") => void;
  isSubmitting: boolean;
  formatDate: (date: Date | string) => string;
  expandedMatch: number | null;
  setExpandedMatch: (id: number | null) => void;
}) {
  if (isLoading) return <MatchCardSkeleton count={5} />;

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">אין משחקים קרובים כרגע</p>
        <p className="text-sm text-muted-foreground/60 mt-1">בדוק שוב מחר</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match: any, index: number) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
        >
          <MatchCard
            match={match}
            isAuthenticated={isAuthenticated}
            userPrediction={userPredictions.find((p: any) => p.matchId === match.id)}
            onSubmitPrediction={onSubmitPrediction}
            isSubmitting={isSubmitting}
            formatDate={formatDate}
            isExpanded={expandedMatch === match.id}
            onToggleExpand={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ===== Countdown Hook ===== */
function useMatchCountdown(matchDate: Date | string) {
  const getMs = () => new Date(matchDate).getTime() - Date.now();
  const [msLeft, setMsLeft] = useState(getMs);

  useEffect(() => {
    if (msLeft <= 0) return;
    const id = setInterval(() => setMsLeft(getMs()), 1000);
    return () => clearInterval(id);
  }, [matchDate]);

  return msLeft;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ===== Match Card ===== */
function MatchCard({
  match,
  isAuthenticated,
  userPrediction,
  onSubmitPrediction,
  isSubmitting,
  formatDate,
  isExpanded,
  onToggleExpand,
}: {
  match: any;
  isAuthenticated: boolean;
  userPrediction?: any;
  onSubmitPrediction: (matchId: number, prediction: "home_win" | "draw" | "away_win") => void;
  isSubmitting: boolean;
  formatDate: (date: Date | string) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [goalsOver, setGoalsOver] = useState<string | null>(null);
  const [cornersOver, setCornersOver] = useState<string | null>(null);
  const [yellowCards, setYellowCards] = useState<string | null>(null);
  const [redCard, setRedCard] = useState<string | null>(null);

  const msLeft = useMatchCountdown(match.matchDate);
  const isLocked = msLeft <= 0;
  const isUrgent = msLeft > 0 && msLeft <= 60 * 60 * 1000;
  const isToday = msLeft > 0 && msLeft <= 24 * 60 * 60 * 1000 && !isUrgent;

  const advancedMutation = trpc.matches.submitAdvancedPrediction.useMutation({
    onError: (err: any) => {
      console.error("Advanced prediction error:", err.message);
    },
  });

  const homeColors = getTeamColors(match.homeTeam);
  const awayColors = getTeamColors(match.awayTeam);
  const hasPredicted = !!userPrediction;

  return (
    <Card
      className={`overflow-hidden border-border/20 hover:border-primary/20 transition-all duration-200 ${
        isLocked ? "opacity-80" : ""
      }`}
    >
      <div
        className="h-1"
        style={{
          background: `linear-gradient(to left, ${homeColors.primary} 0%, ${homeColors.primary} 40%, transparent 50%, ${awayColors.primary} 60%, ${awayColors.primary} 100%)`,
        }}
      />

      <div className="p-4">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="text-[11px] border-border/20 text-muted-foreground font-medium">
            {match.league === "ligat_hael" ? "ליגת העל" : "ליגה לאומית"}
            {match.round && ` • מחזור ${match.round}`}
          </Badge>

          {/* Countdown or date */}
          <div className="flex items-center gap-1.5 text-xs">
            {isLocked ? (
              <span className="flex items-center gap-1 text-muted-foreground/60">
                <Lock className="w-3 h-3" />
                נסגר
              </span>
            ) : isUrgent ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-1 text-red-500 font-bold"
              >
                ⏱ {formatCountdown(msLeft)} לסגירה
              </motion.span>
            ) : isToday ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(match.matchDate)}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(match.matchDate)}
              </span>
            )}
          </div>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-3 items-center gap-2 mb-4">
          <div className="text-center">
            <TeamLogo teamName={match.homeTeam} size="md" />
            <p className="font-bold text-sm mt-1.5 text-foreground">{match.homeTeam}</p>
            <p className="text-[10px] text-muted-foreground">בית</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full border border-border/30 flex items-center justify-center bg-muted/10">
              <span className="text-xs font-black text-muted-foreground">VS</span>
            </div>
          </div>
          <div className="text-center">
            <TeamLogo teamName={match.awayTeam} size="md" />
            <p className="font-bold text-sm mt-1.5 text-foreground">{match.awayTeam}</p>
            <p className="text-[10px] text-muted-foreground">חוץ</p>
          </div>
        </div>

        {/* Prediction Section */}
        {isLocked ? (
          <div className="p-3 rounded-lg bg-muted/10 border border-border/20 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold text-muted-foreground">🔒 ניחוש נסגר — המשחק החל</span>
          </div>
        ) : hasPredicted ? (
          <div className="p-3 rounded-lg" style={{ background: "oklch(0.78 0.155 72 / 0.07)", border: "1px solid oklch(0.78 0.155 72 / 0.22)" }}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" style={{ color: "oklch(0.78 0.155 72)" }} />
              <span className="text-sm font-bold" style={{ color: "oklch(0.78 0.155 72)" }}>החיזוי שלך ננעל</span>
              <Badge className="mr-auto text-xs" style={{ background: "oklch(0.78 0.155 72 / 0.15)", color: "oklch(0.78 0.155 72)", border: "1px solid oklch(0.78 0.155 72 / 0.30)" }}>
                {userPrediction.prediction === "home_win" ? `ניצחון ${match.homeTeam}` :
                 userPrediction.prediction === "away_win" ? `ניצחון ${match.awayTeam}` : "תיקו"}
              </Badge>
            </div>
          </div>
        ) : isAuthenticated ? (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-bold">חזה את התוצאה:</p>
            <div className="grid grid-cols-3 gap-2">
              {(["home_win", "draw", "away_win"] as const).map((pred) => {
                const isSelected = selectedPrediction === pred;
                const label = pred === "home_win" ? "ניצחון בית" : pred === "draw" ? "תיקו" : "ניצחון חוץ";
                const color = pred === "home_win" ? homeColors.primary : pred === "away_win" ? awayColors.primary : "oklch(0.65 0.130 80)";
                return (
                  <motion.button
                    key={pred}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedPrediction(pred);
                      navigator.vibrate?.(50);
                    }}
                    disabled={isSubmitting}
                    className={`h-11 text-xs font-bold rounded-lg border transition-all ${
                      isSelected
                        ? "text-white border-transparent shadow-md"
                        : "border-border/30 hover:border-primary/30 bg-transparent text-foreground"
                    }`}
                    style={isSelected ? { backgroundColor: color } : {}}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <Flame className="w-3 h-3" />
              חיזויים מתקדמים (בונוס נקודות)
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3 p-3 rounded-lg bg-muted/5 border border-border/15"
                >
                  {[
                    { label: "שערים (מעל/מתחת 2.5)", state: goalsOver, set: setGoalsOver },
                    { label: "קרנות (מעל/מתחת 9.5)", state: cornersOver, set: setCornersOver },
                    { label: "כרטיסים צהובים (מעל/מתחת 3.5)", state: yellowCards, set: setYellowCards },
                  ].map(({ label, state, set }) => (
                    <div key={label}>
                      <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">{label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {["over", "under"].map((v) => (
                          <Button
                            key={v}
                            variant="outline"
                            size="sm"
                            onClick={() => set(state === v ? null : v)}
                            className={`text-xs h-9 ${state === v ? "text-white border-transparent" : "border-border/30"}`}
                            style={state === v ? { background: "oklch(0.55 0.110 232)" } : {}}
                          >
                            {v === "over" ? "מעל" : "מתחת"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">כרטיס אדום</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setRedCard(redCard === "yes" ? null : "yes")}
                        className={`text-xs h-9 ${redCard === "yes" ? "bg-red-600 text-white border-transparent" : "border-border/30"}`}>
                        יהיה
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRedCard(redCard === "no" ? null : "no")}
                        className={`text-xs h-9 ${redCard === "no" ? "bg-slate-600 text-white border-transparent" : "border-border/30"}`}>
                        לא יהיה
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {selectedPrediction && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                <Button
                  onClick={() => {
                    onSubmitPrediction(match.id, selectedPrediction as "home_win" | "draw" | "away_win");
                    if (goalsOver || cornersOver || yellowCards || redCard) {
                      advancedMutation.mutate({
                        matchId: match.id,
                        goalsOverUnder: (goalsOver as "over" | "under") || undefined,
                        cornersOverUnder: (cornersOver as "over" | "under") || undefined,
                        yellowCardsOverUnder: (yellowCards as "over" | "under") || undefined,
                        redCardInMatch: redCard === "yes" ? true : redCard === "no" ? false : undefined,
                      });
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full h-11 font-bold"
                  variant="accent"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4 ml-1.5" />נעל חיזוי</>}
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/5 border border-border/15 text-center">
            <p className="text-xs text-muted-foreground mb-2">התחבר כדי לחזות תוצאות</p>
            <Button size="sm" variant="accent" className="text-xs h-8" onClick={() => { window.location.href = getLoginUrl(); }}>
              התחבר עכשיו
            </Button>
          </div>
        )}

        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors w-full justify-center pt-2 border-t border-border/10"
        >
          <TrendingUp className="w-3 h-3" />
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isExpanded ? "הסתר ניתוח" : "הצג ניתוח מקצועי"}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border/10"
            >
              <PredictionChart
                homeWin={45}
                draw={28}
                awayWin={27}
                confidence={72}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

/* ===== Completed List ===== */
function CompletedList({
  matches,
  isLoading,
  userPredictions,
  formatDate,
}: {
  matches: any[];
  isLoading: boolean;
  userPredictions: any[];
  formatDate: (date: Date | string) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">אין תוצאות עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match: any, index: number) => {
        const userPred = userPredictions.find((p: any) => p.matchId === match.id);
        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
          >
            <CompletedMatchCard match={match} userPrediction={userPred} formatDate={formatDate} />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ===== Completed Match Card ===== */
function CompletedMatchCard({
  match,
  userPrediction,
  formatDate,
}: {
  match: any;
  userPrediction?: any;
  formatDate: (date: Date | string) => string;
}) {
  const { isAuthenticated } = useAuth();
  const homeColors = getTeamColors(match.homeTeam);
  const awayColors = getTeamColors(match.awayTeam);
  const userCorrect = userPrediction?.prediction === match.actualResult;

  const { data: advancedResults } = trpc.matches.getAdvancedResults.useQuery(
    { matchId: match.id },
    { enabled: !!isAuthenticated && !!match.actualResult }
  );

  const getResultLabel = (result: string) => {
    switch (result) {
      case "home_win": return `ניצחון ${match.homeTeam}`;
      case "draw": return "תיקו";
      case "away_win": return `ניצחון ${match.awayTeam}`;
      default: return "";
    }
  };

  return (
    <Card className={`overflow-hidden border-border/20 ${userCorrect ? "border-primary/30" : ""}`}>
      <div className={`h-1 ${userPrediction ? "" : "bg-muted/30"}`}
        style={userCorrect ? { background: "oklch(0.55 0.110 232)" } : userPrediction ? { background: "oklch(0.58 0.220 27 / 0.6)" } : {}} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-[11px] border-border/20 text-muted-foreground">
            {match.league === "ligat_hael" ? "ליגת העל" : "ליגה לאומית"}
          </Badge>
          {userPrediction && (
            <Badge
              className="text-[11px]"
              style={userCorrect
                ? { background: "oklch(0.55 0.110 232 / 0.15)", color: "oklch(0.65 0.100 228)", border: "1px solid oklch(0.55 0.110 232 / 0.30)" }
                : { background: "oklch(0.58 0.220 27 / 0.15)", color: "oklch(0.72 0.160 27)", border: "1px solid oklch(0.58 0.220 27 / 0.30)" }
              }
            >
              {userCorrect ? <><CheckCircle2 className="w-3 h-3 ml-1" /> צדקת!</> : "לא צדקת"}
              {userPrediction.pointsEarned ? ` (+${userPrediction.pointsEarned})` : ""}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 items-center gap-2">
          <div className="text-center">
            <TeamLogo teamName={match.homeTeam} size="sm" />
            <p className="font-bold text-xs mt-1">{match.homeTeam}</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/10 border border-border/20">
              <span className="text-2xl font-black" style={{ color: homeColors.primary }}>{match.homeTeamScore ?? 0}</span>
              <span className="text-muted-foreground font-bold">-</span>
              <span className="text-2xl font-black" style={{ color: awayColors.primary }}>{match.awayTeamScore ?? 0}</span>
            </div>
            {match.actualResult && (
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{getResultLabel(match.actualResult)}</p>
            )}
          </div>
          <div className="text-center">
            <TeamLogo teamName={match.awayTeam} size="sm" />
            <p className="font-bold text-xs mt-1">{match.awayTeam}</p>
          </div>
        </div>

        {userPrediction && (
          <div className="mt-3 pt-2 border-t border-border/10 text-center">
            <span className="text-xs text-muted-foreground">
              החיזוי שלך:{" "}
              <span className={`font-bold ${userCorrect ? "text-primary" : "text-red-400"}`}>
                {getResultLabel(userPrediction.prediction)}
              </span>
            </span>
          </div>
        )}

        {advancedResults && advancedResults.actualStats && (
          <div className="mt-3 pt-2 border-t border-border/10">
            <p className="text-[10px] text-muted-foreground font-medium mb-2 text-center">חיזויים מתקדמים</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {advancedResults.prediction.goalsOverUnder && (
                <AdvancedResultItem label="שערים (2.5)" prediction={advancedResults.prediction.goalsOverUnder} actual={(advancedResults.actualStats.totalGoals ?? 0) > 2.5 ? "over" : "under"} />
              )}
              {advancedResults.prediction.cornersOverUnder && (
                <AdvancedResultItem label="קרנות (9.5)" prediction={advancedResults.prediction.cornersOverUnder} actual={(advancedResults.actualStats.totalCorners ?? 0) > 9.5 ? "over" : "under"} />
              )}
              {advancedResults.prediction.yellowCardsOverUnder && (
                <AdvancedResultItem label="צהובים (3.5)" prediction={advancedResults.prediction.yellowCardsOverUnder} actual={(advancedResults.actualStats.totalYellowCards ?? 0) > 3.5 ? "over" : "under"} />
              )}
              {advancedResults.prediction.redCardInMatch !== null && advancedResults.prediction.redCardInMatch !== undefined && (
                <AdvancedResultItem label="אדום" prediction={advancedResults.prediction.redCardInMatch ? "yes" : "no"} actual={(advancedResults.actualStats.totalRedCards ?? 0) > 0 ? "yes" : "no"} />
              )}
            </div>
            {(advancedResults.prediction.points ?? 0) > 0 && (
              <p className="text-center text-[10px] text-primary font-bold mt-2">+{advancedResults.prediction.points} נק' בונוס</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function AdvancedResultItem({ label, prediction, actual }: { label: string; prediction: string; actual: string }) {
  const isCorrect = prediction === actual;
  const displayPred = prediction === "over" ? "מעל" : prediction === "under" ? "מתחת" : prediction === "yes" ? "כן" : "לא";
  return (
    <div className={`px-2 py-1 rounded text-center ${isCorrect ? "bg-primary/10 border border-primary/20" : "bg-red-500/10 border border-red-500/20"}`}>
      <span className="text-muted-foreground">{label}: </span>
      <span className={`font-bold ${isCorrect ? "text-primary" : "text-red-400"}`}>{displayPred} {isCorrect ? "✓" : "✗"}</span>
    </div>
  );
}
