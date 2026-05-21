import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

const tabs = [
  { icon: "📅", label: "משחקים", path: "/matches" },
  { icon: "🏆", label: "דירוג", path: "/leaderboard" },
  { icon: "🏠", label: "בית", path: "/" },
  { icon: "📊", label: "פרופיל", path: "/dashboard" },
  { icon: "🤖", label: "AI", path: "/chat" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => location === path;

  return (
    <nav
      className="flex items-center justify-around px-2 py-1 border-t border-border/30"
      style={{
        background: "oklch(0.99 0.008 228 / 0.95)",
        backdropFilter: "blur(20px) saturate(180%)",
      }}
      aria-label="ניווט תחתי"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        if (tab.path === "/dashboard" && !isAuthenticated) return null;

        return (
          <Link key={tab.path} href={tab.path}>
            <motion.div
              whileTap={{ scale: 0.9 }}
              animate={{ scale: active ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span
                className="text-[10px] font-bold leading-none"
                style={{ color: active ? "oklch(0.50 0.165 240)" : undefined }}
              >
                {tab.label}
              </span>
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: "oklch(0.50 0.165 240)" }}
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
