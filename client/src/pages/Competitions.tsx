import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "@/components/Navigation";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Trophy, Users, Swords, Plus, Crown, Target, Clock,
  ChevronDown, ChevronUp, Zap, Flame, TrendingUp, Activity,
} from "lucide-react";

// ── Mock online users ────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1,  name: "דוד כ.",   avatar: "ד",  points: 342, rank: 1,  streak: 7,  online: true  },
  { id: 2,  name: "יוסי מ.",   avatar: "י",  points: 318, rank: 2,  streak: 4,  online: true  },
  { id: 3,  name: "מיכל ל.",  avatar: "מ",  points: 297, rank: 3,  streak: 9,  online: true  },
  { id: 4,  name: "נועם ב.",   avatar: "נ",  points: 281, rank: 4,  streak: 2,  online: false },
  { id: 5,  name: "שירה ג.",   avatar: "ש",  points: 265, rank: 5,  streak: 5,  online: true  },
  { id: 6,  name: "אורי ה.",   avatar: "א",  points: 244, rank: 6,  streak: 1,  online: true  },
  { id: 7,  name: "רחל ע.",    avatar: "ר",  points: 228, rank: 7,  streak: 3,  online: false },
  { id: 8,  name: "עמית פ.",   avatar: "ע",  points: 211, rank: 8,  streak: 0,  online: true  },
];

const ACTIVITY_TEMPLATES = [
  (u: string) => `${u} ניחש נכון: מכבי ת"א 2-1 הפועל ב"ש`,
  (u: string) => `${u} ניחש נכון: הפועל ח' 0-0 מכבי נתניה`,
  (u: string) => `${u} עלה מקום בטבלה!`,
  (u: string) => `${u} ניחש: מכבי חיפה 3-0`,
  (u: string) => `${u} הרוויח 10 נקודות!`,
  (u: string) => `${u} ניחש נכון תוצאה מדויקת!`,
  (u: string) => `${u} הוסיף ניחוש למשחק הערב`,
  (u: string) => `${u} סיים שבוע עם 8/10 ניחושים!`,
];

interface ActivityEntry {
  id: number;
  text: string;
  time: string;
  type: "correct" | "wrong" | "rank" | "predict";
}

function useActivityFeed() {
  const [feed, setFeed] = useState<ActivityEntry[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      text: ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length](MOCK_USERS[i % MOCK_USERS.length].name),
      time: `${2 + i * 3} דק'`,
      type: (["correct","predict","rank","correct","wrong","predict"] as const)[i],
    }))
  );
  const counter = useRef(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
      const types = ["correct", "predict", "rank"] as const;
      setFeed(prev => [
        {
          id: counter.current++,
          text: template(user.name),
          time: "עכשיו",
          type: types[Math.floor(Math.random() * types.length)],
        },
        ...prev.slice(0, 7),
      ]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return feed;
}

// ── Online pulse dot ─────────────────────────────────────────────────────────
function PulseDot({ online }: { online: boolean }) {
  return (
    <span className="relative inline-flex w-2.5 h-2.5 shrink-0">
      {online && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ background: "oklch(0.65 0.165 145)" }} />
      )}
      <span className="relative inline-flex rounded-full w-2.5 h-2.5"
        style={{ background: online ? "oklch(0.65 0.165 145)" : "oklch(0.45 0.025 240)" }} />
    </span>
  );
}

