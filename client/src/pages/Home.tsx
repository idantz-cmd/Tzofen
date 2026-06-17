import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCategory } from "@/contexts/CategoryContext";
import { Trophy, TrendingUp, BarChart3, Users, Flame, Target, ChevronLeft, Timer, Shield, ArrowLeft, Brain, Loader2, Sparkles, Lock } from "lucide-react";
import { TeamLogo, LIGAT_HAEL_TEAMS } from "@/components/TeamLogos";
import { TzofenLogo } from "@/components/TzofenLogo";
import { HeroTitleReveal, TiltCard, StaggerList, PageTransition, CountdownRing } from "@/components/animations";
import { trpc } from "@/lib/trpc";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "בחר משחק",
    desc: "עיין במשחקים הקרובים בליגת העל והליגה הלאומית. צפה בניתוחים מקצועיים ובנתונים היסטוריים.",
    icon: Timer,
    href: "/matches",
    cardStyle: { background: "linear-gradient(135deg, rgba(31,107,255,0.14), rgba(31,107,255,0.06))" },
    iconStyle: { color: "#1F6BFF", filter: "drop-shadow(0 0 6px rgba(31,107,255,0.70))" },
  },
  {
    step: "02",
    title: "חזה את התוצאה",
    desc: "הגש את החיזוי שלך — תוצאה, כמות שערים, קרנות, כרטיסים. ככל שתדייק יותר, תצבור יותר נקודות.",
    icon: Target,
    href: "/matches",
    cardStyle: { background: "linear-gradient(135deg, rgba(19,206,102,0.14), rgba(19,206,102,0.06))" },
    iconStyle: { color: "#13CE66", filter: "drop-shadow(0 0 6px rgba(19,206,102,0.70))" },
  },
  {
    step: "03",
    title: "עלה בדירוג",
    desc: "צבור נקודות, בנה רצפי הצלחה, התחרה מול חברים ועלה בטבלת הדירוג השבועית והכללית.",
    icon: Trophy,
    href: "/leaderboard",
    cardStyle: { background: "linear-gradient(135deg, rgba(255,201,31,0.16), rgba(255,201,31,0.06))" },
    iconStyle: { color: "#E6A800", filter: "drop-shadow(0 0 6px rgba(255,201,31,0.60))" },
  },
];

const FEATURES = [
  { icon: BarChart3, title: "פיצוח AI מקצועי", desc: "צוות AI שמפענח כל משחק — נתוני ליגת העל מ-1990 ועד היום.", iconColor: "#8B4DFF", href: "/chat" },
  { icon: Users, title: "תחרויות ישירות", desc: "אתגר חברים לדו-קרב חיזויים, צור טורנירים פרטיים והתחרה על הכבוד.", iconColor: "#1F6BFF", href: "/competitions" },
  { icon: Flame, title: "רצפי הצלחה", desc: "בנה רצפים של חיזויים נכונים ברצף. ככל שהרצף ארוך יותר — הבונוס גדול יותר.", iconColor: "#FF3B5C", href: "/dashboard" },
  { icon: Trophy, title: "דירוג שבועי", desc: "טבלת דירוג מתעדכנת כל שבוע. המובילים מקבלים תגים מיוחדים ומעמד בקהילה.", iconColor: "#FFC91F", href: "/leaderboard" },
  { icon: Shield, title: "חיזוי מתקדם", desc: "חזה שערים, קרנות, כרטיסים צהובים ואדומים — וצבור נקודות בונוס על דיוק.", iconColor: "#1F6BFF", href: "/matches" },
  { icon: TrendingUp, title: "שיתוף וקהילה", desc: "שתף ניחושים לוואטסאפ, דון עם מתחרים אחרים, ולמד מהמומחים בקהילה.", iconColor: "#13CE66", href: "/user-chat" },
];

const STATS = [
  { value: "בתקופת הרצה", label: "דיוק AI — עקבו בזמן אמת", colorStyle: { color: "#8B4DFF" } },
  { value: "1,200+", label: "מתחרים פעילים", colorStyle: { color: "#1F6BFF" } },
  { value: "14", label: "רצף שיא", colorStyle: { color: "#13CE66" } },
  { value: "8", label: "תחרויות שבועיות", colorStyle: { color: "#1F6BFF" } },
];

