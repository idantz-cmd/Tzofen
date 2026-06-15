import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Target, X, UserPlus, LogIn } from "lucide-react";

// ── Queued prediction stored in localStorage across the redirect ──────────────

const QUEUE_KEY = "tzofen_queued_prediction";
const QUEUE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface QueuedPrediction {
  matchId: number;
  prediction: "home" | "draw" | "away";
  homeTeam: string;
  awayTeam: string;
  queuedAt: number;
}

export function saveQueuedPrediction(p: Omit<QueuedPrediction, "queuedAt">): void {
  localStorage.setItem(
    QUEUE_KEY,
    JSON.stringify({ ...p, queuedAt: Date.now() }),
  );
}

export function popQueuedPrediction(): QueuedPrediction | null {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as QueuedPrediction;
    if (Date.now() - p.queuedAt > QUEUE_TTL_MS) {
      localStorage.removeItem(QUEUE_KEY);
      return null;
    }
    localStorage.removeItem(QUEUE_KEY);
    return p;
  } catch {
    localStorage.removeItem(QUEUE_KEY);
    return null;
  }
}

// ── Modal component ───────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGuestContinue?: () => void;
  queued: Omit<QueuedPrediction, "queuedAt"> | null;
}

export function ConversionModal({ isOpen, onClose, onGuestContinue, queued }: Props) {
  // Prevent scroll behind modal
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const predictionLabel =
    queued?.prediction === "home"
      ? `${queued.homeTeam} מנצחת`
      : queued?.prediction === "away"
        ? `${queued.awayTeam} מנצחת`
        : "תיקו";

  function handleAuth(path: "/login" | "/register") {
    if (queued) saveQueuedPrediction(queued);
    window.location.href = path;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl border-t border-border/40 pb-safe"
            style={{ background: "#FFFFFF" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            dir="rtl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/50" />
            </div>

            <div className="px-6 pt-4 pb-8">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Prediction preview */}
              {queued && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5 border border-border/30"
                  style={{ background: "rgba(31,107,255,0.12)" }}
                >
                  <Target
                    className="w-4 h-4 shrink-0"
                    style={{ color: "#1F6BFF" }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {queued.homeTeam} נגד {queued.awayTeam}
                    </p>
                    <p
                      className="text-sm font-bold truncate"
                      style={{ color: "#1F6BFF" }}
                    >
                      הניחוש שלך: {predictionLabel}
                    </p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <h2 className="text-xl font-black mb-1">
                שמור את הניחוש שלך
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                צור חשבון בחינם כדי לנעול את הניחוש, לצבור נקודות ולעלות בדירוג.
              </p>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 font-bold text-base btn-3d btn-accent-3d gap-2"
                  onClick={() => handleAuth("/register")}
                >
                  <UserPlus className="w-5 h-5" />
                  צור חשבון בחינם
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 font-bold gap-2 border-border/40"
                  onClick={() => handleAuth("/login")}
                >
                  <LogIn className="w-5 h-5" />
                  כניסה לחשבון קיים
                </Button>
                <button
                  onClick={onGuestContinue ?? onClose}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  המשך כאורח
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
