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
import { Download, RefreshCw, Calendar, CheckCircle, AlertCircle, Database } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState<{
    homeScore: number;
    awayScore: number;
    result: "home_win" | "draw" | "away_win" | null;
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

  // Check if user is admin
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
      newScore.result = "home_win";
    } else if (newScore.homeScore < newScore.awayScore) {
      newScore.result = "away_win";
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

        <Tabs defaultValue="publish" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="publish">פרסום תוצאות</TabsTrigger>
            <TabsTrigger value="import">ייבוא אוטומטי</TabsTrigger>
            <TabsTrigger value="history">היסטוריה</TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <ImportPanel />
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
                            {matchResult.result === "home_win"
                              ? `ניצחון ${selectedMatchData.homeTeam}`
                              : matchResult.result === "away_win"
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
                        {match.homeScore} - {match.awayScore}
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
    onSuccess: (data) => {
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
