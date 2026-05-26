import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import PredictionChart from "@/components/PredictionChart";
import { TeamLogo, getTeamColors, hebrewTeamName } from "@/components/TeamLogos";
import { ErrorState } from "@/components/ui/ErrorState";
import { MatchCardSkeleton } from "@/components/ui/skeletons/MatchCardSkeleton";
import { ConfettiCelebration } from "@/components/animations/ConfettiCelebration";
import { ConversionModal, popQueuedPrediction, type QueuedPrediction } from "@/components/ConversionModal";
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

function useGuestToken(): string {
  const [token] = useState(() => {
    let t = localStorage.getItem("beting_guest_token");
    if (!t) {
      t = crypto.randomUUID();
      localStorage.setItem("beting_guest_token", t);
    }
    return t;
  });
  return token;
}

export default function Matches() {
  const { isAuthenticated } = useAuth();
  const guestToken = useGuestToken();
  const [selectedLeague, setSelectedLeague] = useState<"ligat_hael" | "ligah_leumit">("ligat_hael");
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [conversionModal, setConversionModal] = useState<{ isOpen: boolean; queued: Omit<QueuedPrediction, "queuedAt"> | null }>({ isOpen: false, queued: null });

  const utils = trpc.useUtils();

  const { data: matches = [], isLoading: matchesLoading, error: matchesError, refetch: refetchMatches } =
    trpc.matches.getUpcoming.useQuery({ league: selectedLeague });

  const { data: completedMatches = [], isLoading: completedLoading, error: completedError, refetch: refetchCompleted } =
    trpc.matches.getCompleted.useQuery({ league: selectedLeague });

  const { data: userPredictions = [] } = trpc.matches.getUserPredictions.useQuery(
    isAuthenticated ? undefined : { guestToken }
  );

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

  // After login/register redirect: auto-submit any queued prediction
  useEffect(() => {
    if (!isAuthenticated) return;
    const queued = popQueuedPrediction();
    if (!queued) return;
    submitPredictionMutation.mutate({ matchId: queued.matchId, prediction: queued.prediction });
  }, [isAuthenticated]);

  const handleSubmitPrediction = (
    matchId: number,
    prediction: "home" | "draw" | "away",
    homeTeam: string,
    awayTeam: string,
  ) => {
    if (!isAuthenticated) {
      setConversionModal({ isOpen: true, queued: { matchId, prediction, homeTeam, awayTeam } });
      return;
    }
    submitPredictionMutation.mutate({ matchId, prediction });
  };

  const handleCloseModal = () => setConversionModal({ isOpen: false, queued: null });

  const handleGuestContinue = () => {
    const q = conversionModal.queued;
    setConversionModal({ isOpen: false, queued: null });
    if (q) {
      submitPredictionMutation.mutate({ matchId: q.matchId, prediction: q.prediction, guestToken });
    }
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
      <ConversionModal
        isOpen={conversionModal.isOpen}
        queued={conversionModal.queued}
        onClose={handleCloseModal}
        onGuestContinue={handleGuestContinue}
      />

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
  onSubmitPrediction,
  isSubmitting,
  formatDate,
  expandedMatch,
  setExpandedMatch,
}: {
  matches: any[];
  isLoading: boolean;
  userPredictions: any[];
  onSubmitPrediction: (matchId: number, prediction: "home" | "draw" | "away", homeTeam: string, awayTeam: string) => void;
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
  userPrediction,
  onSubmitPrediction,
  isSubmitting,
  formatDate,
  isExpanded,
  onToggleExpand,
}: {
  match: any;
  userPrediction?: any;
  onSubmitPrediction: (matchId: number, prediction: "home" | "draw" | "away", homeTeam: string, awayTeam: string) => void;
  isSubmitting: boolean;
  formatDate: (date: Date | string) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [goals, setGoals] = useState<number | null>(null);
  const [corners, setCorners] = useState<number | null>(null);
  const [yellowCards, setYellowCards] = useState<number | null>(null);
  const [redCards, setRedCards] = useState<number | null>(null);

  const msLeft = useMatchCountdown(match.matchDate);
  const isLocked = msLeft <= 0;
  const isUrgent = msLeft > 0 && msLeft <= 60 * 60 * 1000;
  const isToday = msLeft > 0 && msLeft <= 24 * 60 * 60 * 1000 && !isUrgent;

  const advancedMutation = trpc.matches.submitAdvancedPrediction.useMutation({
    onError: (err: any) => {
      console.error("Advanced prediction error:", err.message);
    },
  });

  const homeHebrew = hebrewTeamName(match.homeTeam);
  const awayHebrew = hebrewTeamName(match.awayTeam);
  const homeColors = getTeamColors(homeHebrew);
  const awayColors = getTeamColors(awayHebrew);
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
            <p className="font-bold text-sm mt-1.5 text-foreground">{homeHebrew}</p>
            <p className="text-[10px] text-muted-foreground">בית</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full border border-border/30 flex items-center justify-center bg-muted/10">
              <span className="text-xs font-black text-muted-foreground">VS</span>
            </div>
          </div>
          <div className="text-center">
            <TeamLogo teamName={match.awayTeam} size="md" />
            <p className="font-bold text-sm mt-1.5 text-foreground">{awayHebrew}</p>
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
                {userPrediction.prediction === "home" ? homeHebrew :
                 userPrediction.prediction === "away" ? awayHebrew : "תיקו"}
              </Badge>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-bold">חזה את התוצאה:</p>
            <div className="grid grid-cols-3 gap-2">
              {(["home", "draw", "away"] as const).map((pred) => {
                const isSelected = selectedPrediction === pred;
                const label = pred === "home" ? `${homeHebrew}` : pred === "draw" ? "תיקו" : `${awayHebrew}`;
                const color = pred === "home" ? homeColors.primary : pred === "away" ? awayColors.primary : "oklch(0.65 0.130 80)";
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
                  className="mt-3 space-y-4 p-3 rounded-lg bg-muted/5 border border-border/15"
                >
                  {([
                    { label: "שערים ⚽", emoji: "⚽", value: goals, set: setGoals, color: "oklch(0.55 0.110 232)" },
                    { label: "קרנות 🚩", emoji: "🚩", value: corners, set: setCorners, color: "oklch(0.65 0.160 200)" },
                    { label: "כרטיסים צהובים 🟨", emoji: "🟨", value: yellowCards, set: setYellowCards, color: "oklch(0.82 0.185 92)" },
                    { label: "כרטיסים אדומים 🟥", emoji: "🟥", value: redCards, set: setRedCards, color: "oklch(0.60 0.200 25)" },
                  ] as const).map(({ label, value, set, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] text-muted-foreground font-bold">{label}</p>
                        <div className="flex items-center gap-2">
                          {value !== null ? (
                            <span className="text-sm font-black tabular-nums px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                              {value}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">לא מגדיר</span>
                          )}
                          {value !== null && (
                            <button onClick={() => set(null)} className="text-muted-foreground/40 hover:text-muted-foreground text-[10px]">✕</button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={value ?? 5}
                        onChange={(e) => set(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: value !== null
                            ? `linear-gradient(to left, ${color} ${((value) / 20) * 100}%, oklch(0.30 0.020 240) ${((value) / 20) * 100}%)`
                            : "oklch(0.30 0.020 240)",
                          opacity: value !== null ? 1 : 0.45,
                        }}
                      />
                      <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-1 px-0.5">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                        <span>15</span>
                        <span>20</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedPrediction && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                <Button
                  onClick={() => {
                    onSubmitPrediction(match.id, selectedPrediction as "home" | "draw" | "away", homeHebrew, awayHebrew);
                    if (goals !== null || corners !== null || yellowCards !== null || redCards !== null) {
                      advancedMutation.mutate({
                        matchId: match.id,
                        goals: goals ?? undefined,
                        corners: corners ?? undefined,
                        yellowCards: yellowCards ?? undefined,
                        redCards: redCards ?? undefined,
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
  const homeHebrew = hebrewTeamName(match.homeTeam);
  const awayHebrew = hebrewTeamName(match.awayTeam);
  const homeColors = getTeamColors(homeHebrew);
  const awayColors = getTeamColors(awayHebrew);
  const userCorrect = userPrediction?.prediction === match.actualResult;

  const { data: advancedResults } = trpc.matches.getAdvancedResults.useQuery(
    { matchId: match.id },
    { enabled: !!isAuthenticated && !!match.actualResult }
  ) as { data: any };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "home": return homeHebrew;
      case "draw": return "תיקו";
      case "away": return awayHebrew;
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
            <p className="font-bold text-xs mt-1">{homeHebrew}</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/10 border border-border/20">
              <span className="text-2xl font-black" style={{ color: homeColors.primary }}>{match.actualHomeScore ?? 0}</span>
              <span className="text-muted-foreground font-bold">-</span>
              <span className="text-2xl font-black" style={{ color: awayColors.primary }}>{match.actualAwayScore ?? 0}</span>
            </div>
            {match.actualResult && (
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{getResultLabel(match.actualResult)}</p>
            )}
          </div>
          <div className="text-center">
            <TeamLogo teamName={match.awayTeam} size="sm" />
            <p className="font-bold text-xs mt-1">{awayHebrew}</p>
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
              {advancedResults.prediction.goals !== undefined && advancedResults.prediction.goals !== null && (
                <AdvancedResultItem label="שערים ⚽" predicted={advancedResults.prediction.goals} actual={advancedResults.actualStats.totalGoals ?? null} />
              )}
              {advancedResults.prediction.corners !== undefined && advancedResults.prediction.corners !== null && (
                <AdvancedResultItem label="קרנות 🚩" predicted={advancedResults.prediction.corners} actual={advancedResults.actualStats.totalCorners ?? null} />
              )}
              {advancedResults.prediction.yellowCards !== undefined && advancedResults.prediction.yellowCards !== null && (
                <AdvancedResultItem label="צהובים 🟨" predicted={advancedResults.prediction.yellowCards} actual={advancedResults.actualStats.totalYellowCards ?? null} />
              )}
              {advancedResults.prediction.redCards !== undefined && advancedResults.prediction.redCards !== null && (
                <AdvancedResultItem label="אדומים 🟥" predicted={advancedResults.prediction.redCards} actual={advancedResults.actualStats.totalRedCards ?? null} />
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function AdvancedResultItem({ label, predicted, actual }: { label: string; predicted: number; actual: number | null }) {
  const isCorrect = actual !== null && predicted === actual;
  const isPending = actual === null;
  return (
    <div className={`px-2 py-1.5 rounded text-center ${isPending ? "bg-muted/10 border border-border/20" : isCorrect ? "bg-primary/10 border border-primary/20" : "bg-red-500/10 border border-red-500/20"}`}>
      <p className="text-muted-foreground text-[10px]">{label}</p>
      <p className={`font-black text-sm ${isPending ? "text-muted-foreground" : isCorrect ? "text-primary" : "text-red-400"}`}>
        {predicted}
        {!isPending && <span className="text-[10px] mr-1">{isCorrect ? "✓" : `(${actual})`}</span>}
      </p>
    </div>
  );
}
