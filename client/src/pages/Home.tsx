import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, BarChart3, Users, Flame, Target, ChevronLeft, Timer, Shield } from "lucide-react";
import { TeamLogo, getTeamColors, LIGAT_HAEL_TEAMS } from "@/components/TeamLogos";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const teamNames = Object.keys(LIGAT_HAEL_TEAMS);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

          <div className="relative max-w-5xl mx-auto px-4 text-center">
            {/* Floating team badges background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {teamNames.slice(0, 8).map((team, i) => (
                <motion.div
                  key={team}
                  className="absolute opacity-15"
                  initial={{ x: `${10 + (i * 12)}%`, y: `${20 + (i % 3) * 30}%` }}
                  animate={{
                    y: [`${20 + (i % 3) * 30}%`, `${25 + (i % 3) * 30}%`, `${20 + (i % 3) * 30}%`],
                  }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <TeamLogo teamName={team} size="sm" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-400">ליגת העל • ליגה לאומית • עונת 2025/26</span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                <span className="text-foreground">חזה את התוצאה.</span>
                <br />
                <span className="bg-gradient-to-l from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  הוכח שאתה הכי טוב.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-3 max-w-2xl mx-auto">
                פלטפורמת החיזויים המקצועית לכדורגל הישראלי
              </p>
              <p className="text-base text-emerald-400/80 mb-8">
                נתח • חזה • התחרה • עלה בדירוג
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link href="/matches">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-transform duration-150 text-lg px-8 py-6"
                    >
                      <Target className="w-5 h-5 ml-2" />
                      חזה עכשיו
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-transform duration-150 text-lg px-8 py-6"
                    onClick={() => { window.location.href = getLoginUrl(); }}
                  >
                    <Target className="w-5 h-5 ml-2" />
                    הצטרף וחזה עכשיו
                  </Button>
                )}

                <Link href="/leaderboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold text-lg px-8 py-6 active:scale-[0.97] transition-transform duration-150"
                  >
                    <Trophy className="w-5 h-5 ml-2" />
                    טבלת הדירוג
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="py-8 border-y border-border/30 bg-muted/5">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "72%", label: "דיוק חיזויים", color: "text-emerald-400" },
                { value: "1,200+", label: "מתחרים פעילים", color: "text-blue-400" },
                { value: "14", label: "רצף שיא", color: "text-orange-400" },
                { value: "8", label: "תחרויות שבועיות", color: "text-amber-400" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <p className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</p>
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
            <h2 className="text-3xl font-black mb-3">איך זה עובד?</h2>
            <p className="text-muted-foreground">שלושה צעדים פשוטים לדירוג</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "בחר משחק",
                desc: "עיין במשחקים הקרובים בליגת העל והליגה הלאומית. צפה בניתוחים מקצועיים ובנתונים היסטוריים.",
                icon: Timer,
                color: "emerald",
              },
              {
                step: "02",
                title: "חזה את התוצאה",
                desc: "הגש את החיזוי שלך — תוצאה, כמות שערים, קרנות, כרטיסים. ככל שתדייק יותר, תצבור יותר נקודות.",
                icon: Target,
                color: "amber",
              },
              {
                step: "03",
                title: "עלה בדירוג",
                desc: "צבור נקודות, בנה רצפי הצלחה, התחרה מול חברים ועלה בטבלת הדירוג השבועית והכללית.",
                icon: Trophy,
                color: "purple",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <Card className={`p-6 bg-gradient-to-br from-${item.color}-500/10 to-${item.color}-600/5 border-${item.color}-500/20 h-full`}>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="text-3xl font-black text-muted-foreground/30">{item.step}</span>
                    <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-muted/5 border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-black mb-3">מה מחכה לך בפנים</h2>
              <p className="text-muted-foreground">הכלים שיעזרו לך להיות הכי מדויק</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: BarChart3, title: "ניתוח מקצועי", desc: "נתונים היסטוריים מ-1990 ועד היום, סטטיסטיקות מעמיקות וניתוח מגמות.", color: "text-emerald-400" },
                { icon: Users, title: "תחרויות ישירות", desc: "אתגר חברים לדו-קרב חיזויים, צור טורנירים פרטיים והתחרה על הכבוד.", color: "text-blue-400" },
                { icon: Flame, title: "רצפי הצלחה", desc: "בנה רצפים של חיזויים נכונים ברצף. ככל שהרצף ארוך יותר — הבונוס גדול יותר.", color: "text-orange-400" },
                { icon: Trophy, title: "דירוג שבועי", desc: "טבלת דירוג מתעדכנת כל שבוע. המובילים מקבלים תגים מיוחדים ומעמד בקהילה.", color: "text-amber-400" },
                { icon: Shield, title: "חיזוי מתקדם", desc: "חזה שערים, קרנות, כרטיסים צהובים ואדומים — וצבור נקודות בונוס על דיוק.", color: "text-purple-400" },
                { icon: TrendingUp, title: "צ'אט קהילתי", desc: "דון עם מתחרים אחרים, שתף ניתוחים, ולמד מהמומחים בקהילה.", color: "text-rose-400" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="p-5 h-full border-border/30 bg-card/50 hover:border-emerald-500/30 transition-all duration-300 group">
                    <feature.icon className={`w-8 h-8 mb-3 ${feature.color} group-hover:scale-110 transition-transform duration-200`} />
                    <h3 className="text-base font-bold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </Card>
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
                whileHover={{ scale: 1.1 }}
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
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-lg px-10 py-6 shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-transform duration-150"
                >
                  <ChevronLeft className="w-5 h-5 ml-2" />
                  התחל לחזות
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-lg px-10 py-6 shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-transform duration-150"
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
  );
}
