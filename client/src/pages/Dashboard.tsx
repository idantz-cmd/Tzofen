import { useState, useEffect } from "react";
import { useCategory } from "@/contexts/CategoryContext";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Flame, Trophy, Target, TrendingUp, Crown, BarChart3, CheckCircle2 } from "lucide-react";
import { PageTransition } from "@/components/animations";

const CHART_GRID   = "rgba(226,232,240,0.5)";
const CHART_AXIS   = "rgba(100,116,139,0.8)";
const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--foreground)",
  fontSize: "13px",
};

const STAT_CARDS = [
  {
    key: "accuracy",
    label: "דיוק כללי",
    icon: Target,
    color: "#1F6BFF",
    glow: "rgba(31,107,255,0.55)",
    sub: (s: any) => `${s?.correctPredictions || 0} מתוך ${s?.totalPredictions || 0}`,
    value: (s: any) => `${s?.accuracyRate || 0}%`,
  },
  {
    key: "points",
    label: 'סה"כ נקודות',
    icon: TrendingUp,
    color: "#8B4DFF",
    glow: "rgba(139,77,255,0.55)",
    sub: () => "נקודות מצטברות",
    value: (s: any) => (s?.totalPoints || 0).toLocaleString("he-IL"),
  },
  {
    key: "correct",
    label: "תחזיות נכונות",
    icon: CheckCircle2,
    color: "#13CE66",
    glow: "rgba(19,206,102,0.55)",
    sub: () => "תחזיות שהיו נכונות",
    value: (s: any) => s?.correctPredictions || 0,
  },
  {
    key: "total",
    label: "סה״כ תחזיות",
    icon: BarChart3,
    color: "#8B4DFF",
    glow: "rgba(139,77,255,0.55)",
    sub: () => "תחזיות שהוגשו",
    value: (s: any) => s?.totalPredictions || 0,
  },
];

