import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Flame, Trophy, Target, TrendingUp, Crown } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month");

  // Fetch user dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch recent predictions
  const { data: recentPredictions = [], isLoading: predictionsLoading } = trpc.dashboard.getRecentPredictions.useQuery(
    { limit: 10 },
    { enabled: !!user }
  );

  // Fetch streak data
  const { data: streakData } = trpc.streaks.getMine.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch my competitions
  const { data: myCompetitions = [] } = trpc.competitions.getMine.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: streakHistory = [] } = trpc.streaks.getHistory.useQuery(undefined, {
    enabled: !!user,
  });

  // Mock weekly data - in production this would come from the API
  const mockWeeklyData = [
    { week: "שבוע 1", correct: 8, total: 12, points: 45 },
    { week: "שבוע 2", correct: 9, total: 13, points: 52 },
    { week: "שבוע 3", correct: 7, total: 11, points: 38 },
    { week: "שבוע 4", correct: 10, total: 14, points: 58 },
  ];

  const getPredictionLabel = (pick: string) => {
    switch (pick) {
      case "home":
        return "ניצחון הבית";
      case "draw":
        return "תיקו";
      case "away":
        return "ניצחון חוץ";
      default:
        return "";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("he-IL", {
      month: "short",
      day: "numeric",
    }).format(d);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">התחבר כדי לראות את לוח הבקרה שלך</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">📊 לוח הבקרה שלי</h1>

        {/* Stats Overview */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-3 bg-muted/40 rounded w-2/3 mb-3" />
                <div className="h-8 bg-muted/40 rounded w-1/2 mb-2" />
                <div className="h-2 bg-muted/30 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">דיוק כללי</p>
              <p className="text-3xl font-bold text-accent">{stats?.accuracyRate || 0}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.correctPredictions || 0} מתוך {stats?.totalPredictions || 0}
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">סה"כ נקודות</p>
              <p className="text-3xl font-bold text-accent">
                {(stats?.totalPoints || 0).toLocaleString("he-IL")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">נקודות מצטברות</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">תחזיות נכונות</p>
              <p className="text-3xl font-bold text-accent">
                {stats?.correctPredictions || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">תחזיות שהיו נכונות</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">סה"כ תחזיות</p>
              <p className="text-3xl font-bold text-accent">
                {stats?.totalPredictions || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">תחזיות שהוגשו</p>
            </Card>

            {/* Streak Card */}
            <Card className="p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <p className="text-sm text-muted-foreground">רצף נוכחי</p>
              </div>
              <p className="text-3xl font-bold text-amber-400">
                {streakData?.currentStreak || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                שיא: <span className="text-amber-400 font-bold">{streakData?.bestStreak || 0}</span> רצופות
              </p>
            </Card>
          </div>
        )}

        {/* Charts and Recent Predictions */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">ביצועים</TabsTrigger>
            <TabsTrigger value="streaks">רצפים</TabsTrigger>
            <TabsTrigger value="competitions">תחרויות</TabsTrigger>
            <TabsTrigger value="recent">תחזיות אחרונות</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            {/* Weekly Performance Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">ביצועים שבועיים</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 20, 25, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="correct" fill="#00d084" name="נכונות" />
                  <Bar dataKey="total" fill="rgba(255,255,255,0.2)" name="סה״כ" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Points Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">מגמת נקודות</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 20, 25, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="points"
                    stroke="#00d084"
                    name="נקודות"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks" className="space-y-6">
            {/* Streak Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold">רצף נוכחי</h4>
                </div>
                <p className="text-4xl font-black text-amber-400">{streakData?.currentStreak || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">תחזיות נכונות ברצף</p>
              </Card>

              <Card className="p-6 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h4 className="font-bold">שיא אישי</h4>
                </div>
                <p className="text-4xl font-black text-primary">{streakData?.bestStreak || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">הרצף הארוך ביותר שלך</p>
              </Card>

              <Card className="p-6 border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold">תחזית נכונה אחרונה</h4>
                </div>
                <p className="text-lg font-bold text-blue-400">
                  {streakData?.lastCorrectAt
                    ? formatDate(streakData.lastCorrectAt)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">תאריך אחרון</p>
              </Card>
            </div>

            {/* Streak Badges */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                תגים והישגים
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StreakBadge
                  emoji="🔥"
                  title="התחלה"
                  description="רצף של 3"
                  unlocked={(streakData?.bestStreak || 0) >= 3}
                />
                <StreakBadge
                  emoji="⚡"
                  title="מומחה"
                  description="רצף של 5"
                  unlocked={(streakData?.bestStreak || 0) >= 5}
                />
                <StreakBadge
                  emoji="🌟"
                  title="כוכב"
                  description="רצף של 10"
                  unlocked={(streakData?.bestStreak || 0) >= 10}
                />
                <StreakBadge
                  emoji="🏆"
                  title="אלוף"
                  description="רצף של 15"
                  unlocked={(streakData?.bestStreak || 0) >= 15}
                />
              </div>
            </Card>

            {/* Streak History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                היסטוריית רצפים
              </h3>
              {streakHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">אין היסטוריה עדיין — התחל לחזות!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {streakHistory.map((pred: any) => (
                    <div
                      key={pred.id}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                        pred.isCorrect
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "bg-red-500/20 border-red-500/40 text-red-400"
                      }`}
                      title={`${getPredictionLabel(pred.prediction)} — ${pred.isCorrect ? "נכון" : "שגוי"}`}
                    >
                      {pred.isCorrect ? "✓" : "✗"}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Competitions Tab */}
          <TabsContent value="competitions" className="space-y-4">
            {myCompetitions.length === 0 ? (
              <Card className="p-6 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">עדיין לא הצטרפת לתחרויות</p>
                <p className="text-sm text-muted-foreground/70 mt-1">עבור לעמוד התחרויות כדי להצטרף או ליצור תחרות</p>
              </Card>
            ) : (
              myCompetitions.filter((c: any) => c.status === "active").map((comp: any) => (
                <Card key={comp.id} className="p-5 border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{comp.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {comp.type === "tournament" ? "טורניר" : "דו-קרב"} • הנקודות שלך: <span className="text-primary font-bold">{comp.myPoints || 0}</span>
                      </p>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      פעיל
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {predictionsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : recentPredictions.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">אין תחזיות עדיין</p>
              </Card>
            ) : (
              recentPredictions.map((pred: any) => (
                <Card key={pred.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">
                          {pred.homeTeam || "—"} vs {pred.awayTeam || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(pred.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-semibold ${
                          pred.isCorrect
                            ? "bg-green-600/20 text-green-400"
                            : pred.isCorrect === false
                              ? "bg-red-600/20 text-red-400"
                              : "bg-yellow-600/20 text-yellow-400"
                        }`}
                      >
                        {pred.isCorrect ? "✓" : pred.isCorrect === false ? "✗" : "⏳"} {pred.points || 0} נקודות
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">התחזית שלך</p>
                      <p className="font-semibold">
                        {getPredictionLabel(pred.prediction)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">התוצאה בפועל</p>
                      <p className="font-semibold text-accent">
                        {pred.actualResult ? getPredictionLabel(pred.actualResult) : "לא פורסמה"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ===== Streak Badge Component ===== */
function StreakBadge({ emoji, title, description, unlocked }: {
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}) {
  return (
    <div className={`relative p-4 rounded-xl border text-center transition-all ${
      unlocked
        ? "bg-amber-500/5 border-amber-500/30"
        : "bg-muted/5 border-border/20 opacity-40 grayscale"
    }`}>
      <div className="text-2xl mb-1">{emoji}</div>
      <p className={`text-sm font-bold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>{title}</p>
      <p className="text-[10px] text-muted-foreground">{description}</p>
      {unlocked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "oklch(0.55 0.110 232)" }}>
          <span className="text-[8px] text-white font-bold">✓</span>
        </div>
      )}
    </div>
  );
}
