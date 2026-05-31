import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { Swords, Trophy, Users, Zap } from "lucide-react";

const COMING_FEATURES = [
  { icon: Swords,  label: "דו-קרב בין חברים",  desc: "אתגר חבר לדו-קרב חיזויים על המשחק הבא" },
  { icon: Trophy,  label: "טורנירים פרטיים",   desc: "צור טורניר, הזמן חברים, מי שיצבור הכי הרבה ינצח" },
  { icon: Users,   label: "ליגות קהילתיות",    desc: "הצטרף לליגות ציבוריות ותתחרה עם מנחשים מהארץ" },
  { icon: Zap,     label: "פרסים ותגים",        desc: "זכה בתגים ייחודיים ועלה בסטטוס הקהילתי שלך" },
];

export default function Competitions() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-12"
        >
          {/* Animated icon */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.165 240 / 0.15), oklch(0.65 0.160 200 / 0.10))",
              border: "1px solid oklch(0.55 0.165 240 / 0.25)",
              boxShadow: "0 8px 32px oklch(0.50 0.165 240 / 0.20)",
            }}
          >
            <Swords className="w-10 h-10" style={{ color: "oklch(0.55 0.165 240)" }} />
          </motion.div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border"
            style={{ background: "oklch(0.90 0.195 92 / 0.10)", borderColor: "oklch(0.90 0.195 92 / 0.30)", color: "oklch(0.72 0.185 90)" }}>
            <Zap className="w-3 h-3" /> בקרוב
          </div>

          <h1 className="text-3xl font-black text-gradient-blue mb-3">תחרויות</h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            מערכת תחרויות חדשה בדרך — אתגר חברים, צור טורנירים, והתחרה על הכבוד.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {COMING_FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="p-5 rounded-xl border border-border/20 hover:border-primary/20 transition-all duration-200"
              style={{ background: "oklch(1 0 0 / 0.5)" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: "oklch(0.50 0.165 240 / 0.10)" }}>
                <Icon className="w-4.5 h-4.5" style={{ color: "oklch(0.55 0.165 240)" }} />
              </div>
              <p className="font-bold text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Notify CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-center p-6 rounded-xl border border-border/20 text-sm text-muted-foreground"
          style={{ background: "oklch(0.96 0.015 228 / 0.6)" }}
        >
          <p>נעדכן אותך ברגע שהתחרויות יהיו זמינות 🏆</p>
        </motion.div>
      </main>
    </div>
  );
}
