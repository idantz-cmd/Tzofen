import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "sonner";

export function PWAPrompts() {
  const { canInstall, updateAvailable, isOffline, install, dismissUpdate } = usePWA();

  // Offline banner via toast
  useEffect(() => {
    if (isOffline) {
      toast.warning("אין חיבור לאינטרנט", {
        id: "offline-toast",
        duration: Infinity,
        icon: <WifiOff className="w-4 h-4" />,
        description: "חלק מהתכנים עשויים להיות לא זמינים",
      });
    } else {
      toast.dismiss("offline-toast");
    }
  }, [isOffline]);

  return (
    <>
      {/* Update available banner */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed top-0 inset-x-0 z-[60] safe-top"
            dir="rtl"
          >
            <div
              className="mx-3 mt-3 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg"
              style={{ background: "oklch(0.55 0.110 232)", color: "white" }}
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">עדכון זמין</p>
                <p className="text-xs opacity-80">טען מחדש כדי לקבל את הגרסה החדשה</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="shrink-0 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 transition-colors"
              >
                עדכן
              </button>
              <button onClick={dismissUpdate} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install prompt banner */}
      <AnimatePresence>
        {canInstall && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36, delay: 3 }}
            className="fixed bottom-20 inset-x-0 z-[55] px-4"
            dir="rtl"
          >
            <div
              className="rounded-2xl p-4 flex items-center gap-3 shadow-xl border border-border/20"
              style={{ background: "oklch(0.16 0.055 258)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.50 0.165 240 / 0.15)" }}
              >
                <Download className="w-5 h-5" style={{ color: "oklch(0.72 0.190 230)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">התקן את GetWinIL</p>
                <p className="text-xs text-muted-foreground mt-0.5">גישה מהירה, תמיכה בלא-אינטרנט</p>
              </div>
              <button
                onClick={async () => await install()}
                className="shrink-0 text-xs font-bold rounded-xl px-3 py-2 transition-colors"
                style={{ background: "oklch(0.50 0.165 240)", color: "white" }}
              >
                התקן
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
