import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Download, RefreshCw, Calendar, CheckCircle, AlertCircle, Database, TrendingUp, Users, Send, Flame, Activity, Moon, TrendingDown, Search, ShieldCheck, ShieldOff, Cpu, Wifi } from "lucide-react";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState<{
    homeScore: number;
    awayScore: number;
    result: "home" | "draw" | "away" | null;
  }>({
    homeScore: 0,
    awayScore: 0,
    result: null,
  });
  const [advancedStats, setAdvancedStats] = useState({
    totalCorners: 0,
    totalYellowCards: 0,
    totalRedCards: 0,
  });

  // Wait for auth to load before checking role
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-lg text-red-400 mb-4">🚫 גישה נדחתה</p>
            <p className="text-muted-foreground mb-6">רק מנהלים יכולים לגשת לעמוד זה</p>
            <Button onClick={() => navigate("/")}>חזור לבית</Button>
          </Card>
        </main>
      </div>
    );
  }

  // Fetch all matches
  const { data: allMatches = [], isLoading: matchesLoading } = trpc.admin.getAllMatches.useQuery({
    limit: 500,
  });

  // Publish result mutation
  const publishResultMutation = trpc.admin.publishMatchResult.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedMatch(null);
      setMatchResult({ homeScore: 0, awayScore: 0, result: null });
      setAdvancedStats({ totalCorners: 0, totalYellowCards: 0, totalRedCards: 0 });
    },
    onError: (error) => {
      toast.error(`שגיאה: ${error.message}`);
    },
  });

  const handleScoreChange = (team: "home" | "away", score: number) => {
    const newScore = {
      ...matchResult,
      [team === "home" ? "homeScore" : "awayScore"]: score,
    };

    // Auto-calculate result
    if (newScore.homeScore > newScore.awayScore) {
      newScore.result = "home";
    } else if (newScore.homeScore < newScore.awayScore) {
      newScore.result = "away";
    } else {
      newScore.result = "draw";
    }

    setMatchResult(newScore);
  };

  const handlePublishResult = () => {
    if (selectedMatch && matchResult.result) {
      publishResultMutation.mutate({
        matchId: selectedMatch,
        homeScore: matchResult.homeScore,
        awayScore: matchResult.awayScore,
        totalCorners: advancedStats.totalCorners || undefined,
        totalYellowCards: advancedStats.totalYellowCards || undefined,
        totalRedCards: advancedStats.totalRedCards || undefined,
      });
    }
  };

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

  const unpublishedMatches = allMatches.filter((m: any) => !m.actualResult);
  const publishedMatches = allMatches.filter((m: any) => m.actualResult);
  const selectedMatchData = allMatches.find((m: any) => m.id === selectedMatch);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">⚙️ ניהול מערכת</h1>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            <TabsTrigger value="users">משתמשים</TabsTrigger>
            <TabsTrigger value="publish">פרסום תוצאות</TabsTrigger>
            <TabsTrigger value="import">ייבוא אוטומטי</TabsTrigger>
            <TabsTrigger value="leaguedata">נתוני ליגה</TabsTrigger>
            <TabsTrigger value="history">היסטוריה</TabsTrigger>
            <TabsTrigger value="engagement">מעורבות</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewPanel />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <UsersPanel />
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <ImportPanel />
          </TabsContent>

          {/* League Data Tab */}
          <TabsContent value="leaguedata" className="space-y-6">
            <LeagueDataPanel />
          </TabsContent>

          {/* Publish Results Tab */}
          <TabsContent value="publish" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Matches List */}
              <div className="lg:col-span-1 space-y-2">
                <h3 className="font-semibold mb-4">משחקים בהמתנה</h3>
                {matchesLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : unpublishedMatches.length === 0 ? (
                  <Card className="p-4 text-center text-muted-foreground">
                    אין משחקים בהמתנה
                  </Card>
                ) : (
                  unpublishedMatches.map((match: any) => (
                    <Card
                      key={match.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedMatch === match.id
                          ? "border-accent bg-accent/10"
                          : "hover:border-accent/50"
                      }`}
                      onClick={() => {
                        setSelectedMatch(match.id);
                        setMatchResult({ homeScore: 0, awayScore: 0, result: null });
                        setAdvancedStats({ totalCorners: 0, totalYellowCards: 0, totalRedCards: 0 });
                      }}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {match.homeTeam} vs {match.awayTeam}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(match.matchDate)}
                      </p>
                    </Card>
                  ))
                )}
              </div>

              {/* Result Entry Form */}
              <div className="lg:col-span-2">
                {selectedMatchData ? (
                  <Card className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          {selectedMatchData.homeTeam} vs {selectedMatchData.awayTeam}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {formatDate(selectedMatchData.matchDate)}
                        </p>
                      </div>

                      {/* Score Input */}
                      <div className="grid grid-cols-3 gap-4 items-end">
                        {/* Home Team Score */}
                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            {selectedMatchData.homeTeam}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={matchResult.homeScore}
                            onChange={(e) =>
                              handleScoreChange("home", parseInt(e.target.value) || 0)
                            }
                            className="w-full px-4 py-2 bg-card border border-border rounded-lg text-center text-2xl font-bold"
                          />
                        </div>

                        {/* VS */}
                        <div className="text-center">
                          <p className="text-muted-foreground text-sm mb-2">נגד</p>
                          <p className="text-2xl font-bold text-accent">VS</p>
                        </div>

                        {/* Away Team Score */}
                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            {selectedMatchData.awayTeam}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={matchResult.awayScore}
                            onChange={(e) =>
                              handleScoreChange("away", parseInt(e.target.value) || 0)
                            }
                            className="w-full px-4 py-2 bg-card border border-border rounded-lg text-center text-2xl font-bold"
                          />
                        </div>
                      </div>

                      {/* Advanced Stats Section */}
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                          📊 סטטיסטיקות מתקדמות (אופציונלי — לניקוד חיזויים מתקדמים)
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              קרנות (סה"כ)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={advancedStats.totalCorners}
                              onChange={(e) =>
                                setAdvancedStats((s) => ({
                                  ...s,
                                  totalCorners: parseInt(e.target.value) || 0,
                                }))
                              }
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-center font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              כרטיסים צהובים
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={advancedStats.totalYellowCards}
                              onChange={(e) =>
                                setAdvancedStats((s) => ({
                                  ...s,
                                  totalYellowCards: parseInt(e.target.value) || 0,
                                }))
                              }
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-center font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              כרטיסים אדומים
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={advancedStats.totalRedCards}
                              onChange={(e) =>
                                setAdvancedStats((s) => ({
                                  ...s,
                                  totalRedCards: parseInt(e.target.value) || 0,
                                }))
                              }
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-center font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Result Display */}
                      {matchResult.result && (
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <p className="text-sm text-muted-foreground mb-2">התוצאה:</p>
                          <p className="text-lg font-bold text-accent">
                            {matchResult.result === "home"
                              ? `ניצחון ${selectedMatchData.homeTeam}`
                              : matchResult.result === "away"
                                ? `ניצחון ${selectedMatchData.awayTeam}`
                                : "תיקו"}
                          </p>
                        </div>
                      )}

                      {/* Publish Button */}
                      <Button
                        onClick={handlePublishResult}
                        disabled={!matchResult.result || publishResultMutation.isPending}
                        className="w-full bg-accent hover:bg-accent/90"
                      >
                        {publishResultMutation.isPending ? <Spinner /> : "פרסם תוצאה ✓"}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 text-center text-muted-foreground">
                    בחר משחק מהרשימה כדי להזין תוצאה
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <EngagementPanel />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h3 className="font-semibold mb-4">משחקים שפורסמו</h3>
            {matchesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : publishedMatches.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                אין משחקים שפורסמו עדיין
              </Card>
            ) : (
              publishedMatches.map((match: any) => (
                <Card key={match.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold mb-1">
                        {match.homeTeam} vs {match.awayTeam}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(match.matchDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent mb-1">
                        {match.actualHomeScore} - {match.actualAwayScore}
                      </p>
                      <p className="text-sm text-green-400">✓ פורסם</p>
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

// ── Overview Panel ──────────────────────────────────────────────────────────

function OverviewPanel() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();
  const { data: status } = trpc.admin.getSystemStatus.useQuery();

  const kpis = [
    {
      label: "משתמשים רשומים",
      value: stats?.totalUsers ?? "—",
      icon: <Users className="w-5 h-5" />,
      color: "#1F6BFF",
      bg: "#EEF3FF",
    },
    {
      label: "מנויים משלמים",
      value: stats?.payingUsers ?? "—",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "#13CE66",
      bg: "#EAFBF1",
    },
    {
      label: "ניחושים סה״כ",
      value: stats?.totalPredictions ?? "—",
      icon: <Activity className="w-5 h-5" />,
      color: "#8B4DFF",
      bg: "#F3EDFF",
    },
    {
      label: "משחקים שהסתיימו",
      value: stats?.finishedMatches ?? "—",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "#FFC91F",
      bg: "#FFF8E6",
    },
    {
      label: "דיוק ממוצע",
      value: stats?.avgAccuracy != null ? `${stats.avgAccuracy}%` : "—",
      icon: <Flame className="w-5 h-5" />,
      color: "#FF3B5C",
      bg: "#FFEEF1",
    },
    {
      label: "המרה (Free→Pro)",
      value:
        stats?.totalUsers
          ? `${Math.round(((stats.payingUsers ?? 0) / stats.totalUsers) * 100)}%`
          : "—",
      icon: <TrendingDown className="w-5 h-5" />,
      color: "#3A4A66",
      bg: "#EEF1F6",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="p-4 flex items-center gap-4"
            style={{ border: `1px solid ${kpi.color}22` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: kpi.bg, color: kpi.color }}
            >
              {kpi.icon}
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-6 w-12 rounded bg-muted animate-pulse mb-1" />
              ) : (
                <p className="text-xl font-black" style={{ color: kpi.color }}>
                  {String(kpi.value)}
                </p>
              )}
              <p className="text-xs text-muted-foreground leading-tight">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Plan distribution */}
      {stats?.planCounts && (
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            חלוקת מנויים
          </h3>
          <div className="space-y-3">
            {(["free", "pro", "champion"] as const).map((plan) => {
              const entry = stats.planCounts.find((p: any) => p.plan === plan);
              const cnt = entry?.count ?? 0;
              const pct = stats.totalUsers ? Math.round((Number(cnt) / stats.totalUsers) * 100) : 0;
              const colors: Record<string, string> = {
                free: "#3A4A66",
                pro: "#1F6BFF",
                champion: "#FFC91F",
              };
              const labels: Record<string, string> = {
                free: "חינמי",
                pro: "Pro",
                champion: "Champion",
              };
              return (
                <div key={plan} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{labels[plan]}</span>
                    <span className="text-muted-foreground">
                      {String(cnt)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: colors[plan] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* System status */}
      <Card className="p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          סטטוס מערכת
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "מסד נתונים", ok: status?.db, icon: <Database className="w-4 h-4" /> },
            { label: "Gemini AI", ok: status?.gemini, icon: <Activity className="w-4 h-4" /> },
            { label: "API-Football", ok: status?.apifootball, icon: <Wifi className="w-4 h-4" /> },
          ].map(({ label, ok, icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{
                borderColor: ok ? "#13CE6644" : "#FF3B5C44",
                background: ok ? "#EAFBF1" : "#FFEEF1",
              }}
            >
              <span style={{ color: ok ? "#13CE66" : "#FF3B5C" }}>{icon}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: ok ? "#13CE66" : "#FF3B5C" }}>
                  {ok ? "פעיל" : "לא מחובר"}
                </p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Users Panel ──────────────────────────────────────────────────────────────

function UsersPanel() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: userList = [], isLoading, refetch } = trpc.admin.getAllUsers.useQuery({
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const setRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => {
      toast.success("הרשאה עודכנה");
      refetch();
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDebouncedSearch(search);
  }

  const planLabel: Record<string, string> = {
    free: "חינמי",
    pro: "Pro",
    champion: "Champion",
  };
  const planColor: Record<string, string> = {
    free: "#3A4A66",
    pro: "#1F6BFF",
    champion: "#FFC91F",
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="חיפוש לפי שם או אימייל..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pr-9 pl-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" size="sm">חיפוש</Button>
      </form>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-right">
                <th className="px-4 py-3 font-semibold text-muted-foreground">שם</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">אימייל</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">מנוי</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">נקודות</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">דיוק</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">תפקיד</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">פעולה</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    לא נמצאו משתמשים
                  </td>
                </tr>
              ) : (
                userList.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${planColor[u.plan ?? "free"]}22`,
                          color: planColor[u.plan ?? "free"],
                        }}
                      >
                        {planLabel[u.plan ?? "free"]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: "#1F6BFF" }}>
                      {u.totalPoints ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.accuracyRate != null
                        ? `${Math.round(Number(u.accuracyRate) * 100)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"
                        style={{
                          background: u.role === "admin" ? "#FF3B5C22" : "#EEF3FF",
                          color: u.role === "admin" ? "#FF3B5C" : "#3A4A66",
                        }}
                      >
                        {u.role === "admin" ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <ShieldOff className="w-3 h-3" />
                        )}
                        {u.role === "admin" ? "מנהל" : "משתמש"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2"
                        disabled={setRole.isPending}
                        onClick={() =>
                          setRole.mutate({
                            userId: u.id,
                            role: u.role === "admin" ? "user" : "admin",
                          })
                        }
                      >
                        {u.role === "admin" ? "הסר הרשאה" : "הפוך למנהל"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/**
 * Import Panel - Admin UI for importing matches from API-Football
 */
function ImportPanel() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [league, setLeague] = useState<"ligat_hael" | "ligah_leumit" | "both">("both");

  const { data: status, isLoading: statusLoading } = trpc.import.getStatus.useQuery();

  const importUpcoming = trpc.import.importUpcoming.useMutation({
    onSuccess: (data) => {
      toast.success(`יובאו ${data.created} משחקים חדשים (דולגו: ${data.skipped})`);
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  const importResults = trpc.import.importResults.useMutation({
    onSuccess: (data) => {
      toast.success(`עודכנו ${data.updated} תוצאות`);
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  const importAllStats = trpc.import.importAllStats.useMutation({
    onSuccess: (data: any) => {
      toast.success(`יובאו סטטיסטיקות ל-${data.imported} משחקים`);
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  const importByDate = trpc.import.importByDateRange.useMutation({
    onSuccess: (data) => {
      toast.success(`יובאו ${data.created} משחקים, עודכנו ${data.updatedResults} תוצאות`);
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  const importFullSeason = trpc.import.importFullSeason.useMutation({
    onSuccess: (data) => {
      toast.success(`יובאו ${data.created} משחקים חדשים, עודכנו ${data.updatedResults} תוצאות (דולגו: ${data.skipped})`);
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      {/* API Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">סטטוס חיבור</h3>
        </div>
        {statusLoading ? (
          <Spinner />
        ) : status?.configured ? (
          <div className="flex items-center gap-2">
            {status.connected ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={status.connected ? "text-green-400" : "text-red-400"}>
              {status.message}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400">{status?.message}</span>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">פעולות מהירות</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => importUpcoming.mutate({ league: "both" })}
            disabled={importUpcoming.isPending}
            className="flex items-center gap-2"
          >
            {importUpcoming.isPending ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            ייבא משחקים קרובים
          </Button>
          <Button
            onClick={() => importResults.mutate()}
            disabled={importResults.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            {importResults.isPending ? <Spinner className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            עדכן תוצאות אחרונות
          </Button>
          <Button
            onClick={() => importAllStats.mutate()}
            disabled={importAllStats.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            {importAllStats.isPending ? <Spinner className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            ייבא סטטיסטיקות
          </Button>
        </div>
      </Card>

      {/* Custom Date Range Import */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">ייבוא לפי תאריכים</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">מתאריך</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">עד תאריך</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">ליגה</label>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value as any)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="both">שתי הליגות</option>
              <option value="ligat_hael">ליגת העל</option>
              <option value="ligah_leumit">ליגה לאומית</option>
            </select>
          </div>
          <Button
            onClick={() => {
              if (!dateFrom || !dateTo) {
                toast.error("יש לבחור תאריכים");
                return;
              }
              importByDate.mutate({ from: dateFrom, to: dateTo, league });
            }}
            disabled={importByDate.isPending}
            className="flex items-center gap-2"
          >
            {importByDate.isPending ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            ייבא
          </Button>
        </div>
      </Card>

      {/* Full Season Import */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">ייבוא עונה מלאה</h3>
        <p className="text-sm text-muted-foreground mb-4">
          ייבוא כל המשחקים מהעונה הנוכחית (כולל תוצאות שכבר נגמרו).
          משחקים קיימים לא ייובאו שוב.
        </p>
        <Button
          onClick={() => importFullSeason.mutate({ league })}
          disabled={importFullSeason.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          {importFullSeason.isPending ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          ייבא עונה מלאה
        </Button>
      </Card>

      {/* Scheduled Auto-Import */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">ייבוא אוטומטי מתוזמן</h3>
        <p className="text-sm text-muted-foreground mb-4">
          הפעלת ייבוא אוטומטי כל 6 שעות — משחקים חדשים ועדכון תוצאות אוטומטית.
        </p>
        <ScheduleManager />
      </Card>

      {/* Info */}
      <Card className="p-6 border-accent/30 bg-accent/5">
        <h4 className="font-semibold mb-2">ℹ️ מידע</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>הנתונים נמשכים ישירות מ-football.co.il — ללא צורך ב-API key</li>
          <li>"ייבא משחקים קרובים" — מביא משחקים ל-14 יום קדימה</li>
          <li>"עדכן תוצאות" — מעדכן תוצאות משחקים שהסתיימו ב-3 ימים האחרונים</li>
          <li>"ייבא סטטיסטיקות" — מנסה למשוך קרנות/כרטיסים (לא תמיד זמין)</li>
          <li>משחקים שכבר קיימים במערכת לא ייובאו שוב (לפי externalId)</li>
          <li>"ייבא עונה מלאה" — מביא את כל ~536 המשחקים מהעונה</li>
          <li>"ייבוא אוטומטי" — מריץ כל 6 שעות ומעדכן משחקים/תוצאות</li>
        </ul>
      </Card>
    </div>
  );
}

/**
 * League Data Panel — one-time scrape of teams, standings, players from football.co.il
 */
function LeagueDataPanel() {
  const { data: status, refetch: refetchStatus } = trpc.leagueData.getDataStatus.useQuery();

  const scrapeAll = trpc.leagueData.scrapeAll.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message);
      refetchStatus();
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  }) as any;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">סטטוס נתוני ליגה</h3>
        </div>
        {status ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg" style={{ background: "rgba(31,107,255,0.08)" }}>
              <p className="text-2xl font-bold" style={{ color: "#1F6BFF" }}>{status.teams}</p>
              <p className="text-xs text-muted-foreground mt-1">קבוצות</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "rgba(255,201,31,0.10)" }}>
              <p className="text-2xl font-bold" style={{ color: "#B38900" }}>{status.standings}</p>
              <p className="text-xs text-muted-foreground mt-1">שורות טבלה</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "rgba(19,206,102,0.08)" }}>
              <p className="text-2xl font-bold" style={{ color: "#0DA855" }}>{status.players}</p>
              <p className="text-xs text-muted-foreground mt-1">שחקנים</p>
            </div>
          </div>
        ) : (
          <Spinner />
        )}
      </Card>

      {/* Scrape Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Database className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">סריקה חד-פעמית</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          מריץ את כל 4 הסקילים: חילוץ קבוצות, חישוב טבלאות, גריפת שחקנים ופרטי קבוצה.
          הנתונים נמחקים ונכתבים מחדש בכל הפעלה.
        </p>

        <div className="space-y-3 mb-5 text-sm">
          {[
            { icon: "①", label: "Skill 1 — חילוץ קבוצות מנתוני gamesByDate (ללא בקשות נוספות)" },
            { icon: "②", label: "Skill 2 — חישוב טבלת ליגה מתוצאות משחקים גמורים" },
            { icon: "③", label: "Skill 3 — גריפת רשימת שחקנים מדפי הקבוצות" },
            { icon: "④", label: "Skill 4 — גריפת עיר/מיקום קבוצה מדפי הקבוצות" },
          ].map((s) => (
            <div key={s.icon} className="flex items-start gap-2 text-muted-foreground">
              <span style={{ color: "#B38900" }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={() => scrapeAll.mutate({ season: "25/26" })}
          disabled={scrapeAll.isPending}
          className="flex items-center gap-2"
          style={scrapeAll.isPending ? {} : { background: "#1F6BFF" }}
        >
          {scrapeAll.isPending ? (
            <>
              <Spinner className="w-4 h-4" />
              סורק... (עלול לקחת 1-3 דקות)
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              הפעל סריקה מלאה
            </>
          )}
        </Button>

        {scrapeAll.data && (
          <div className="mt-4 p-3 rounded-lg border border-border/40 text-sm space-y-1" style={{ background: "rgba(238,243,255,0.8)" }}>
            <p className="font-semibold text-green-400">✓ סריקה הושלמה</p>
            <p className="text-muted-foreground">קבוצות: {scrapeAll.data.teams}</p>
            <p className="text-muted-foreground">ליגת העל: {scrapeAll.data.standings?.ligat_hael} שורות</p>
            <p className="text-muted-foreground">ליגה לאומית: {scrapeAll.data.standings?.ligah_leumit} שורות</p>
            <p className="text-muted-foreground">שחקנים: {scrapeAll.data.players}</p>
            {scrapeAll.data.errors && scrapeAll.data.errors.length > 0 && (
              <p className="text-yellow-400 text-xs mt-2">{scrapeAll.data.errors.length} שגיאות קטנות (לא קריטי)</p>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4 border-primary/20 bg-primary/5">
        <p className="text-xs text-muted-foreground">
          ℹ️ הנתונים נמשכים מ-football.co.il ללא API key. טבלאות הליגה מחושבות מנתוני
          המשחקים עצמם (מדויק ב-100%). רשימות שחקנים תלויות במבנה דפי הקבוצות.
        </p>
      </Card>
    </div>
  );
}

// ── Segment visual config (colours / icons) — client-only, never sent to users
const SEGMENT_UI = {
  engaged:  { icon: Flame,         color: "#1F6BFF", bg: "rgba(31,107,255,0.10)",  border: "rgba(31,107,255,0.25)"  },
  active:   { icon: Activity,      color: "#13CE66", bg: "rgba(19,206,102,0.10)",  border: "rgba(19,206,102,0.25)"  },
  fading:   { icon: TrendingDown,  color: "#FFC91F", bg: "rgba(255,201,31,0.10)",  border: "rgba(255,201,31,0.25)"  },
  dormant:  { icon: Moon,          color: "#6B7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.25)" },
} as const;

type SegmentKey = "engaged" | "active" | "fading" | "dormant";

/**
 * Player Engagement Segmentation panel — in-app notifications only, no CRM/email.
 */
function EngagementPanel() {
  const { data: segments = [], isLoading, refetch } = trpc.engagement.getSegments.useQuery();
  const [selected, setSelected] = useState<SegmentKey | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const sendMutation = trpc.engagement.sendSegmentNotification.useMutation({
    onSuccess: (data: any) => {
      toast.success(`נשלחו ${data.sent} התראות בהצלחה`);
      setSelected(null);
      setTitle("");
      setContent("");
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const selectedSegment = segments.find((s) => s.key === selected);
  const totalUsers = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Summary bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">סגמנטציית שחקנים</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalUsers} משתמשים רשומים סה"כ
          </div>
        </div>

        {/* Progress bar showing distribution */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {(["engaged", "active", "fading", "dormant"] as SegmentKey[]).map((key) => {
            const seg = segments.find((s) => s.key === key);
            const pct = totalUsers > 0 && seg ? (seg.count / totalUsers) * 100 : 0;
            return (
              <div
                key={key}
                title={`${seg?.label}: ${seg?.count}`}
                style={{ width: `${pct}%`, background: SEGMENT_UI[key].color, minWidth: pct > 0 ? "4px" : "0" }}
              />
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 flex-wrap">
          {(["engaged", "active", "fading", "dormant"] as SegmentKey[]).map((key) => {
            const seg = segments.find((s) => s.key === key);
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEGMENT_UI[key].color }} />
                <span className="text-muted-foreground">{seg?.label} ({seg?.count})</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Segment cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {segments.map((seg) => {
          const key = seg.key as SegmentKey;
          const ui = SEGMENT_UI[key];
          const Icon = ui.icon;
          const isActive = selected === key;

          return (
            <Card
              key={key}
              className={`p-5 cursor-pointer transition-all duration-200 ${isActive ? "ring-2 ring-offset-1 ring-offset-background" : "hover:border-border/60"}`}
              style={{
                background: ui.bg,
                borderColor: isActive ? ui.color : ui.border,
                ...(isActive ? { "--tw-ring-color": ui.color } as React.CSSProperties : {}),
              }}
              onClick={() => setSelected(isActive ? null : key)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${ui.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: ui.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{seg.label}</p>
                    <p className="text-xs text-muted-foreground">{seg.description}</p>
                  </div>
                </div>
                <span className="text-2xl font-black" style={{ color: ui.color }}>{seg.count}</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center px-2 py-1.5 rounded-lg bg-background/30">
                  <p className="text-lg font-bold">{seg.avgStreak}</p>
                  <p className="text-[10px] text-muted-foreground">סטריק ממוצע</p>
                </div>
                <div className="text-center px-2 py-1.5 rounded-lg bg-background/30">
                  <p className="text-lg font-bold">{seg.avgPoints}</p>
                  <p className="text-[10px] text-muted-foreground">נקודות ממוצע</p>
                </div>
              </div>

              {/* Sample names */}
              {seg.samples.length > 0 && (
                <p className="text-[11px] text-muted-foreground truncate">
                  לדוגמה: {seg.samples.join("، ")}
                </p>
              )}

              {/* Expand indicator */}
              <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: ui.color }}>
                <Send className="w-3 h-3" />
                {isActive ? "בטל בחירה" : "שלח התראה לסגמנט זה"}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Notification composer — slides in when a segment is selected */}
      {selected && selectedSegment && (
        <Card className="p-6 border-primary/20" style={{ background: "#F8FAFF" }}>
          <h3 className="font-bold mb-1">
            שלח התראה אל: <span style={{ color: SEGMENT_UI[selected].color }}>{selectedSegment.label}</span>
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            ההתראה תופיע בפעמון של {selectedSegment.count} משתמשים.
            ⚠️ שליחה מחדש תוסיף התראה נוספת — ודא שהתוכן נכון.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">כותרת *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="לדוגמה: משחק חשוב הלילה! 🔥"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-left">{title.length}/80</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">תוכן (אופציונלי)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="פרטים נוספים, קישור, או הודעת עידוד..."
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-left">{content.length}/300</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  sendMutation.mutate({
                    segment: selected,
                    title: title.trim(),
                    content: content.trim() || undefined,
                  })
                }
                disabled={!title.trim() || sendMutation.isPending}
                className="flex items-center gap-2 font-bold"
                style={{ background: SEGMENT_UI[selected].color }}
              >
                {sendMutation.isPending ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                שלח ל-{selectedSegment.count} משתמשים
              </Button>
              <Button variant="outline" onClick={() => { setSelected(null); setTitle(""); setContent(""); }}>
                ביטול
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Constraint reminder */}
      <Card className="p-4 border-amber-500/20 bg-amber-500/5">
        <p className="text-xs text-muted-foreground">
          ℹ️ התראות הן <strong>בתוך האפליקציה בלבד</strong> — ללא מייל, SMS, או CRM חיצוני.
          כל התראה מופיעה בפעמון של המשתמש בסגמנט. הנתונים מחושבים בזמן אמת מה-DB.
        </p>
      </Card>
    </div>
  );
}

/** Schedule management sub-component */
function ScheduleManager() {
  const { data: schedules, isLoading, refetch } = trpc.import.listSchedules.useQuery();

  const createSchedule = trpc.import.createSchedule.useMutation({
    onSuccess: () => {
      toast.success("ייבוא אוטומטי הופעל בהצלחה!");
      refetch();
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  const deleteSchedule = trpc.import.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success("התזמון נמחק");
      refetch();
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  const toggleSchedule = trpc.import.toggleSchedule.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (e) => toast.error(`שגיאה: ${e.message}`),
  });

  if (isLoading) return <Spinner />;

  const hasSchedule = schedules && schedules.length > 0;

  return (
    <div className="space-y-3">
      {!hasSchedule ? (
        <Button
          onClick={() => createSchedule.mutate({})}
          disabled={createSchedule.isPending}
          className="flex items-center gap-2"
        >
          {createSchedule.isPending ? <Spinner className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          הפעל ייבוא אוטומטי (כל 6 שעות)
        </Button>
      ) : (
        <div className="space-y-2">
          {schedules.map((job) => (
            <div key={job.taskUid} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${job.isEnable ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="font-medium text-sm">{job.description || job.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {job.isEnable ? 'פעיל' : 'מושהה'}
                  {job.nextExecutionAt && ` • הרצה הבאה: ${new Date(job.nextExecutionAt).toLocaleString('he-IL')}`}
                  {job.lastExecutedAt && ` • הרצה אחרונה: ${new Date(job.lastExecutedAt).toLocaleString('he-IL')}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSchedule.mutate({ taskUid: job.taskUid, enable: !job.isEnable })}
                  disabled={toggleSchedule.isPending}
                >
                  {job.isEnable ? 'השהה' : 'הפעל'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSchedule.mutate({ taskUid: job.taskUid })}
                  disabled={deleteSchedule.isPending}
                  className="text-red-400 hover:text-red-300"
                >
                  מחק
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