export default function Dashboard() {
  const { setCategory } = useCategory();
  useEffect(() => { setCategory("profile"); }, [setCategory]);
  const { user } = useAuth();
  const [_timeframe, setTimeframe] = useState<"week" | "month" | "all">("month");

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(undefined, { enabled: !!user });
  const { data: recentPredictions = [], isLoading: predictionsLoading } = trpc.dashboard.getRecentPredictions.useQuery({ limit: 10 }, { enabled: !!user });
  const { data: streakData } = trpc.streaks.getMine.useQuery(undefined, { enabled: !!user });
  const { data: myCompetitions = [] } = trpc.competitions.getMine.useQuery(undefined, { enabled: !!user });
  const { data: streakHistory = [] } = trpc.streaks.getHistory.useQuery(undefined, { enabled: !!user });

  const mockWeeklyData = [
    { week: "שבוע 1", correct: 8, total: 12, points: 45 },
    { week: "שבוע 2", correct: 9, total: 13, points: 52 },
    { week: "שבוע 3", correct: 7, total: 11, points: 38 },
    { week: "שבוע 4", correct: 10, total: 14, points: 58 },
  ];

  const getPredictionLabel = (pick: string) => {
    switch (pick) {
      case "home":  return "ניצחון הבית";
      case "draw":  return "תיקו";
      case "away":  return "ניצחון חוץ";
      default:      return "";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("he-IL", { month: "short", day: "numeric" }).format(d);
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
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-8"
          >
            <h1 className="text-3xl font-black text-gradient-blue">לוח הבקרה שלי</h1>
            <p className="text-sm text-muted-foreground mt-1">ביצועים, רצפים ותחזיות אחרונות</p>
          </motion.div>

          {/* Stats Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-3 bg-muted/40 rounded w-2/3 mb-3" />
                  <div className="h-8 bg-muted/40 rounded w-1/2 mb-2" />
                  <div className="h-2 bg-muted/30 rounded w-3/4" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {STAT_CARDS.map(({ key, label, icon: Icon, color, glow, value, sub }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Card className="p-5 h-full border-border/20 hover:border-primary/20 transition-all duration-200 group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}1A` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    </div>
                    <p className="text-3xl font-black tabular-nums" style={{ color, textShadow: `0 0 14px ${glow}` }}>
                      {value(stats)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">{sub(stats)}</p>
                  </Card>
                </motion.div>
              ))}

              {/* Streak card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              >
                <Card className="p-5 h-full border-accent/20 hover:border-accent/40 transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, rgba(255,201,31,0.06) 0%, transparent 100%)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,201,31,0.15)" }}>
                      <Flame className="w-3.5 h-3.5" style={{ color: "#B38900" }} />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">רצף נוכחי</p>
                  </div>
                  <p className="text-3xl font-black tabular-nums" style={{ color: "#B38900", textShadow: "0 0 14px rgba(255,201,31,0.55)" }}>
                    {streakData?.currentStreak || 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    שיא:{" "}
                    <span className="font-bold" style={{ color: "#B38900" }}>
                      {streakData?.bestStreak || 0}
                    </span>{" "}
                    רצופות
                  </p>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/10 border border-border/20 h-11">
              <TabsTrigger value="performance" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary font-bold text-sm">ביצועים</TabsTrigger>
              <TabsTrigger value="streaks" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary font-bold text-sm">רצפים</TabsTrigger>
              <TabsTrigger value="competitions" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary font-bold text-sm">תחרויות</TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary font-bold text-sm">תחזיות אחרונות</TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-5">
              <Card className="p-6 border-border/20">
                <h3 className="text-base font-bold mb-5 text-foreground">ביצועים שבועיים</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={mockWeeklyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                    <XAxis dataKey="week" stroke={CHART_AXIS} tick={{ fill: CHART_AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={CHART_AXIS} tick={{ fill: CHART_AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "rgba(31,107,255,0.06)" }} />
                    <Legend wrapperStyle={{ fontSize: "13px", color: CHART_AXIS }} />
                    <Bar dataKey="correct" fill="#1F6BFF" name="נכונות" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" fill="#E2E8F0" name='סה"כ' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 border-border/20">
                <h3 className="text-base font-bold mb-5 text-foreground">מגמת נקודות</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mockWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                    <XAxis dataKey="week" stroke={CHART_AXIS} tick={{ fill: CHART_AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={CHART_AXIS} tick={{ fill: CHART_AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: "13px", color: CHART_AXIS }} />
                    <Line type="monotone" dataKey="points" stroke="#8B4DFF" name="נקודות" strokeWidth={2.5} dot={{ r: 4, fill: "#8B4DFF", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            {/* Streaks Tab */}
            <TabsContent value="streaks" className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Flame,       iconColor: "#B38900", bg: "rgba(255,201,31,0.08)",  border: "rgba(255,201,31,0.25)",
                    label: "רצף נוכחי", value: streakData?.currentStreak || 0, sub: "תחזיות נכונות ברצף",
                  },
                  {
                    icon: Trophy,      iconColor: "#1F6BFF", bg: "rgba(31,107,255,0.06)",  border: "rgba(31,107,255,0.25)",
                    label: "שיא אישי", value: streakData?.bestStreak || 0, sub: "הרצף הארוך ביותר שלך",
                  },
                  {
                    icon: Target,      iconColor: "#8B4DFF", bg: "rgba(139,77,255,0.06)",  border: "rgba(139,77,255,0.25)",
                    label: "תחזית נכונה אחרונה",
                    value: streakData?.lastCorrectAt ? formatDate(streakData.lastCorrectAt) : "—",
                    sub: "תאריך אחרון",
                  },
                ].map(({ icon: Icon, iconColor, bg, border, label, value, sub }) => (
                  <Card key={label} className="p-6" style={{ background: bg, borderColor: border }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5" style={{ color: iconColor }} />
                      <h4 className="font-bold text-sm">{label}</h4>
                    </div>
                    <p className="text-4xl font-black" style={{ color: iconColor }}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{sub}</p>
                  </Card>
                ))}
              </div>

              {/* Badges */}
              <Card className="p-6 border-border/20">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Crown className="w-4 h-4" style={{ color: "#B38900" }} />
                  תגים והישגים
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StreakBadge emoji="🔥" title="התחלה"  description="רצף של 3"  unlocked={(streakData?.bestStreak || 0) >= 3} />
                  <StreakBadge emoji="⚡" title="מומחה"  description="רצף של 5"  unlocked={(streakData?.bestStreak || 0) >= 5} />
                  <StreakBadge emoji="🌟" title="כוכב"   description="רצף של 10" unlocked={(streakData?.bestStreak || 0) >= 10} />
                  <StreakBadge emoji="🏆" title="אלוף"   description="רצף של 15" unlocked={(streakData?.bestStreak || 0) >= 15} />
                </div>
              </Card>

              {/* History */}
              <Card className="p-6 border-border/20">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  היסטוריית רצפים
                </h3>
                {streakHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm">אין היסטוריה עדיין — התחל לחזות!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(streakHistory as any[]).map((pred) => (
                      <div
                        key={pred.id}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${
                          pred.isCorrect
                            ? "bg-primary/15 border-primary/35 text-primary"
                            : "bg-destructive/15 border-destructive/30 text-destructive"
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
                <Card className="p-10 text-center border-border/20">
                  <Trophy className="w-12 h-12 text-muted-foreground/25 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">עדיין לא הצטרפת לתחרויות</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">עבור לעמוד התחרויות כדי להצטרף או ליצור תחרות</p>
                </Card>
              ) : (
                (myCompetitions as any[]).filter((c) => c.status === "active").map((comp) => (
                  <Card key={comp.id} className="p-5 border-border/20 hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{comp.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {comp.type === "tournament" ? "טורניר" : "דו-קרב"} • הנקודות שלך:{" "}
                          <span className="text-primary font-bold">{comp.myPoints || 0}</span>
                        </p>
                      </div>
                      <Badge className="bg-primary/15 text-primary border-primary/25 font-bold">פעיל</Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Recent Predictions Tab */}
            <TabsContent value="recent" className="space-y-3">
              {predictionsLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : recentPredictions.length === 0 ? (
                <Card className="p-10 text-center border-border/20">
                  <p className="text-muted-foreground">אין תחזיות עדיין</p>
                </Card>
              ) : (
                (recentPredictions as any[]).map((pred, i) => (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Card className="p-4 border-border/20 hover:border-primary/15 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm">{pred.homeTeam || "—"} vs {pred.awayTeam || "—"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(pred.createdAt)}</p>
                        </div>
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-sm"
                          style={
                            pred.isCorrect
                              ? { background: "rgba(31,107,255,0.12)", color: "#1F6BFF", border: "1px solid rgba(31,107,255,0.25)" }
                              : pred.isCorrect === false
                              ? { background: "rgba(255,59,92,0.12)", color: "#CC1F45", border: "1px solid rgba(255,59,92,0.25)" }
                              : { background: "rgba(255,201,31,0.12)", color: "#B38900", border: "1px solid rgba(255,201,31,0.25)" }
                          }
                        >
                          {pred.isCorrect ? "✓" : pred.isCorrect === false ? "✗" : "⏳"} {pred.points || 0} נקודות
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/10 pt-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">התחזית שלך</p>
                          <p className="font-semibold">{getPredictionLabel(pred.prediction)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">התוצאה בפועל</p>
                          <p className="font-semibold text-primary">{pred.actualResult ? getPredictionLabel(pred.actualResult) : "לא פורסמה"}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
}

function StreakBadge({ emoji, title, description, unlocked }: {
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}) {
  return (
    <div
      className={`relative p-4 rounded-xl border text-center transition-all ${
        unlocked
          ? "border-accent/30"
          : "bg-muted/5 border-border/20 opacity-40 grayscale"
      }`}
      style={unlocked ? { background: "rgba(255,201,31,0.06)" } : {}}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <p className={`text-sm font-bold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>{title}</p>
      <p className="text-[10px] text-muted-foreground">{description}</p>
      {unlocked && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#1F6BFF" }}>
          <span className="text-[9px] text-white font-black">✓</span>
        </div>
      )}
    </div>
  );
}