// ── Live Arena hero ──────────────────────────────────────────────────────────
function LiveArena() {
  const feed = useActivityFeed();
  const online = MOCK_USERS.filter(u => u.online).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Online users panel */}
      <Card className="lg:col-span-1 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between"
          style={{ background: "oklch(0.22 0.060 258 / 0.6)" }}>
          <div className="flex items-center gap-2">
            <span className="relative flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "oklch(0.65 0.165 145)" }} />
              <span className="relative rounded-full w-2.5 h-2.5" style={{ background: "oklch(0.65 0.165 145)" }} />
            </span>
            <span className="text-sm font-bold">מחוברים עכשיו</span>
          </div>
          <Badge className="text-xs" style={{ background: "oklch(0.65 0.165 145 / 0.15)", color: "oklch(0.65 0.165 145)", border: "1px solid oklch(0.65 0.165 145 / 0.3)" }}>
            {online} אונליין
          </Badge>
        </div>
        <div className="divide-y divide-border/15 max-h-72 overflow-y-auto">
          {MOCK_USERS.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                style={{
                  background: user.online
                    ? "linear-gradient(135deg, oklch(0.45 0.130 232), oklch(0.30 0.090 215))"
                    : "oklch(0.25 0.030 240)",
                  color: "white",
                }}>
                {user.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate">{user.name}</span>
                  {user.streak >= 3 && (
                    <span title={`רצף ${user.streak} ניחושים`}>
                      <Flame className="w-3 h-3" style={{ color: "oklch(0.75 0.165 48)" }} />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold" style={{ color: "oklch(0.72 0.190 230)" }}>
                    #{user.rank}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{user.points} נק'</span>
                </div>
              </div>

              <PulseDot online={user.online} />
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Activity feed */}
      <Card className="lg:col-span-2 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2"
          style={{ background: "oklch(0.22 0.060 258 / 0.6)" }}>
          <Activity className="w-4 h-4" style={{ color: "oklch(0.72 0.190 230)" }} />
          <span className="text-sm font-bold">פעילות חיה</span>
          <span className="mr-auto text-[10px] text-muted-foreground animate-pulse">● LIVE</span>
        </div>
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
          <AnimatePresence initial={false}>
            {feed.map(entry => {
              const iconMap = {
                correct: <span className="text-xs">✅</span>,
                wrong:   <span className="text-xs">❌</span>,
                rank:    <TrendingUp className="w-3.5 h-3.5" style={{ color: "oklch(0.84 0.190 76)" }} />,
                predict: <Target className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.190 230)" }} />,
              };
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/20"
                  style={{ background: "oklch(0.20 0.040 258 / 0.5)" }}
                >
                  <span className="shrink-0">{iconMap[entry.type]}</span>
                  <span className="text-sm flex-1">{entry.text}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{entry.time}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}

// ── Competition card ─────────────────────────────────────────────────────────
function CompCard({
  comp, i, isMyComp, alreadyJoined, onJoin, joining, currentUserId,
}: {
  comp: any; i: number; isMyComp: boolean; alreadyJoined: boolean;
  onJoin: () => void; joining: boolean; currentUserId?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.min(100, ((comp.participantCount || 0) / (comp.maxParticipants || 20)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
    >
      <Card className="overflow-hidden border-border/30 hover:border-primary/25 transition-all duration-200">
        {/* Top bar */}
        <div className="h-1 w-full" style={{
          background: `linear-gradient(to left, ${pct < 30 ? "oklch(0.45 0.110 232)" : pct < 70 ? "oklch(0.75 0.140 75)" : "oklch(0.65 0.165 145)"} ${pct}%, oklch(0.28 0.040 258) ${pct}%)`,
        }} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                comp.type === "tournament"
                  ? "border border-amber-500/30" : "border border-blue-500/30"
              }`} style={{
                background: comp.type === "tournament"
                  ? "oklch(0.75 0.155 76 / 0.12)" : "oklch(0.55 0.130 230 / 0.12)",
              }}>
                {comp.type === "tournament"
                  ? <Trophy className="w-5 h-5 text-amber-400" />
                  : <Swords className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{comp.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {comp.participantCount || 0}/{comp.maxParticipants || 20}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {comp.type === "tournament" ? "טורניר" : "דו-קרב"}
                  </span>
                  {isMyComp && (
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      <Crown className="w-2.5 h-2.5 ml-1" />יצרת
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!alreadyJoined && !isMyComp ? (
                <Button size="sm" className="btn-3d btn-accent-3d font-bold text-xs"
                  onClick={onJoin} disabled={joining}>
                  {joining ? <Spinner className="w-3 h-3" /> : "הצטרף"}
                </Button>
              ) : (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  {isMyComp ? "יוצר" : "משתתף"}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => setExpanded(e => !e)}
                className="text-muted-foreground p-1">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Mini leaderboard (expanded) */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <CompLeaderboard competitionId={comp.id} currentUserId={currentUserId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Demo arena (shown when no real competitions exist) ───────────────────────
const DEMO_COMPS = [
  { id:-1, name:"אליפות הפנסיון 2025 🏆", type:"tournament", participantCount:8,  maxParticipants:10, creatorId:-1, status:"active" },
  { id:-2, name:"דו-קרב השבוע: דוד vs יוסי", type:"head_to_head", participantCount:2, maxParticipants:2, creatorId:-1, status:"active" },
  { id:-3, name:"ליגת ה-VIP",              type:"tournament", participantCount:5,  maxParticipants:20, creatorId:-1, status:"active" },
];

// ── Scoreboard (mock) for demo ───────────────────────────────────────────────
function DemoLeaderboard() {
  const [scores, setScores] = useState(MOCK_USERS.map(u => ({ ...u })));

  useEffect(() => {
    const interval = setInterval(() => {
      setScores(prev => {
        const next = prev.map(u => ({
          ...u,
          points: u.online ? u.points + Math.floor(Math.random() * 3) : u.points,
        }));
        return [...next].sort((a, b) => b.points - a.points).map((u, i) => ({ ...u, rank: i + 1 }));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2"
        style={{ background: "oklch(0.22 0.060 258 / 0.6)" }}>
        <Trophy className="w-4 h-4" style={{ color: "oklch(0.84 0.190 76)" }} />
        <span className="text-sm font-bold">טבלת אליפות הפנסיון — עדכון חי</span>
        <span className="mr-auto text-[10px] text-green-400 animate-pulse">● LIVE</span>
      </div>
      <div className="divide-y divide-border/15">
        <AnimatePresence>
          {scores.map((user, i) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: user.online ? "oklch(0.65 0.165 145 / 0.04)" : undefined }}
            >
              <span className="w-7 text-center font-black text-sm shrink-0"
                style={{ color: i === 0 ? "oklch(0.84 0.190 76)" : i === 1 ? "oklch(0.78 0.025 240)" : i === 2 ? "oklch(0.62 0.110 44)" : "oklch(0.55 0.025 240)" }}>
                {i < 3 ? ["🥇","🥈","🥉"][i] : `#${user.rank}`}
              </span>

              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                style={{
                  background: user.online
                    ? "linear-gradient(135deg, oklch(0.45 0.130 232), oklch(0.30 0.090 215))"
                    : "oklch(0.25 0.030 240)",
                  color: "white",
                }}>
                {user.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">{user.name}</span>
                  {user.streak >= 3 && <Flame className="w-3 h-3" style={{ color: "oklch(0.75 0.165 48)" }} />}
                </div>
              </div>

              <PulseDot online={user.online} />

              <motion.span
                key={`${user.id}-${user.points}`}
                initial={{ scale: 1.3, color: "oklch(0.84 0.190 76)" }}
                animate={{ scale: 1, color: "oklch(0.72 0.190 230)" }}
                transition={{ duration: 0.5 }}
                className="font-black text-base w-14 text-right tabular-nums"
              >
                {user.points}
              </motion.span>
              <span className="text-[10px] text-muted-foreground">נק'</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

// ── Real competition leaderboard ─────────────────────────────────────────────
function CompLeaderboard({ competitionId, currentUserId }: { competitionId: number; currentUserId?: number }) {
  const { data: leaderboard = [], isLoading } = trpc.competitions.getLeaderboard.useQuery(
    { competitionId },
    { enabled: competitionId > 0 }
  );

  if (competitionId < 0) {
    // Demo mode
    const demo = MOCK_USERS.slice(0, 5);
    return (
      <div className="mt-4 pt-4 border-t border-border/20 space-y-2">
        {demo.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "oklch(0.20 0.040 258 / 0.5)" }}>
            <span className="w-5 text-center font-bold text-xs" style={{ color: i === 0 ? "oklch(0.84 0.190 76)" : "oklch(0.55 0.025 240)" }}>
              {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
            </span>
            <span className="flex-1 text-sm font-medium">{u.name}</span>
            <PulseDot online={u.online} />
            <span className="font-bold text-sm" style={{ color: "oklch(0.72 0.190 230)" }}>{u.points} נק'</span>
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) return <div className="mt-4 flex justify-center py-3"><Spinner className="w-4 h-4" /></div>;
  if (!leaderboard.length) return (
    <div className="mt-4 pt-4 border-t border-border/20 text-center py-3">
      <p className="text-xs text-muted-foreground">אין משתתפים עדיין</p>
    </div>
  );

  return (
    <div className="mt-4 pt-4 border-t border-border/20 space-y-2">
      {leaderboard.map((entry: any) => {
        const isMe = entry.userId === currentUserId;
        return (
          <div key={entry.userId}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${isMe ? "bg-primary/10 border border-primary/20" : "bg-muted/5"}`}>
            <div className="flex items-center gap-3">
              <span className={`w-6 text-center font-bold ${
                entry.rank === 1 ? "text-amber-400" : entry.rank === 2 ? "text-gray-300" : entry.rank === 3 ? "text-orange-400" : "text-muted-foreground"
              }`}>
                {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank-1] : `#${entry.rank}`}
              </span>
              <span className={`font-medium ${isMe ? "text-primary" : ""}`}>
                {entry.userName || "משתמש"}{isMe && " (אתה)"}
              </span>
            </div>
            <span className="font-bold" style={{ color: "oklch(0.72 0.190 230)" }}>{entry.points || 0} נק'</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Competitions() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("arena");
  const [showCreate, setShowCreate] = useState(false);
  const [newCompName, setNewCompName] = useState("");
  const [newCompType, setNewCompType] = useState<"tournament" | "head_to_head">("tournament");

  const utils = trpc.useUtils();

  const { data: activeComps = [], isLoading: activeLoading } = trpc.competitions.getActive.useQuery();
  const { data: myComps = [], isLoading: myLoading } = trpc.competitions.getMine.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.competitions.create.useMutation({
    onSuccess: () => {
      toast.success("התחרות נוצרה!");
      setShowCreate(false);
      setNewCompName("");
      utils.competitions.getActive.invalidate();
      utils.competitions.getMine.invalidate();
    },
    onError: (err) => toast.error(err.message || "שגיאה ביצירת התחרות"),
  });

  const joinMutation = trpc.competitions.join.useMutation({
    onSuccess: () => {
      toast.success("הצטרפת לתחרות!");
      utils.competitions.getActive.invalidate();
      utils.competitions.getMine.invalidate();
    },
    onError: (err) => toast.error(err.message || "שגיאה בהצטרפות"),
  });

  const handleCreate = () => {
    if (!newCompName.trim()) return toast.error("נא להזין שם לתחרות");
    createMutation.mutate({ name: newCompName.trim(), type: newCompType, maxParticipants: newCompType === "head_to_head" ? 2 : 20 });
  };

  const completedComps = myComps.filter((c: any) => c.status === "completed");
  const activeMyComps  = myComps.filter((c: any) => c.status === "active");

  // Merge real + demo comps for display
  const displayComps = activeComps.length > 0 ? activeComps : DEMO_COMPS;
  const isDemoMode   = activeComps.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
              <Swords className="w-7 h-7" style={{ color: "oklch(0.72 0.190 230)" }} />
              ארנת התחרויות
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "oklch(0.65 0.165 145)" }} />
                <span className="relative rounded-full w-2 h-2" style={{ background: "oklch(0.65 0.165 145)" }} />
              </span>
              <p className="text-sm text-muted-foreground">
                {MOCK_USERS.filter(u => u.online).length} שחקנים פעילים עכשיו
              </p>
            </div>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setShowCreate(!showCreate)} className="btn-3d btn-accent-3d font-bold gap-2">
              <Plus className="w-4 h-4" />
              צור תחרות
            </Button>
          )}
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card className="p-5 mb-6 border-primary/20 bg-primary/5">
                <h3 className="text-base font-bold mb-4">צור תחרות חדשה</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">שם התחרות</label>
                    <Input value={newCompName} onChange={(e) => setNewCompName(e.target.value)}
                      placeholder="אליפות החברים — סיבוב 3" className="bg-background/50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">סוג</label>
                    <div className="flex gap-3">
                      {[
                        { v: "tournament",   label: "טורניר",  icon: <Trophy className="w-4 h-4 ml-1" /> },
                        { v: "head_to_head", label: "דו-קרב",  icon: <Swords className="w-4 h-4 ml-1" /> },
                      ].map(({ v, label, icon }) => (
                        <Button key={v} variant={newCompType === v ? "default" : "outline"} size="sm"
                          onClick={() => setNewCompType(v as any)}
                          className={newCompType === v ? "btn-3d btn-accent-3d" : ""}>
                          {icon}{label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button className="btn-3d btn-accent-3d font-bold" onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Spinner className="w-4 h-4" /> : "צור תחרות"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCreate(false)}>ביטול</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/20 border border-border/30 mb-6">
            <TabsTrigger value="arena" className="gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Zap className="w-3.5 h-3.5" />
              ארנה חיה
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              תחרויות
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="my" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                שלי
              </TabsTrigger>
            )}
            {isAuthenticated && (
              <TabsTrigger value="completed" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                הסתיימו
              </TabsTrigger>
            )}
          </TabsList>

          {/* ARENA tab */}
          <TabsContent value="arena" className="space-y-6">
            <LiveArena />
            <DemoLeaderboard />
          </TabsContent>

          {/* Active competitions */}
          <TabsContent value="active">
            {isDemoMode && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400/80">
                <Zap className="w-3 h-3 shrink-0" />
                תחרויות לדוגמה — {isAuthenticated ? 'לחץ "צור תחרות" כדי להתחיל תחרות אמיתית' : 'התחבר כדי ליצור תחרות'}
              </div>
            )}
            {activeLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <div className="space-y-4">
                {displayComps.map((comp: any, i: number) => (
                  <CompCard
                    key={comp.id}
                    comp={comp}
                    i={i}
                    isMyComp={comp.creatorId === user?.id}
                    alreadyJoined={activeMyComps.some((mc: any) => mc.id === comp.id) || comp.id < 0}
                    onJoin={() => joinMutation.mutate({ competitionId: comp.id })}
                    joining={joinMutation.isPending}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}
            {!isAuthenticated && (
              <div className="mt-6 text-center">
                <Button className="btn-3d btn-accent-3d font-bold"
                  onClick={() => { window.location.href = getLoginUrl(); }}>
                  התחבר כדי להצטרף לתחרות
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My competitions */}
          <TabsContent value="my">
            {myLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : activeMyComps.length === 0 ? (
              <div className="text-center py-14">
                <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground">עדיין לא הצטרפת לתחרויות</p>
                <p className="text-sm text-muted-foreground/60 mt-1">צור תחרות חדשה או הצטרף לאחת מהפעילות</p>
                <Button className="btn-3d btn-accent-3d font-bold mt-4 gap-2"
                  onClick={() => { setActiveTab("active"); setShowCreate(true); }}>
                  <Plus className="w-4 h-4" />
                  צור תחרות
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMyComps.map((comp: any, i: number) => (
                  <CompCard
                    key={comp.id} comp={comp} i={i}
                    isMyComp={comp.creatorId === user?.id}
                    alreadyJoined={true}
                    onJoin={() => {}}
                    joining={false}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed">
            {completedComps.length === 0 ? (
              <div className="text-center py-14">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground">אין תחרויות שהסתיימו</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedComps.map((comp: any, i: number) => (
                  <motion.div key={comp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <Card className="p-5 border-border/20 opacity-75">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{comp.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            הנקודות שלך: <span className="font-bold" style={{ color: "oklch(0.72 0.190 230)" }}>{comp.myPoints || 0}</span>
                          </p>
                        </div>
                        <Badge className="bg-muted/20 text-muted-foreground border-border/30">הסתיים</Badge>
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
