import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ rotate: 180, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-colors"
      title={theme === "dark" ? "מצב יום" : "מצב לילה"}
      aria-label={theme === "dark" ? "מצב יום" : "מצב לילה"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </motion.button>
  );
}
