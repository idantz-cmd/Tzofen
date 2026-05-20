import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentLoadingAnimationProps {
  agentType: string;
  agentIcon?: string;
  agentName?: string;
  isLoading: boolean;
}

const ANALYSIS_STEPS: Record<string, string[]> = {
  statistics: [
    "מאסף נתונים סטטיסטיים...",
    "מנתח ביצועי קבוצות...",
    "מחשב הסתברויות...",
    "מכין דוח מקצועי...",
  ],
  research: [
    "מחפש מידע בליגה הישראלית...",
    "סורק עדכונים אחרונים...",
    "מאמת נתונים...",
    "מרכז ממצאים...",
  ],
  prediction: [
    "מנתח פורמת קבוצות...",
    "בודק היסטוריית עימותים...",
    "מחשב סיכויים...",
    "מגבש חיזוי...",
  ],
  tactical: [
    "מנתח מערכי משחק...",
    "בודק חוזקות וחולשות...",
    "מעריך שחקני מפתח...",
    "מכין ניתוח טקטי...",
  ],
  all: [
    "מפעיל ניתוח מקיף...",
    "עיבוד נתונים סטטיסטיים...",
    "מחקר ליגה פעיל...",
    "חישוב הסתברויות...",
    "ניתוח טקטי...",
    "מרכז תוצאות...",
  ],
};

export default function AgentLoadingAnimation({
  agentType,
  agentIcon,
  agentName,
  isLoading,
}: AgentLoadingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ANALYSIS_STEPS[agentType] || ANALYSIS_STEPS.prediction;

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isLoading, steps.length]);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex justify-start"
      >
        <motion.div
          className="relative bg-card border border-border/30 rounded-lg px-5 py-4 max-w-sm overflow-hidden"
          animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0.0)", "0 0 10px rgba(16,185,129,0.12)", "0 0 0px rgba(16,185,129,0.0)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.03) 50%, transparent 100%)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Header */}
          <div className="relative flex items-center gap-2 mb-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-bold text-emerald-400">
              {agentName || "מנתח נתונים"}
            </span>
          </div>

          {/* Skeleton shimmer rows */}
          <div className="relative space-y-2 mb-3">
            {[0.75, 0.5, 0.85].map((width, i) => (
              <motion.div
                key={i}
                className="h-2 bg-muted/40 rounded-full overflow-hidden"
                style={{ width: `${width * 100}%` }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
              >
                <motion.div
                  className="h-full w-1/2 rounded-full"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.15), transparent)" }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                />
              </motion.div>
            ))}
          </div>

          {/* Animated Dots */}
          <div className="relative flex items-center gap-1.5 mb-3">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay }}
              />
            ))}
          </div>

          {/* Status Message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative text-sm text-muted-foreground font-medium"
            >
              {steps[currentStep]}
            </motion.p>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="relative mt-3 h-1 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-emerald-500 to-emerald-500/40 rounded-full"
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Step Indicators */}
          <div className="relative flex gap-1 mt-2">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                  index <= currentStep ? "bg-emerald-500" : "bg-muted/30"
                }`}
                animate={
                  index === currentStep
                    ? { opacity: [0.5, 1, 0.5] }
                    : { opacity: 1 }
                }
                transition={
                  index === currentStep
                    ? { duration: 1, repeat: Infinity }
                    : { duration: 0.3 }
                }
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
