import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Newspaper, ExternalLink, Clock, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

type Source = "all" | "Sport5" | "ONE" | "Walla" | "Mako";

const SOURCE_TABS: { id: Source; label: string; color: string }[] = [
  { id: "all",    label: "הכל",    color: "#0038A8" },
  { id: "Sport5", label: "Sport5", color: "#e0252c" },
  { id: "ONE",    label: "ONE",    color: "#f47c00" },
  { id: "Walla",  label: "Walla",  color: "#9b1fa8" },
  { id: "Mako",   label: "Mako",   color: "#00a651" },
];

function SourceBadge({ source }: { source: Source }) {
  const tab = SOURCE_TABS.find((t) => t.id === source);
  if (!tab || source === "all") return null;
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wide"
      style={{ background: tab.color }}
    >
      {tab.label}
    </span>
  );
}

function NewsCardSkeleton() {
  return (
    <div className="card-glass rounded-xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-24 h-16 bg-muted/60 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted/60 rounded w-3/4" />
          <div className="h-3 bg-muted/60 rounded w-full" />
          <div className="h-3 bg-muted/60 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function News() {
  const [source, setSource] = useState<Source>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, isError, refetch } = trpc.news.getNews.useQuery(
    { source, limit: 40 },
    { refetchInterval: 5 * 60 * 1000 }
  );

  const refreshMut = trpc.news.refresh.useMutation({
    onSuccess: () => { setRefreshKey((k) => k + 1); refetch(); },
  });

  const isRefreshing = refreshMut.isPending;

  return (
    <div className="min-h-screen" dir="rtl">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-gradient-blue flex items-center gap-2">
              <Newspaper className="w-6 h-6" style={{ color: "oklch(0.55 0.165 240)" }} />
              חדשות כדורגל ישראלי
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sport5 · ONE · Walla · Mako — בזמן אמת
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMut.mutate()}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            רענן
          </Button>
        </div>

        {/* Source tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none" dir="ltr">
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSource(tab.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={
                source === tab.id
                  ? { background: tab.color, color: "white", boxShadow: `0 2px 8px ${tab.color}55` }
                  : { background: "oklch(0.96 0.01 240)", color: "oklch(0.40 0.06 240)" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-[11px] text-muted-foreground">
            {data ? `${data.total} כתבות · מתעדכן כל 5 דקות` : "טוען..."}
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="card-glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">שגיאה בטעינת החדשות</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
              נסה שוב
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="card-glass rounded-xl p-10 text-center">
            <Newspaper className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">אין כרגע כתבות ממקור זה</p>
          </div>
        )}

        {/* News cards */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-3" key={`${source}-${refreshKey}`}>
            {data?.items.map((item, i) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.03, duration: 0.22 }}
                className="block card-glass rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-muted"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div
                      className="w-24 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: "oklch(0.94 0.02 240)" }}
                    >
                      <span className="text-2xl">⚽</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <SourceBadge source={item.source as Source} />
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {item.ageLabel}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  {/* External link icon */}
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </motion.a>
            ))}
          </div>
        </AnimatePresence>
      </main>
    </div>
  );
}
