import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Bell, X, Check } from "lucide-react";

const tabs = [
  { icon: "📅", label: "משחקים", path: "/matches" },
  { icon: "🏆", label: "גביע", path: "/cup" },
  { icon: "🏠", label: "בית", path: "/" },
  { icon: "📊", label: "פרופיל", path: "/dashboard" },
  { icon: "🧠", label: "ניבוי AI", path: "/ai-prediction" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const { data: notifs = [], refetch } = trpc.streaks.getNotifications.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const markRead = trpc.streaks.markNotificationRead.useMutation({ onSuccess: () => refetch() });
  const markAll = trpc.streaks.markAllRead.useMutation({ onSuccess: () => refetch() });

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <>
      <nav
        className="flex items-center justify-around px-2 py-1 border-t border-border/30"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
        }}
        aria-label="ניווט תחתי"
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          if (tab.path === "/dashboard" && !isAuthenticated) return null;

          return (
            <Link key={tab.path} href={tab.path} aria-label={tab.label}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] min-w-[44px] justify-center rounded-xl cursor-pointer transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span
                  className="text-[10px] font-bold leading-none"
                  style={{ color: active ? "#1F6BFF" : undefined }}
                >
                  {tab.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ background: "#1F6BFF" }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Notification bell — only for authenticated users */}
        {isAuthenticated && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDrawerOpen(true)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 min-h-[44px] min-w-[44px] justify-center rounded-xl cursor-pointer text-muted-foreground"
            aria-label="התראות"
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none">התראות</span>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-0.5"
                style={{ background: "#FF3B5C" }}
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </motion.button>
        )}
      </nav>

      {/* Notifications drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl border-t border-border/40 max-h-[70vh] flex flex-col"
              style={{ background: "#FFFFFF" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              dir="rtl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border/50" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-base">התראות</h2>
                  {unread > 0 && (
                    <span className="text-xs text-muted-foreground">({unread} לא נקראו)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unread > 0 && (
                    <button
                      onClick={() => markAll.mutate()}
                      className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      סמן הכל
                    </button>
                  )}
                  <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 px-4 py-2">
                {notifs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>אין התראות עדיין</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-4">
                    {notifs.map((n) => (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                          n.read
                            ? "border-border/15 bg-muted/5"
                            : "border-primary/20 bg-primary/5"
                        }`}
                        onClick={() => !n.read && markRead.mutate({ id: n.id })}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-bold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                              {n.title}
                            </p>
                            {n.content && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.content}</p>
                            )}
                          </div>
                          {!n.read && (
                            <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: "#1F6BFF" }} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
