import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, BarChart3, Users, Flame, Target, ChevronLeft, Timer, Shield, ArrowLeft } from "lucide-react";
import { TeamLogo, LIGAT_HAEL_TEAMS } from "@/components/TeamLogos";
import { HeroTitleReveal, TiltCard, StaggerList, PageTransition } from "@/components/animations";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "בחר משחק",
    desc: "עיין במשחקים הקרובים בליגת העל והליגה הלאומית. צפה בניתוחים מקצועיים ובנתונים היסטוריים.",
    icon: Timer,
    href: "/matches",
    cardStyle: { background: "linear-gradient(135deg, oklch(0.50 0.165 240 / 0.14), oklch(0.40 0.155 248 / 0.06))" },
    iconStyle: { color: "oklch(0.55 0.165 240)", filter: "drop-shadow(0 0 6px oklch(0.50 0.165 240 / 70%))" },
  },
  {
    step: "02",
    title: "חזה את התוצאה",
    desc: "הגש את החיזוי שלך — תוצאה, כמות שערים, קרנות, כרטיסים. ככל שתדייק יותר, תצבור יותר נקודות.",
    icon: Target,
    href: "/matches",
    cardStyle: { background: "linear-gradient(135deg, oklch(0.65 0.160 200 / 0.14), oklch(0.50 0.145 210 / 0.06))" },
    iconStyle: { color: "oklch(0.65 0.160 200)", filter: "drop-shadow(0 0 6px oklch(0.60 0.155 202 / 70%))" },
  },
  {
    step: "03",
    title: "עלה בדירוג",
    desc: "צבור נקודות, בנה רצפי הצלחה, התחרה מול חברים ועלה בטבלת הדירוג השבועית והכללית.",
    icon: Trophy,
    href: "/leaderboard",
    cardStyle: { background: "linear-gradient(135deg, oklch(0.90 0.195 92 / 0.16), oklch(0.80 0.180 88 / 0.06))" },
    iconStyle: { color: "oklch(0.75 0.185 90)", filter: "drop-shadow(0 0 6px oklch(0.85 0.195 92 / 60%))" },
  },
];

const FEATURES = [
  { icon: BarChart3, title: "ניתוח מקצועי", desc: "נתונים היסטוריים מ-1990 ועד היום, סטטיסטיקות מעמיקות וניתוח מגמות.", iconColor: "oklch(0.55 0.165 240)", href: "/chat" },
  { icon: Users, title: "תחרויות ישירות", desc: "אתגר חברים לדו-קרב חיזויים, צור טורנירים פרטיים והתחרה על הכבוד.", iconColor: "oklch(0.65 0.160 200)", href: "/competitions" },
  { icon: Flame, title: "רצפי הצלחה", desc: "בנה רצפים של חיזויים נכונים ברצף. ככל שהרצף ארוך יותר — הבונוס גדול יותר.", iconColor: "oklch(0.75 0.185 90)", href: "/dashboard" },
  { icon: Trophy, title: "דירוג שבועי", desc: "טבלת דירוג מתעדכנת כל שבוע. המובילים מקבלים תגים מיוחדים ומעמד בקהילה.", iconColor: "oklch(0.82 0.190 92)", href: "/leaderboard" },
  { icon: Shield, title: "חיזוי מתקדם", desc: "חזה שערים, קרנות, כרטיסים צהובים ואדומים — וצבור נקודות בונוס על דיוק.", iconColor: "oklch(0.55 0.165 240)", href: "/matches" },
  { icon: TrendingUp, title: "צ'אט קהילתי", desc: "דון עם מתחרים אחרים, שתף ניתוחים, ולמד מהמומחים בקהילה.", iconColor: "oklch(0.65 0.160 200)", href: "/user-chat" },
];

const STATS = [
  { value: "72%", label: "דיוק חיזויים", colorStyle: { color: "oklch(0.75 0.185 90)", textShadow: "0 0 12px oklch(0.85 0.195 92 / 65%)" } },
  { value: "1,200+", label: "מתחרים פעילים", colorStyle: { color: "oklch(0.55 0.165 240)", textShadow: "0 0 12px oklch(0.50 0.165 240 / 60%)" } },
  { value: "14", label: "רצף שיא", colorStyle: { color: "oklch(0.65 0.160 200)", textShadow: "0 0 10px oklch(0.60 0.155 202 / 55%)" } },
  { value: "8", label: "תחרויות שבועיות", colorStyle: { color: "oklch(0.55 0.165 240)", textShadow: "0 0 12px oklch(0.50 0.160 240 / 55%)" } },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const teamNames = Object.keys(LIGAT_HAEL_TEAMS);

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
              style={{ background: "linear-gradient(to bottom, oklch(0.50 0.165 240 / 0.12), transparent 60%)" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.50 0.165 240 / 0.14), transparent)" }}
            />

            <div className="relative max-w-5xl mx-auto px-4 text-center">
              {/* Floating team badges */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {teamNames.slice(0, 8).map((team, i) => (
                  <motion.div
                    key={team}
                    className="absolute opacity-10"
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
                {/* Live badge */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border"
                  style={{
                    background: "oklch(0.50 0.165 240 / 0.10)",
                    borderColor: "oklch(0.50 0.165 240 / 0.35)",
                    boxShadow: "0 0 12px oklch(0.50 0.165 240 / 0.20)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "oklch(0.55 0.165 240)", boxShadow: "0 0 8px oklch(0.50 0.165 240 / 0.9)" }}
                  />
                  <span className="text-sm font-semibold" style={{ color: "oklch(0.40 0.160 240)" }}>
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
                    <span className="text-foreground">חזה את התוצאה.</span>
                  </h1>
                  <HeroTitleReveal
                    words={["הוכח", "שאתה", "הכי", "טוב."]}
                    className="text-4xl md:text-6xl font-black"
                  />
                </motion.div>

                <p className="text-lg md:text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
                  פלטפורמת החיזויים המקצועית לכדורגל הישראלי
                </p>
                <p className="text-base mb-8 font-medium" style={{ color: "oklch(0.55 0.165 240)", textShadow: "0 0 8px oklch(0.50 0.165 240 / 0.40)" }}>
                  נתח • חזה • התחרה • עלה בדירוג
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
              </motion.div>
            </div>
          </section>

          {/* Stats Banner */}
          <section className="py-8 border-y border-border/30" style={{ background: "oklch(0.94 0.018 228 / 0.85)" }}>
            <div className="max-w-5xl mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
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
          <section className="py-16 max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <Link href={item.href}>
                    <TiltCard className="p-6 h-full cursor-pointer group" style={item.cardStyle}>
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-3xl font-black" style={{ color: "oklch(0.40 0.110 240)" }}>{item.step}</span>
                        <item.icon className="w-6 h-6" style={item.iconStyle} />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                      <div className="flex items-center justify-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "oklch(0.55 0.165 240)" }}>
                        לחץ להתחיל <ArrowLeft className="w-3 h-3" />
                      </div>
                    </TiltCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-16 border-y border-border/30" style={{ background: "oklch(0.95 0.014 222 / 0.75)" }}>
            <div className="max-w-5xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
                    viewport={{ once: true }}
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
              viewport={{ once: true }}
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
                  viewport={{ once: true }}
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
              viewport={{ once: true }}
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
            <p className="text-sm text-muted-foreground">
              betingapp © 2025 — פלטפורמת חיזויים מקצועית לכדורגל הישראלי
            </p>
          </footer>
        </main>
      </div>
    </PageTransition>
  );
}
