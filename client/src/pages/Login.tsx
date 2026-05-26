import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

type Mode = "login" | "register";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      if (!res.ok) {
        toast.error(data.error ?? "שגיאה בהתחברות עם גוגל");
        return;
      }
      toast.success("התחברת בהצלחה!");
      navigate("/");
      window.location.reload();
    } catch {
      toast.error("שגיאת רשת");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login"
      ? { email: form.email, password: form.password }
      : { email: form.email, password: form.password, name: form.name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "שגיאה");
        return;
      }

      toast.success(mode === "login" ? "התחברת בהצלחה!" : "נרשמת בהצלחה!");
      navigate("/");
      window.location.reload();
    } catch {
      toast.error("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "oklch(0.78 0.155 72 / 0.10)", border: "1px solid oklch(0.78 0.155 72 / 0.25)" }}
          >
            <Trophy className="w-8 h-8" style={{ color: "oklch(0.78 0.155 72)" }} />
          </motion.div>
          {/* GetWinIL brand */}
          <div className="leading-none inline-block mt-1" dir="ltr">
            <div className="h-[2.5px] rounded-full mb-[4px]" style={{ background: "#0038A8" }} />
            <div className="flex items-center justify-center">
              <span className="font-light text-[1.45rem] tracking-tight" style={{ color: "#0038A8", fontFamily: "'Rubik', sans-serif" }}>Get</span>
              <span className="font-black text-[1.45rem] tracking-tight" style={{ color: "#0038A8", fontFamily: "'Rubik', sans-serif" }}>Win</span>
              <span className="text-[11px] font-bold mx-[2px] relative" style={{ color: "#0038A8", top: "-2px" }}>✡</span>
              <span className="font-black text-[1.45rem] tracking-tight" style={{ color: "#0038A8", fontFamily: "'Rubik', sans-serif" }}>L</span>
            </div>
            <div className="h-[2.5px] rounded-full mt-[4px]" style={{ background: "#0038A8" }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">נחש וניצח בכדורגל הישראלי</p>
        </div>

        {/* Card */}
        <div className="card-glass rounded-2xl p-6">
          {/* Tab Toggle */}
          <div className="flex rounded-lg bg-muted/50 p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "כניסה" : "הרשמה"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="name">שם מלא</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="ישראל ישראלי"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    required={mode === "register"}
                    className="mt-1.5"
                    dir="rtl"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="mt-1.5"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="לפחות 6 תווים"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="mt-1.5"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              className="w-full font-bold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              {mode === "login" ? "כניסה" : "הרשמה"}
            </Button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">או התחבר עם</span>
                </div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("שגיאה בהתחברות עם גוגל")}
                  size="large"
                  width="100%"
                />
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
