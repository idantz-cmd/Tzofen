import { useState, useEffect } from "react";
import { useCategory } from "@/contexts/CategoryContext";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LeaderboardSkeleton } from "@/components/ui/skeletons/LeaderboardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageTransition } from "@/components/animations";
import { Trophy, Target, BarChart3, Users } from "lucide-react";

export default function Leaderboard() {
  const { setCategory } = useCategory();
  useEffect(() => { setCategory("leaderboard"); }, [setCategory]);
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"all_time" | "weekly">("all_time");

  const { data: allTimeLeaderboard = [], isLoading: allTimeLoading, error: allTimeError, refetch: refetchAllTime } =
    trpc.leaderboard.getAllTime.useQuery({ limit: 100 });

  const { data: weeklyLeaderboard = [], isLoading: weeklyLoading, error: weeklyError, refetch: refetchWeekly } =
    trpc.leaderboard.getWeekly.useQuery({ limit: 100 });

  const { data: userPosition } = trpc.leaderboard.getUserPosition.useQuery(undefined, { enabled: !!user });

  const isLoading = timeframe === "all_time" ? allTimeLoading : weeklyLoading;
  const currentLeaderboard = timeframe === "all_time" ? allTimeLeaderboard : weeklyLeaderboard;
  const userRank = (currentLeaderboard as any[]).findIndex((e) => e.userId === user?.id) + 1;

  const totalPredictions = (currentLeaderboard as any[]).reduce((s, e) => s + (e.totalPredictions || 0), 0);
  const avgAccuracy =
    currentLeaderboard.length > 0
      ? ((currentLeaderboard as any[]).reduce((s, e) => s + (parseFloat(e.accuracyRate) || 0), 0) / currentLeaderboard.length).toFixed(1)
      : "0";

  const SUMMARY_CARDS = [
    {
      label: "המנחש המוביל",
      icon: Trophy,
      color: "#B38900",
      value: currentLeaderboard.length > 0 ? ((currentLeaderboard as any[])[0]?.name || "מנחש מוביל") : "—",
      sub: currentLeaderboard.length > 0
        ? `${((currentLeaderboard as any[])[0]?.totalPoints || 0).toLocaleString("he-IL")} נקודות`
        : "אין נתונים",
    },
    {
      label: "דיוק ממוצע",
      icon: Target,
      color: "#1F6BFF",
      value: `${avgAccuracy}%`,
      sub: "בקרב כל המשתתפים",
    },
    {
      label: 'סה"כ תחזיות',
      icon: BarChart3,
      color: "#8B4DFF",
      value: totalPredictions.toLocaleString("he-IL"),
      sub: "בקרב כל המשתתפים",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-8"
          >
            <h1 className="text-3xl font-black text-gradient-blue">לוח הדירוג</h1>
            <p className="text-sm text-muted-foreground mt-1">מי המנחש המדויק ביותר?</p>
          </motion.div>

          {/* User position banner */}
          {user && userRank > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Card className="p-4 border-primary/25 flex items-center justify-between"
                style={{ background: "rgba(31,107,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #4D8FFF, #1F6BFF)" }}>
                    #{userRank}
                  </div>
                  <div>
                    <p className="font-bold text-sm">המיקום שלך</p>
                    <p className="text-xs text-muted-foreground">
                      {userPosition?.totalPoints || 0} נקודות • {(userPosition?.accuracyRate ?? 0).toFixed(1)}% דיוק
                    </p>
                  </div>
                </div>
                <Trophy className="w-5 h-5" style={{ color: "#1F6BFF" }} />
              </Card>
            </motion.div>
          )}

          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as "all_time" | "weekly")} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/10 border border-border/20 h-11 mb-6">
              <TabsTrigger value="all_time" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary font-bold text-sm">
                כל הזמנים
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-secondary/15 data-[state=active]:text-secondary font-bold text-sm">
                השבוע
              </TabsTrigger>
            </TabsList>

            <TabsContent value={timeframe} className="space-y-5">
              {(timeframe === "all_time" ? allTimeError : weeklyError) ? (
                <ErrorState
                  title="שגיאה בטעינת טבלת הדירוג"
                  onRetry={timeframe === "all_time" ? refetchAllTime : refetchWeekly}
                />
              ) : isLoading ? (
                <LeaderboardSkeleton count={10} />
              ) : (
                <Card className="overflow-hidden border-border/20">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/20 text-xs font-bold text-muted-foreground"
                    style={{ background: "rgba(248,250,255,0.8)" }}>
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-4">שם</div>
                    <div className="col-span-3 text-center">נקודות</div>
                    <div className="col-span-2 text-center">דיוק</div>
                    <div className="col-span-2 text-center">תחזיות</div>
                  </div>

                  {currentLeaderboard.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-10 h-10 text-muted-foreground/25 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">אין נתונים זמינים</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {(currentLeaderboard as any[]).map((entry, index) => {
                        const rank = index + 1;
                        const isCurrentUser = entry.userId === user?.id;
                        const medalColor =
                          rank === 1 ? "#B38900"
                          : rank === 2 ? "#94A3B8"
                          : rank === 3 ? "#B45309"
                          : undefined;

                        return (
                          <motion.div
                            key={entry.id ?? entry.userId}
                            layout
                            layoutId={String(entry.userId)}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 16 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.025 }}
                            className={`grid grid-cols-12 gap-4 p-4 items-center border-b border-border/10 last:border-0 transition-colors ${
                              isCurrentUser
                                ? "border-r-2 border-primary"
                                : "hover:bg-primary/[0.03]"
                            }`}
                            style={isCurrentUser ? { background: "rgba(31,107,255,0.05)" } : {}}
                          >
                            <div className="col-span-1 text-center">
                              {rank <= 3 ? (
                                <span className="text-xl">{["🥇", "🥈", "🥉"][rank - 1]}</span>
                              ) : (
                                <span className="font-black text-sm" style={{ color: medalColor ?? "#64748B" }}>
                                  {rank}
                                </span>
                              )}
                            </div>

                            <div className="col-span-4 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                                style={{ background: `linear-gradient(135deg, ${medalColor ?? "#1F6BFF"}, #1F4CB3)` }}>
                                {rank}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-tight">
                                  {entry.name || "משתמש"}
                                </p>
                                {isCurrentUser && (
                                  <span className="text-[10px] text-primary font-bold">אתה</span>
                                )}
                              </div>
                            </div>

                            <div className="col-span-3 text-center">
                              <p className="text-base font-black tabular-nums" style={{ color: "#1F6BFF", textShadow: "0 0 10px rgba(31,107,255,0.45)" }}>
                                {(entry.totalPoints || 0).toLocaleString("he-IL")}
                              </p>
                            </div>

                            <div className="col-span-2 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold"
                                style={{ background: "rgba(139,77,255,0.12)", color: "#5B3FA0", border: "1px solid rgba(139,77,255,0.25)" }}>
                                {(parseFloat(entry.accuracyRate || "0") || 0).toFixed(1)}%
                              </span>
                            </div>

                            <div className="col-span-2 text-center text-sm text-muted-foreground tabular-nums">
                              {entry.totalPredictions || 0}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </Card>
              )}

              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUMMARY_CARDS.map(({ label, icon: Icon, color, value, sub }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  >
                    <Card className="p-5 text-center border-border/20 hover:border-primary/20 transition-all">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3"
                        style={{ background: `${color}1E` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-xl font-black" style={{ color }}>{value}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
}
