import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LeaderboardSkeleton } from "@/components/ui/skeletons/LeaderboardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export default function Leaderboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"all_time" | "weekly">("all_time");

  // Fetch leaderboard data
  const { data: allTimeLeaderboard = [], isLoading: allTimeLoading, error: allTimeError, refetch: refetchAllTime } =
    trpc.leaderboard.getAllTime.useQuery({ limit: 100 });

  const { data: weeklyLeaderboard = [], isLoading: weeklyLoading, error: weeklyError, refetch: refetchWeekly } =
    trpc.leaderboard.getWeekly.useQuery({ limit: 100 });

  // Fetch current user's position
  const { data: userPosition } = trpc.leaderboard.getUserPosition.useQuery(undefined, {
    enabled: !!user,
  });

  const isLoading = timeframe === "all_time" ? allTimeLoading : weeklyLoading;
  const currentLeaderboard = timeframe === "all_time" ? allTimeLeaderboard : weeklyLeaderboard;

  // Find user's rank in current leaderboard
  const userRank = currentLeaderboard.findIndex((entry: any) => entry.userId === user?.id) + 1;

  // Calculate stats
  const totalPoints = currentLeaderboard.reduce((sum: number, entry: any) => sum + (entry.totalPoints || 0), 0);
  const avgAccuracy =
    currentLeaderboard.length > 0
      ? (currentLeaderboard.reduce((sum: number, entry: any) => sum + (parseFloat(entry.accuracyRate) || 0), 0) /
          currentLeaderboard.length).toFixed(1)
      : "0";
  const totalPredictions = currentLeaderboard.reduce((sum: number, entry: any) => sum + (entry.totalPredictions || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">🏆 לוח הדירוג</h1>

        {/* Timeframe Tabs */}
        <Tabs
          value={timeframe}
          onValueChange={(v) => setTimeframe(v as "all_time" | "weekly")}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all_time">כל הזמנים</TabsTrigger>
            <TabsTrigger value="weekly">השבוע</TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="space-y-4">
            {/* Leaderboard */}
            {(timeframe === "all_time" ? allTimeError : weeklyError) ? (
              <ErrorState
                title="שגיאה בטעינת טבלת הדירוג"
                onRetry={timeframe === "all_time" ? refetchAllTime : refetchWeekly}
              />
            ) : isLoading ? (
              <LeaderboardSkeleton count={10} />
            ) : (
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 gap-4 p-4 bg-card/50 font-semibold text-sm">
                    <div className="col-span-1 text-center">דירוג</div>
                    <div className="col-span-4">שם</div>
                    <div className="col-span-3 text-center">נקודות</div>
                    <div className="col-span-2 text-center">דיוק</div>
                    <div className="col-span-2 text-center">תחזוקות</div>
                  </div>

                  {currentLeaderboard.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>אין נתונים זמינים</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {currentLeaderboard.map((entry: any, index: number) => {
                        const rank = index + 1;
                        const isCurrentUser = entry.userId === user?.id;

                        return (
                          <motion.div
                            key={entry.id ?? entry.userId}
                            layout
                            layoutId={String(entry.userId)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.03 }}
                            className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                              isCurrentUser ? "bg-accent/10 border-r-4 border-accent" : "hover:bg-card/30"
                            }`}
                          >
                            <div className="col-span-1 text-center">
                              <div className="flex items-center justify-center">
                                {rank === 1 && <span className="text-2xl">🥇</span>}
                                {rank === 2 && <span className="text-2xl">🥈</span>}
                                {rank === 3 && <span className="text-2xl">🥉</span>}
                                {rank > 3 && <span className="font-bold text-lg text-accent">#{rank}</span>}
                              </div>
                            </div>

                            <div className="col-span-4">
                              <p className="font-semibold">
                                {entry.userId ? "משתמש" : "לא ידוע"}
                                {isCurrentUser && <span className="text-xs text-accent mr-2">(אתה)</span>}
                              </p>
                            </div>

                            <div className="col-span-3 text-center">
                              <p className="text-lg font-bold text-accent">
                                {(entry.totalPoints || 0).toLocaleString("he-IL")}
                              </p>
                            </div>

                            <div className="col-span-2 text-center">
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-600/20 text-green-400 text-xs font-semibold">
                                {(parseFloat(entry.accuracyRate || "0") || 0).toFixed(1)}%
                              </div>
                            </div>

                            <div className="col-span-2 text-center text-sm text-muted-foreground">
                              {entry.totalPredictions || 0}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </Card>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">המנבא המובילי</p>
                <p className="text-2xl font-bold text-accent">
                  {currentLeaderboard.length > 0 ? "מנבא מובילי" : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentLeaderboard.length > 0
                    ? `${(currentLeaderboard[0]?.totalPoints || 0).toLocaleString("he-IL")} נקודות`
                    : "אין נתונים"}
                </p>
              </Card>

              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">דיוק ממוצע</p>
                <p className="text-2xl font-bold text-accent">{avgAccuracy}%</p>
                <p className="text-xs text-muted-foreground mt-2">בקרב כל המשתתפים</p>
              </Card>

              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">סה"כ תחזוקות</p>
                <p className="text-2xl font-bold text-accent">
                  {totalPredictions.toLocaleString("he-IL")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">בקרב כל המשתתפים</p>
              </Card>
            </div>

            {/* User's Position */}
            {user && userRank > 0 && (
              <Card className="p-6 bg-accent/10 border-accent">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">המיקום שלך בדירוג</p>
                  <p className="text-3xl font-bold text-accent mb-2">#{userRank}</p>
                  <p className="text-sm text-muted-foreground">
                    {userPosition?.totalPoints || 0} נקודות • {(userPosition?.accuracyRate ?? 0).toFixed(1)}% דיוק
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