const TOTAL_WINDOW_SECONDS = 7 * 24 * 60 * 60; // 7-day prediction window

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { setCategory } = useCategory();
  useEffect(() => { setCategory("home"); }, [setCategory]);
  const teamNames = Object.keys(LIGAT_HAEL_TEAMS);

  const { data: upcomingMatches = [] } = trpc.matches.getUpcoming.useQuery({});
  const nextMatch = upcomingMatches[0] as { id: number; matchDate: string; homeTeam: string; awayTeam: string } | undefined;

  const { data: leaderboardData = [] } = trpc.leaderboard.getAllTime.useQuery({ limit: 1000 });
  const totalPredictionsCount = leaderboardData.length > 0
    ? (leaderboardData as any[]).reduce((s: number, e: any) => s + (e.totalPredictions || 0), 0)
    : undefined;

  const aiPreview = trpc.agents.query.useMutation();
  const [aiPreviewRequested, setAiPreviewRequested] = useState(false);

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!nextMatch?.matchDate) return;
    const kickoff = new Date(nextMatch.matchDate).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((kickoff - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextMatch?.matchDate]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        <Navigation />

        <main>
          {/* Hero Section */}
          <section className="relative py-16 md:py-24 overflow-hidden">
            {/* Gradient overlays */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(31,107,255,0.10), transparent 60%)" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(31,107,255,0.12), transparent)" }}
            />

            <div className="relative max-w-5xl mx-auto px-4 text-center">
              {/* Floating team badges */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {teamNames.slice(0, 8).map((team, i) => (
                  <motion.div
                    key={team}
                    className="absolute opacity-[0.18]"
                    initial={{ x: `${10 + i * 12}%`, y: `${20 + (i % 3) * 30}%` }}
                    animate={{ y: [`${20 + (i % 3) * 30}%`, `${25 + (i % 3) * 30}%`, `${20 + (i % 3) * 30}%`] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <TeamLogo teamName={team} size="sm" />
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Hero Logo */}
                <motion.div
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                  className="flex justify-center mb-6"
                >
                  <TzofenLogo
                    size={88}
                    rich
                    style={{ boxShadow: "0 8px 32px rgba(31,107,255,0.40)", borderRadius: "20px" }}
                  />
                </motion.div>

                {/* Live badge */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border"
                  style={{
                    background: "rgba(31,107,255,0.10)",
                    borderColor: "rgba(31,107,255,0.35)",
                    boxShadow: "0 0 12px rgba(31,107,255,0.18)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#1F6BFF", boxShadow: "0 0 8px rgba(31,107,255,0.85)" }}
                  />
                  <span className="text-sm font-semibold" style={{ color: "#1848CC" }}>
                    ליגת העל • ליגה לאומית • עונת 2025/26
                  </span>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.55 }}
                  className="mb-4"
                >
                  <h1 className="text-4xl md:text-6xl font-black leading-tight mb-2">
                    <span className="text-foreground">תפסיק לנחש,</span>
                  </h1>
                  <HeroTitleReveal
                    words={["תתחיל", "לנצח."]}
                    className="text-4xl md:text-6xl font-black"
                  />
                </motion.div>

                <p className="text-lg md:text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
                  צוות AI שמפענח כל משחק — תתחרה מול כל ישראל
                </p>
                <p className="text-base mb-8 font-medium" style={{ color: "#1F6BFF" }}>
                  פצח • חזה • התחרה • עלה בדירוג
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated ? (
                    <Link href="/matches">
                      <Button variant="accent" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                        <Target className="w-5 h-5 ml-2" />
                        חזה עכשיו
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full sm:w-auto text-lg px-8 py-6"
                      onClick={() => { window.location.href = getLoginUrl(); }}
                    >
                      <Target className="w-5 h-5 ml-2" />
                      הצטרף וחזה עכשיו
                    </Button>
                  )}

                  <Link href="/leaderboard">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                      <Trophy className="w-5 h-5 ml-2" />
                      טבלת הדירוג
                    </Button>
                  </Link>
                </div>

                {/* WOW Moment: Next match countdown + predictions counter */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8"
                >
                  {/* Countdown ring — shown only when a match is loaded */}
                  {nextMatch && (
                    <div className="flex flex-col items-center gap-2">
                      <CountdownRing
                        totalSeconds={TOTAL_WINDOW_SECONDS}
                        remainingSeconds={Math.min(remainingSeconds, TOTAL_WINDOW_SECONDS)}
                        size={80}
                        strokeWidth={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        {nextMatch.homeTeam} vs {nextMatch.awayTeam}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">המשחק הבא</p>
                    </div>
                  )}

                  {/* Predictions counter */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-3xl font-black tabular-nums" style={{ color: "#1F6BFF", textShadow: "0 0 12px rgba(31,107,255,0.45)" }}>
                      {totalPredictionsCount !== undefined ? `${totalPredictionsCount.toLocaleString("he-IL")}+` : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">ניחושים הוגשו</p>
                    <p className="text-[10px] text-muted-foreground/60">בפלטפורמה</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* AI Preview Card — guests only */}
          {!isAuthenticated && (
            <section className="pb-6 max-w-lg mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="rounded-2xl border p-5"
                style={{
                  background: "linear-gradient(135deg, rgba(139,77,255,0.08), rgba(31,107,255,0.05))",
                  borderColor: "rgba(139,77,255,0.25)",
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #9D6FFF, #8B4DFF)" }}
                  >
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-foreground">ניחוש AI חינמי</p>
                    <p className="text-xs text-muted-foreground">
                      {nextMatch ? `${nextMatch.homeTeam} נגד ${nextMatch.awayTeam}` : "ניתוח מהיר לליגת העל"}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(139,77,255,0.15)", color: "#8B4DFF" }}
                  >
                    BETA
                  </span>
                </div>

                {/* Match row — only when a real match is loaded */}
                {nextMatch && (
                  <div
                    className="flex items-center justify-between mb-4 p-3 rounded-xl gap-2"
                    style={{ background: "rgba(255,255,255,0.7)" }}
                  >
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <TeamLogo teamName={nextMatch.homeTeam} size="sm" />
                      <span className="text-xs font-bold text-center leading-tight line-clamp-2">{nextMatch.homeTeam}</span>
                    </div>
                    <span className="text-sm font-black text-muted-foreground/50 shrink-0">vs</span>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <TeamLogo teamName={nextMatch.awayTeam} size="sm" />
                      <span className="text-xs font-bold text-center leading-tight line-clamp-2">{nextMatch.awayTeam}</span>
                    </div>
                  </div>
                )}

                {/* State machine */}
                {!aiPreviewRequested ? (
                  <Button
                    variant="accent"
                    className="w-full font-bold"
                    onClick={() => {
                      setAiPreviewRequested(true);
                      const msg = nextMatch
                        ? `נתח את המשחק הקרוב: ${nextMatch.homeTeam} נגד ${nextMatch.awayTeam}. תן תחזית קצרה ובהירה — מי ינצח ולמה?`
                        : "תן דוגמה לניתוח AI של משחק ליגת העל הישראלית — כולל מי ינצח ולמה, בשפה עברית ידידותית.";
                      aiPreview.mutate({
                        agentType: "prediction",
                        message: msg,
                        ...(nextMatch ? { matchId: nextMatch.id } : {}),
                      });
                    }}
                  >
                    <Sparkles className="w-4 h-4 ml-2" />
                    קבל ניחוש AI בחינם
                  </Button>
                ) : aiPreview.isPending ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: "#8B4DFF" }} />
                    <p className="text-sm font-medium">8 סוכני AI מנתחים...</p>
                  </div>
                ) : aiPreview.data ? (
                  <div>
                    <div
                      className="relative overflow-hidden rounded-xl p-3 mb-3"
                      style={{ background: "rgba(255,255,255,0.7)", maxHeight: 96 }}
                    >
                      <p className="text-sm text-foreground leading-relaxed" dir="rtl">
                        {aiPreview.data.response}
                      </p>
                      <div
                        className="absolute bottom-0 inset-x-0 h-12 rounded-b-xl flex items-end justify-center pb-1"
                        style={{ background: "linear-gradient(to bottom, transparent, rgba(250,248,255,0.97))" }}
                      >
                        <Lock className="w-3 h-3 mb-0.5" style={{ color: "#8B4DFF" }} />
                      </div>
                    </div>
                    <Button
                      variant="accent"
                      className="w-full font-bold"
                      onClick={() => { window.location.href = getLoginUrl(); }}
                    >
                      הצטרף לקרוא את הניחוש המלא
                    </Button>
                  </div>
                ) : aiPreview.isError ? (
                  <p className="text-xs text-center text-muted-foreground py-2">
                    לא הצלחנו לטעון את הניחוש — נסה שוב מאוחר יותר
                  </p>
                ) : null}
              </motion.div>
            </section>
          )}

          {/* Stats Banner */}
          <section className="py-8 border-y border-border/30" style={{ background: "rgba(238,243,255,0.85)" }}>
            <div className="max-w-5xl mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <p className="text-2xl md:text-3xl font-black" style={stat.colorStyle}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-16" style={{ background: "#F5F8FF" }}>
          <div className="max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-black mb-3 text-gradient-blue">איך זה עובד?</h2>
              <p className="text-muted-foreground">שלושה צעדים פשוטים לדירוג</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <Link href={item.href}>
                    <TiltCard className="p-6 h-full cursor-pointer group" style={item.cardStyle}>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-3xl font-black" style={{ color: "#1848CC" }}>{item.step}</span>
                        <item.icon className="w-6 h-6" style={item.iconStyle} />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                      <div className="flex items-center justify-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1F6BFF" }}>
                        לחץ להתחיל <ArrowLeft className="w-3 h-3" />
                      </div>
                    </TiltCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          </section>

          {/* Features Grid */}
          <section className="py-16 border-y border-border/30" style={{ background: "#EEF3FF" }}>
            <div className="max-w-5xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-black mb-3 text-gradient-amber">מה מחכה לך בפנים</h2>
                <p className="text-muted-foreground">הכלים שיעזרו לך להיות הכי מדויק</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href={feature.href}>
                      <Card className="p-5 h-full group cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                        <div className="flex items-start justify-between mb-3">
                          <feature.icon
                            className="w-8 h-8 transition-transform duration-200 group-hover:scale-110"
                            style={{ color: feature.iconColor }}
                          />
                          <ArrowLeft className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors mt-1" />
                        </div>
                        <h3 className="text-base font-bold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Teams Showcase */}
          <section className="py-16 max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-black mb-3">כל הקבוצות. כל המשחקים.</h2>
              <p className="text-muted-foreground">ליגת העל והליגה הלאומית — כיסוי מלא</p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
              {teamNames.map((name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.12 }}
                  className="cursor-default"
                >
                  <div className="flex flex-col items-center gap-1">
                    <TeamLogo teamName={name} size="md" />
                    <span className="text-[10px] text-muted-foreground font-medium">{name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-20 text-center max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
            >
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                מוכן להוכיח את עצמך?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                הצטרף לאלפי מנחשים שכבר מתחרים בפלטפורמה. המשחק הבא מתחיל בקרוב.
              </p>
              {isAuthenticated ? (
                <Link href="/matches">
                  <Button variant="accent" size="lg" className="text-lg px-10 py-6">
                    <ChevronLeft className="w-5 h-5 ml-2" />
                    התחל לחזות
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="accent"
                  size="lg"
                  className="text-lg px-10 py-6"
                  onClick={() => { window.location.href = getLoginUrl(); }}
                >
                  <ChevronLeft className="w-5 h-5 ml-2" />
                  הצטרף עכשיו — בחינם
                </Button>
              )}
            </motion.div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/20 py-8 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <TzofenLogo size={28} style={{ borderRadius: "7px", boxShadow: "0 1px 6px rgba(31,107,255,0.30)" }} />
              <span className="font-black text-base" style={{ color: "#1F6BFF", fontFamily: "'Rubik', sans-serif" }}>צופן</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 — פיצוח כדורגל ישראלי בעזרת AI
            </p>
          </footer>
        </main>
      </div>
    </PageTransition>
  );
}
