import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star, Trophy, Zap, Shield, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navigation from "@/components/Navigation";

const PLANS = [
  {
    id: "free",
    name: "חינם",
    price: null,
    period: null,
    badge: null,
    icon: Star,
    color: "#1F6BFF",
    borderColor: "rgba(31,107,255,0.25)",
    bgColor: "rgba(31,107,255,0.06)",
    iconBgColor: "rgba(31,107,255,0.15)",
    features: [
      "5 חיזויים בשבוע",
      "גישה לטבלת הדירוג",
      "ניתוח AI בסיסי",
      "סטטיסטיקות בסיסיות",
      "צ'אט קהילתי",
    ],
    locked: [
      "חיזויים ללא הגבלה",
      "ניתוח AI מתקדם",
      "חיזויי שערים, קרנות, כרטיסים",
      "תחרויות פרטיות",
    ],
    cta: "התחל בחינם",
    highlight: false,
  },
  {
    id: "pro",
    name: "פרו",
    price: "₪29",
    period: "לחודש",
    badge: "הכי פופולרי",
    icon: Zap,
    color: "#8B4DFF",
    borderColor: "rgba(139,77,255,0.50)",
    bgColor: "rgba(139,77,255,0.08)",
    iconBgColor: "rgba(139,77,255,0.15)",
    features: [
      "חיזויים ללא הגבלה",
      "ניתוח AI מתקדם",
      "חיזויי שערים, קרנות, כרטיסים",
      "גישה לנתונים מ-1990 עד היום",
      "צ'אט AI אישי",
      "התראות לפני משחקים",
      "גישה לטבלת הדירוג",
    ],
    locked: [
      "תחרויות פרטיות",
      "תמיכה מועדפת",
    ],
    cta: "התחל 14 יום בחינם",
    highlight: true,
  },
  {
    id: "champion",
    name: "אלוף",
    price: "₪79",
    period: "לחודש",
    badge: "פרימיום",
    icon: Crown,
    color: "#D4A000",
    borderColor: "rgba(212,160,0,0.50)",
    bgColor: "rgba(212,160,0,0.07)",
    iconBgColor: "rgba(212,160,0,0.15)",
    features: [
      "הכל מתוכנית פרו",
      "תחרויות פרטיות עם פרסים",
      "פרופיל מוגבר בלידרבורד",
      "ניתוח מעמיק לכל קבוצה",
      "תמיכה מועדפת 24/7",
      "גישה מוקדמת לפיצ'רים חדשים",
      "בונוס נקודות x2 על חיזויים נכונים",
    ],
    locked: [],
    cta: "הצטרף לאליטה",
    highlight: false,
  },
];

const FAQ = [
  {
    q: "האם אפשר לבטל בכל עת?",
    a: "כן, ניתן לבטל את המנוי בכל עת ללא עמלת ביטול.",
  },
  {
    q: "האם יש תקופת ניסיון?",
    a: "תוכנית פרו כוללת 14 יום ניסיון חינם ללא צורך בכרטיס אשראי.",
  },
  {
    q: "מה קורה לנתונים שלי אם אבטל?",
    a: "כל החיזויים וההיסטוריה שלך נשמרים גם לאחר ביטול המנוי.",
  },
  {
    q: "האם יש הנחה לתשלום שנתי?",
    a: "כן, תשלום שנתי מזכה בחודשיים חינם (16% חיסכון).",
  },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const createCheckout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err) => { toast.error(err.message || "שגיאה ביצירת התשלום"); },
  });

  // Surface the outcome of a returning Stripe Checkout redirect, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("checkout");
    if (outcome === "success") toast.success("התשלום הושלם! המנוי שלך פעיל 🎉");
    else if (outcome === "cancel") toast("התשלום בוטל");
    if (outcome) window.history.replaceState({}, "", "/pricing");
  }, []);

  function handleSelectPlan(planId: string) {
    if (planId === "free") {
      navigate(isAuthenticated ? "/" : "/login");
      return;
    }
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    createCheckout.mutate({ plan: planId as "pro" | "champion", interval: "month" });
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navigation />
      {/* Header */}
      <div className="relative overflow-hidden py-20 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(31,107,255,0.12), transparent)" }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 border"
            style={{ background: "rgba(31,107,255,0.10)", borderColor: "rgba(31,107,255,0.25)", color: "#1F6BFF" }}>
            <Trophy className="w-3 h-3" /> תוכניות ומחירים
          </div>
          <h1 className="text-4xl font-black text-foreground mb-3">בחר את התוכנית שלך</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            מממנו חיזויים חינם ועד לניתוח מתקדם עם AI — יש לנו תוכנית לכל מנחש
          </p>
        </motion.div>
      </div>

      {/* Plans grid */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 border flex flex-col ${plan.highlight ? "shadow-xl" : ""}`}
                style={{
                  background: plan.bgColor,
                  borderColor: plan.borderColor,
                  ...(plan.highlight ? { boxShadow: `0 0 0 2px ${plan.color}` } : {}),
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-black text-white"
                      style={{ background: plan.color }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: plan.iconBgColor, border: `1px solid ${plan.borderColor}` }}>
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <div>
                    <p className="font-black text-foreground text-lg">{plan.name}</p>
                    {plan.price ? (
                      <p className="text-sm text-muted-foreground">
                        <span className="text-2xl font-black text-foreground">{plan.price}</span> {plan.period}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">לתמיד</p>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                  {plan.locked.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/40 line-through">
                      <Shield className="w-4 h-4 shrink-0 mt-0.5 opacity-30" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={createCheckout.isPending}
                  className="w-full font-bold"
                  variant={plan.highlight ? "accent" : "outline"}
                  style={plan.highlight ? {} : { borderColor: plan.borderColor, color: plan.color }}
                >
                  {createCheckout.isPending && createCheckout.variables?.plan === plan.id && (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  )}
                  {plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          כל המחירים כוללים מע"מ · ניתן לבטל בכל עת · תשלום שנתי = 2 חודשים מתנה
        </p>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-foreground text-center mb-8">שאלות נפוצות</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl border border-border/30 bg-muted/5">
                <p className="font-bold text-foreground mb-2">{q}</p>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center p-8 rounded-2xl border"
          style={{ background: "rgba(31,107,255,0.07)", borderColor: "rgba(31,107,255,0.20)" }}
        >
          <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: "#1F6BFF" }} />
          <h3 className="text-xl font-black text-foreground mb-2">מוכן להתחיל לנצח?</h3>
          <p className="text-muted-foreground text-sm mb-5">הצטרף ל-1,200+ מנחשים שכבר מתחרים בפלטפורמה</p>
          <Button variant="accent" className="font-bold px-8" onClick={() => navigate(isAuthenticated ? "/" : "/login")}>
            צור חשבון בחינם
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
