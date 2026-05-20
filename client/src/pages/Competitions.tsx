import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "@/components/Navigation";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Trophy,
  Users,
  Swords,
  Plus,
  Crown,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Competitions() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedCompId, setExpandedCompId] = useState<number | null>(null);
  const [newCompName, setNewCompName] = useState("");
  const [newCompType, setNewCompType] = useState<"tournament" | "head_to_head">("tournament");

  const utils = trpc.useUtils();

  // Queries
  const { data: activeComps = [], isLoading: activeLoading } = trpc.competitions.getActive.useQuery();

  const { data: myComps = [], isLoading: myLoading } = trpc.competitions.getMine.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createMutation = trpc.competitions.create.useMutation({
    onSuccess: () => {
      toast.success("התחרות נוצרה בהצלחה!");
      setShowCreate(false);
      setNewCompName("");
      utils.competitions.getActive.invalidate();
      utils.competitions.getMine.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה ביצירת התחרות");
    },
  });

  const joinMutation = trpc.competitions.join.useMutation({
    onSuccess: () => {
      toast.success("הצטרפת לתחרות בהצלחה!");
      utils.competitions.getActive.invalidate();
      utils.competitions.getMine.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בהצטרפות");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Swords className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h1 className="text-3xl font-black mb-2">תחרויות</h1>
            <p className="text-muted-foreground">התחבר כדי ליצור ולהצטרף לתחרויות</p>
          </div>

          {/* Show active competitions even for guests */}
          {activeLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-6 h-6 text-emerald-400" />
            </div>
          ) : activeComps.length > 0 ? (
            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-foreground">תחרויות פעילות</h2>
              {activeComps.map((comp: any) => (
                <Card key={comp.id} className="p-4 border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {comp.type === "tournament" ? (
                        <Trophy className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Swords className="w-5 h-5 text-purple-400" />
                      )}
                      <div>
                        <p className="font-bold text-foreground">{comp.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {comp.participantCount || 0} משתתפים
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                      {comp.type === "tournament" ? "טורניר" : "דו-קרב"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">אין תחרויות פעילות כרגע</p>
            </div>
          )}

          {/* Login CTA */}
          <div className="text-center">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              התחבר כדי להצטרף
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreate = () => {
    if (!newCompName.trim()) {
      toast.error("נא להזין שם לתחרות");
      return;
    }
    createMutation.mutate({
      name: newCompName.trim(),
      type: newCompType,
      maxParticipants: newCompType === "head_to_head" ? 2 : 20,
    });
  };

  const handleJoin = (competitionId: number) => {
    joinMutation.mutate({ competitionId });
  };

  const completedComps = myComps.filter((c: any) => c.status === "completed");
  const activeMyComps = myComps.filter((c: any) => c.status === "active");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground">תחרויות</h1>
            <p className="text-muted-foreground mt-1">אתגר חברים ותוכיח מי הכי טוב</p>
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
          >
            <Plus className="w-4 h-4" />
            צור תחרות
          </Button>
        </div>

        {/* Create Competition Form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 mb-6 border-emerald-500/20 bg-emerald-500/5">
              <h3 className="text-lg font-bold mb-4">צור תחרות חדשה</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">שם התחרות</label>
                  <Input
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    placeholder="למשל: אליפות החברים — סיבוב 3"
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">סוג תחרות</label>
                  <div className="flex gap-3">
                    <Button
                      variant={newCompType === "tournament" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewCompType("tournament")}
                      className={newCompType === "tournament" ? "bg-emerald-600" : ""}
                    >
                      <Trophy className="w-4 h-4 ml-1" />
                      טורניר
                    </Button>
                    <Button
                      variant={newCompType === "head_to_head" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewCompType("head_to_head")}
                      className={newCompType === "head_to_head" ? "bg-emerald-600" : ""}
                    >
                      <Swords className="w-4 h-4 ml-1" />
                      דו-קרב
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? <Spinner className="w-4 h-4" /> : "צור תחרות"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>
                    ביטול
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/20 border border-border/30 mb-6">
            <TabsTrigger value="active" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              פעילות
            </TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              התחרויות שלי
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              הסתיימו
            </TabsTrigger>
          </TabsList>

          {/* Active Competitions */}
          <TabsContent value="active">
            {activeLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : activeComps.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">אין תחרויות פעילות כרגע</p>
                <p className="text-sm text-muted-foreground/70 mt-1">צור תחרות חדשה כדי להתחיל!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeComps.map((comp: any, i: number) => {
                  const isMyComp = comp.creatorId === user?.id;
                  const alreadyJoined = activeMyComps.some((mc: any) => mc.id === comp.id);
                  return (
                    <motion.div
                      key={comp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Card className="p-5 border-border/30 hover:border-emerald-500/30 transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              comp.type === "tournament"
                                ? "bg-amber-500/10 border border-amber-500/30"
                                : "bg-blue-500/10 border border-blue-500/30"
                            }`}>
                              {comp.type === "tournament" ? (
                                <Trophy className="w-5 h-5 text-amber-400" />
                              ) : (
                                <Swords className="w-5 h-5 text-blue-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground">{comp.name}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {comp.participantCount || 0} / {comp.maxParticipants || 20} משתתפים
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {comp.type === "tournament" ? "טורניר" : "דו-קרב"}
                                </span>
                              </div>
                              {isMyComp && (
                                <Badge variant="outline" className="mt-2 text-xs border-emerald-500/30 text-emerald-400">
                                  <Crown className="w-3 h-3 ml-1" />
                                  יוצר התחרות
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!alreadyJoined && !isMyComp ? (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              onClick={() => handleJoin(comp.id)}
                              disabled={joinMutation.isPending}
                            >
                              הצטרף
                            </Button>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              משתתף
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Competitions */}
          <TabsContent value="my">
            {myLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : activeMyComps.length === 0 ? (
              <div className="text-center py-12">
                <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">עדיין לא הצטרפת לתחרויות</p>
                <p className="text-sm text-muted-foreground/70 mt-1">צור תחרות חדשה או הצטרף לתחרות קיימת</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMyComps.map((comp: any, i: number) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className="p-5 border-border/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            comp.type === "tournament"
                              ? "bg-amber-500/10 border border-amber-500/30"
                              : "bg-blue-500/10 border border-blue-500/30"
                          }`}>
                            {comp.type === "tournament" ? (
                              <Trophy className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Swords className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{comp.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              הנקודות שלך: <span className="text-emerald-400 font-bold">{comp.myPoints || 0}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            פעיל
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedCompId(expandedCompId === comp.id ? null : comp.id)}
                            className="text-muted-foreground"
                          >
                            {expandedCompId === comp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      {expandedCompId === comp.id && (
                        <CompetitionLeaderboard competitionId={comp.id} currentUserId={user?.id} />
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Competitions */}
          <TabsContent value="completed">
            {completedComps.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">אין תחרויות שהסתיימו</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedComps.map((comp: any, i: number) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className="p-5 border-border/30 opacity-80">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">{comp.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            הנקודות שלך: {comp.myPoints || 0}
                          </p>
                        </div>
                        <Badge className="bg-muted/20 text-muted-foreground border-border/30">
                          הסתיים
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ===== Competition Leaderboard Component ===== */
function CompetitionLeaderboard({ competitionId, currentUserId }: { competitionId: number; currentUserId?: number }) {
  const { data: leaderboard = [], isLoading } = trpc.competitions.getLeaderboard.useQuery(
    { competitionId },
    { enabled: !!competitionId }
  );

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-border/20 flex justify-center py-4">
        <Spinner className="w-4 h-4" />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-border/20 text-center py-4">
        <p className="text-xs text-muted-foreground">אין משתתפים עדיין</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/20">
      <h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        טבלת דירוג
      </h4>
      <div className="space-y-2">
        {leaderboard.map((entry: any) => {
          const isMe = entry.userId === currentUserId;
          return (
            <div
              key={entry.userId}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                isMe ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center font-bold ${
                  entry.rank === 1 ? "text-amber-400" :
                  entry.rank === 2 ? "text-gray-300" :
                  entry.rank === 3 ? "text-orange-400" : "text-muted-foreground"
                }`}>
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                </span>
                <span className={`font-medium ${isMe ? "text-emerald-400" : "text-foreground"}`}>
                  {entry.userName || "משתמש"} {isMe && "(אתה)"}
                </span>
              </div>
              <span className="font-bold text-emerald-400">{entry.points || 0} נק'</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
