import { useState } from "react";
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

  const utils = trpc.useUtils();

  // Fetch upcoming matches
  const { data: matches = [], isLoading: matchesLoading } = trpc.matches.getUpcoming.useQuery({
    league: selectedLeague,
  });

  // Fetch completed matches
  const { data: completedMatches = [], isLoading: completedLoading } = trpc.matches.getCompleted.useQuery({
    league: selectedLeague,
  });

  // Fetch user predictions if authenticated
  const { data: userPredictions = [] } = trpc.matches.getUserPredictions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Submit prediction mutation
  const submitPredictionMutation = trpc.matches.submitPrediction.useMutation({
    onSuccess: () => {
      toast.success("החיזוי שלך ננעל בהצלחה!");
      utils.matches.getUserPredictions.invalidate();
    },
    onError: (error: any) => {
      toast.error(`שגיאה: ${error.message}`);
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-black text-foreground">משחקים וחיזויים</h1>
          <p className="text-sm text-muted-foreground mt-1">חזה תוצאות • צבור נקודות • עלה בדירוג</p>
        </motion.div>

        {/* Tab Buttons: Upcoming vs Completed */}
        <div className="flex gap-2 mb-5">
          <Button
            variant={activeTab === "upcoming" ? "default" : "outline"}
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 h-11 font-bold transition-all duration-150 active:scale-[0.97] ${
              activeTab === "upcoming"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4 ml-1.5" />
            משחקים קרובים
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className={`flex-1 h-11 font-bold transition-all duration-150 active:scale-[0.97] ${
              activeTab === "completed"
                ? "bg-slate-600 hover:bg-slate-700 text-white"
                : "border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 ml-1.5" />
            תוצאות
          </Button>
        </div>

        {/* League Tabs */}
        <Tabs
          value={selectedLeague}
          onValueChange={(v) => setSelectedLeague(v as "ligat_hael" | "ligah_leumit")}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted/10 border border-border/20 h-10">
            <TabsTrigger value="ligat_hael" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 font-bold text-sm">
              ליגת העל
            </TabsTrigger>
            <TabsTrigger value="ligah_leumit" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 font-bold text-sm">
              ליגה לאומית
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ligat_hael" className="mt-5">
            {activeTab === "upcoming" ? (
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
            ) : (
              <CompletedList
                matches={completedMatches}
                isLoading={completedLoading}
                userPredictions={userPredictions}
                formatDate={formatDate}
              />
            )}
          </TabsContent>

          <TabsContent value="ligah_leumit" className="mt-5">
            {activeTab === "upcoming" ? (
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
            ) : (
              <CompletedList
                matches={completedMatches}
                isLoading={completedLoading}
                userPredictions={userPredictions}
                formatDate={formatDate}
              />
            )}
          </TabsContent>
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
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">אין משחקים קרובים כרגע</p>
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

  const advancedMutation = trpc.matches.submitAdvancedPrediction.useMutation({
    onError: (err: any) => {
      console.error("Advanced prediction error:", err.message);
    },
  });

  const homeColors = getTeamColors(match.homeTeam);
  const awayColors = getTeamColors(match.awayTeam);
  const hasPredicted = !!userPrediction;

  return (
    <Card className="overflow-hidden border-border/20 hover:border-emerald-500/20 transition-all duration-200">
      {/* Team color gradient bar */}
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDate(match.matchDate)}
          </div>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-3 items-center gap-2 mb-4">
          {/* Home */}
          <div className="text-center">
            <TeamLogo teamName={match.homeTeam} size="md" />
            <p className="font-bold text-sm mt-1.5 text-foreground">{match.homeTeam}</p>
            <p className="text-[10px] text-muted-foreground">בית</p>
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full border border-border/30 flex items-center justify-center bg-muted/10">
              <span className="text-xs font-black text-muted-foreground">VS</span>
            </div>
          </div>

          {/* Away */}
          <div className="text-center">
            <TeamLogo teamName={match.awayTeam} size="md" />
            <p className="font-bold text-sm mt-1.5 text-foreground">{match.awayTeam}</p>
            <p className="text-[10px] text-muted-foreground">חוץ</p>
          </div>
        </div>

        {/* Prediction Section */}
        {hasPredicted ? (
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">החיזוי שלך ננעל</span>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 mr-auto text-xs">
                {userPrediction.prediction === "home_win" ? `ניצחון ${match.homeTeam}` :
                 userPrediction.prediction === "away_win" ? `ניצחון ${match.awayTeam}` : "תיקו"}
              </Badge>
            </div>
          </div>
        ) : isAuthenticated ? (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-bold">חזה את התוצאה:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPrediction("home_win")}
                disabled={isSubmitting}
                className={`h-11 text-xs font-bold transition-all active:scale-[0.97] ${
                  selectedPrediction === "home_win"
                    ? "text-white border-transparent shadow-md"
                    : "border-border/30 hover:border-emerald-500/30"
                }`}
                style={selectedPrediction === "home_win" ? { backgroundColor: homeColors.primary, color: "#fff" } : {}}
              >
                ניצחון בית
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPrediction("draw")}
                disabled={isSubmitting}
                className={`h-11 text-xs font-bold transition-all active:scale-[0.97] ${
                  selectedPrediction === "draw"
                    ? "bg-amber-600 text-white border-transparent shadow-md"
                    : "border-border/30 hover:border-amber-500/30"
                }`}
              >
                תיקו
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPrediction("away_win")}
                disabled={isSubmitting}
                className={`h-11 text-xs font-bold transition-all active:scale-[0.97] ${
                  selectedPrediction === "away_win"
                    ? "text-white border-transparent shadow-md"
                    : "border-border/30 hover:border-emerald-500/30"
                }`}
                style={selectedPrediction === "away_win" ? { backgroundColor: awayColors.primary, color: "#fff" } : {}}
              >
                ניצחון חוץ
              </Button>
            </div>

            {/* Advanced Predictions Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <Flame className="w-3 h-3" />
              חיזויים מתקדמים (בונוס נקודות)
            </button>

            {/* Advanced Prediction Parameters */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3 p-3 rounded-lg bg-muted/5 border border-border/15"
                >
                  {/* Goals Over/Under */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">שערים (מעל/מתחת 2.5)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGoalsOver(goalsOver === "over" ? null : "over")}
                        className={`text-xs h-9 ${goalsOver === "over" ? "bg-emerald-600 text-white border-transparent" : "border-border/30"}`}
                      >
                        מעל 2.5
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGoalsOver(goalsOver === "under" ? null : "under")}
                        className={`text-xs h-9 ${goalsOver === "under" ? "bg-emerald-600 text-white border-transparent" : "border-border/30"}`}
                      >
                        מתחת 2.5
                      </Button>
                    </div>
                  </div>

                  {/* Corners */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">קרנות (מעל/מתחת 9.5)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCornersOver(cornersOver === "over" ? null : "over")}
                        className={`text-xs h-9 ${cornersOver === "over" ? "bg-blue-600 text-white border-transparent" : "border-border/30"}`}
                      >
                        מעל 9.5
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCornersOver(cornersOver === "under" ? null : "under")}
                        className={`text-xs h-9 ${cornersOver === "under" ? "bg-blue-600 text-white border-transparent" : "border-border/30"}`}
                      >
                        מתחת 9.5
                      </Button>
                    </div>
                  </div>

                  {/* Yellow Cards */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">כרטיסים צהובים (מעל/מתחת 3.5)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setYellowCards(yellowCards === "over" ? null : "over")}
                        className={`text-xs h-9 ${yellowCards === "over" ? "bg-yellow-500 text-black border-transparent" : "border-border/30"}`}
                      >
                        מעל 3.5
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setYellowCards(yellowCards === "under" ? null : "under")}
                        className={`text-xs h-9 ${yellowCards === "under" ? "bg-yellow-500 text-black border-transparent" : "border-border/30"}`}
                      >
                        מתחת 3.5
                      </Button>
                    </div>
                  </div>

                  {/* Red Card */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-bold">כרטיס אדום</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRedCard(redCard === "yes" ? null : "yes")}
                        className={`text-xs h-9 ${redCard === "yes" ? "bg-red-600 text-white border-transparent" : "border-border/30"}`}
                      >
                        יהיה
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRedCard(redCard === "no" ? null : "no")}
                        className={`text-xs h-9 ${redCard === "no" ? "bg-slate-600 text-white border-transparent" : "border-border/30"}`}
                      >
                        לא יהיה
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            {selectedPrediction && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <Button
                  onClick={() => {
                    onSubmitPrediction(match.id, selectedPrediction as "home_win" | "draw" | "away_win");
                    // Also submit advanced predictions if any are set
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
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold active:scale-[0.97] transition-transform duration-150"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 ml-1.5" />
                      נעל חיזוי
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/5 border border-border/15 text-center">
            <p className="text-xs text-muted-foreground mb-2">התחבר כדי לחזות תוצאות</p>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              התחבר עכשיו
            </Button>
          </div>
        )}

        {/* Expand for analysis */}
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-emerald-400 transition-colors w-full justify-center pt-2 border-t border-border/10"
        >
          <TrendingUp className="w-3 h-3" />
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isExpanded ? "הסתר ניתוח" : "הצג ניתוח מקצועי"}
        </button>

        {/* Expanded Analysis */}
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
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
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
            <CompletedMatchCard
              match={match}
              userPrediction={userPred}
              formatDate={formatDate}
            />
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

  // Fetch advanced results if user is authenticated
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
    <Card className={`overflow-hidden border-border/20 ${userCorrect ? "border-emerald-500/30" : ""}`}>
      {/* Result color bar */}
      <div className={`h-1 ${userCorrect ? "bg-emerald-500" : userPrediction ? "bg-red-500/60" : "bg-muted/30"}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-[11px] border-border/20 text-muted-foreground">
            {match.league === "ligat_hael" ? "ליגת העל" : "ליגה לאומית"}
          </Badge>
          {userPrediction && (
            <Badge className={`text-[11px] ${
              userCorrect
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/15 text-red-400 border-red-500/30"
            }`}>
              {userCorrect ? (
                <><CheckCircle2 className="w-3 h-3 ml-1" /> צדקת!</>
              ) : "לא צדקת"}
              {userPrediction.pointsEarned ? ` (+${userPrediction.pointsEarned})` : ""}
            </Badge>
          )}
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 items-center gap-2">
          <div className="text-center">
            <TeamLogo teamName={match.homeTeam} size="sm" />
            <p className="font-bold text-xs mt-1">{match.homeTeam}</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/10 border border-border/20">
              <span className="text-2xl font-black" style={{ color: homeColors.primary }}>
                {match.homeTeamScore ?? 0}
              </span>
              <span className="text-muted-foreground font-bold">-</span>
              <span className="text-2xl font-black" style={{ color: awayColors.primary }}>
                {match.awayTeamScore ?? 0}
              </span>
            </div>
            {match.actualResult && (
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                {getResultLabel(match.actualResult)}
              </p>
            )}
          </div>

          <div className="text-center">
            <TeamLogo teamName={match.awayTeam} size="sm" />
            <p className="font-bold text-xs mt-1">{match.awayTeam}</p>
          </div>
        </div>

        {/* User Prediction Display */}
        {userPrediction && (
          <div className="mt-3 pt-2 border-t border-border/10 text-center">
            <span className="text-xs text-muted-foreground">
              החיזוי שלך:{" "}
              <span className={`font-bold ${userCorrect ? "text-emerald-400" : "text-red-400"}`}>
                {getResultLabel(userPrediction.prediction)}
              </span>
            </span>
          </div>
        )}

        {/* Advanced Prediction Results */}
        {advancedResults && advancedResults.actualStats && (
          <div className="mt-3 pt-2 border-t border-border/10">
            <p className="text-[10px] text-muted-foreground font-medium mb-2 text-center">חיזויים מתקדמים</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {advancedResults.prediction.goalsOverUnder && (
                <AdvancedResultItem
                  label="שערים (2.5)"
                  prediction={advancedResults.prediction.goalsOverUnder}
                  actual={(advancedResults.actualStats.totalGoals ?? 0) > 2.5 ? "over" : "under"}
                />
              )}
              {advancedResults.prediction.cornersOverUnder && (
                <AdvancedResultItem
                  label="קרנות (9.5)"
                  prediction={advancedResults.prediction.cornersOverUnder}
                  actual={(advancedResults.actualStats.totalCorners ?? 0) > 9.5 ? "over" : "under"}
                />
              )}
              {advancedResults.prediction.yellowCardsOverUnder && (
                <AdvancedResultItem
                  label="צהובים (3.5)"
                  prediction={advancedResults.prediction.yellowCardsOverUnder}
                  actual={(advancedResults.actualStats.totalYellowCards ?? 0) > 3.5 ? "over" : "under"}
                />
              )}
              {advancedResults.prediction.redCardInMatch !== null && advancedResults.prediction.redCardInMatch !== undefined && (
                <AdvancedResultItem
                  label="אדום"
                  prediction={advancedResults.prediction.redCardInMatch ? "yes" : "no"}
                  actual={(advancedResults.actualStats.totalRedCards ?? 0) > 0 ? "yes" : "no"}
                />
              )}
            </div>
            {(advancedResults.prediction.points ?? 0) > 0 && (
              <p className="text-center text-[10px] text-emerald-400 font-bold mt-2">
                +{advancedResults.prediction.points} נק' בונוס
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ===== Advanced Result Item ===== */
function AdvancedResultItem({ label, prediction, actual }: { label: string; prediction: string; actual: string }) {
  const isCorrect = prediction === actual;
  const displayPred = prediction === "over" ? "מעל" : prediction === "under" ? "מתחת" : prediction === "yes" ? "כן" : "לא";
  return (
    <div className={`px-2 py-1 rounded text-center ${isCorrect ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
      <span className="text-muted-foreground">{label}: </span>
      <span className={`font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
        {displayPred} {isCorrect ? "✓" : "✗"}
      </span>
    </div>
  );
}
