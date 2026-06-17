import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy, BarChart3, Flame, Shield, Star, Check } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { TeamLogo, LIGAT_HAEL_TEAMS } from "@/components/TeamLogos";
import { TzofenLogo } from "@/components/TzofenLogo";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

const FEATURES = [
  { icon: BarChart3, text: "ניתוח מקצועי מ-1990 ועד היום" },
  { icon: Flame,    text: "רצפי הצלחה ובונוסי נקודות" },
  { icon: Trophy,   text: "טבלת דירוג שבועית וכללית" },
  { icon: Shield,   text: "חיזויים מתקדמים — שערים, קרנות, כרטיסים" },
];

const TEAMS = Object.keys(LIGAT_HAEL_TEAMS).slice(0, 16);

type Mode = "login" | "register";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [favTeam, setFavTeam] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "שגיאה בהתחברות עם גוגל"); return; }
      toast.success("התחברת בהצלחה!");
      navigate("/");
      window.location.reload();
    } catch { toast.error("שגיאת רשת"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && form.password !== form.confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }
    setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login"
      ? { email: form.email, password: form.password }
      : { email: form.email, password: form.password, name: form.name, favTeam: favTeam ?? undefined };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "שגיאה"); return; }
      toast.success(mode === "login" ? "התחברת בהצלחה!" : "ברוך הבא לצופן!");
      navigate("/");
      window.location.reload();
    } catch { toast.error("שגיאת רשת");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">

      {/* ── Left panel: branding + features ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F3080 0%, #091A55 100%)",
        }}
      >
        {/* Gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "#1F6BFF" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "#8B4DFF" }} />

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3">
            <TzofenLogo size={52} rich style={{ borderRadius: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.30)", flexShrink: 0 }} />
            <div>
              <p className="font-black text-3xl text-white" style={{ fontFamily: "'Rubik', sans-serif" }}>צופן</p>
              <p className="text-white/55 text-sm">תפסיק לנחש, תתחיל לנצח</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-5">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">מה מחכה לך</p>
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(31,107,255,0.15)", border: "1px solid rgba(31,107,255,0.25)" }}>
                <Icon className="w-5 h-5" style={{ color: "#4D8FFF" }} />
              </div>
              <p className="text-white/80 text-sm font-medium">{text}</p>
            </motion.div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: "rgba(31,107,255,0.10)", border: "1px solid rgba(31,107,255,0.18)" }}>
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {["🧑", "👩", "👨", "🧑‍💻"].map((e, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2"
                style={{ background: ["#3D6FE0","#2E5FD0","#5580E8","#6B90F0"][i], borderColor: "#091A55" }}>
                {e}
              </div>
            ))}
          </div>
          <div>
            <p className="text-white font-bold text-sm">1,200+ מנחשים פעילים</p>
            <p className="text-white/50 text-xs">כבר מתחרים בפלטפורמה</p>
          </div>
        </div>
      </motion.div>

      {/* ── Right panel: form ── */}
      <div className="force-light flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2.5">
              <TzofenLogo size={40} style={{ borderRadius: "10px", boxShadow: "0 2px 12px rgba(31,107,255,0.42)", flexShrink: 0 }} />
              <span className="font-black text-2xl" style={{ color: "#1F6BFF", fontFamily: "'Rubik', sans-serif" }}>צופן</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-1">
            {mode === "login" ? "ברוך השב 👋" : "הצטרף עכשיו 🚀"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login" ? "היכנס לחשבונך כדי להמשיך לחזות" : "צור חשבון בחינם ותתחיל לחזות"}
          </p>

          {/* Tab toggle */}
          <div className="flex rounded-xl bg-muted/40 p-1 mb-6 gap-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {m === "login" ? "כניסה" : "הרשמה"}
              </button>
            ))}
          </div>

          {/* Google SSO */}
          {GOOGLE_CLIENT_ID && (
            <div className="mb-4 flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess}
                onError={() => toast.error("שגיאה בהתחברות עם גוגל")}
                size="large" width="100%" />
            </div>
          )}

          {GOOGLE_CLIENT_ID && (
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-muted-foreground">או עם אימייל</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <Label htmlFor="name">שם תצוגה</Label>
                    <Input id="name" type="text" placeholder="למשל: כדורגלניסט2025"
                      value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      required={mode === "register"} className="mt-1.5" dir="rtl" />
                  </div>

                  {/* Favorite team picker */}
                  <div>
                    <Label className="mb-2 block">קבוצה אהובה <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
                    <div className="grid grid-cols-4 gap-2">
                      {TEAMS.map((team) => (
                        <button key={team} type="button"
                          onClick={() => setFavTeam(favTeam === team ? null : team)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-150 ${
                            favTeam === team
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/30 hover:border-primary/30 bg-muted/10"
                          }`}
                        >
                          <TeamLogo teamName={team} size="sm" />
                          <span className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-2">{team}</span>
                          {favTeam === team && (
                            <Check className="w-3 h-3 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required className="mt-1.5" dir="ltr" />
            </div>

            <div>
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" type="password" placeholder="לפחות 6 תווים"
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required className="mt-1.5" dir="ltr" />
            </div>

            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                  <Input id="confirmPassword" type="password" placeholder="חזור על הסיסמה"
                    value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required={mode === "register"} className="mt-1.5" dir="ltr" />
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" variant="accent" className="w-full h-12 font-bold text-base" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              {mode === "login" ? "כניסה" : "צור חשבון בחינם"}
            </Button>
          </form>

          {/* Pricing link */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            רוצה יותר יכולות?{" "}
            <a href="/pricing" className="font-bold hover:underline" style={{ color: "#1F6BFF" }}>
              ראה את תוכניות המנוי <Star className="w-3 h-3 inline" />
            </a>
          </p>

          {/* Plan benefits teaser */}
          {mode === "register" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 rounded-xl border border-border/20 bg-muted/5"
            >
              <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" /> מה מקבלים בחינם?
              </p>
              <ul className="space-y-1">
                {["5 חיזויים בשבוע", "גישה לטבלת הדירוג", "ניתוחי AI בסיסיים"].map(t => (
                  <li key={t} className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
