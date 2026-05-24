import { useRef, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

const SOURCE_COLORS: Record<string, string> = {
  Sport5:   "#e0252c",
  Sport1:   "#0052cc",
  Walla:    "#9b1fa8",
  Ynet:     "#c93a00",
  "הארץ":   "#1a1a1a",
  "כאן":    "#1d5fa8",
  ONE:      "#f47c00",
  "ערוץ 7": "#2e7d2e",
  Mako:     "#007a3d",
};

export function NewsTicker() {
  const { data } = trpc.news.getNews.useQuery(
    { source: "all", limit: 40 },
    { refetchInterval: 5 * 60 * 1000, staleTime: 4 * 60 * 1000 }
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(90);

  const items = data?.items ?? [];

  // Calculate scroll duration based on content width (~100px per second)
  useEffect(() => {
    if (trackRef.current) {
      const w = trackRef.current.scrollWidth / 2; // half because we duplicate
      setDuration(Math.max(40, Math.round(w / 110)));
    }
  }, [items.length]);

  if (items.length === 0) return null;

  // Duplicate for seamless infinite loop
  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        height: 32,
        background: "linear-gradient(90deg, #00195c 0%, #0038A8 40%, #0038A8 60%, #00195c 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
      dir="ltr"
      aria-label="עדכוני חדשות כדורגל ישראלי"
    >
      {/* LIVE badge — left side fade */}
      <div
        className="absolute left-0 top-0 h-full flex items-center gap-1.5 pl-3 pr-6 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, #00195c 65%, transparent 100%)",
        }}
      >
        <span
          className="w-[7px] h-[7px] rounded-full flex-shrink-0"
          style={{
            background: "#f87171",
            boxShadow: "0 0 6px #f87171",
            animation: "ticker-pulse 1.4s ease-in-out infinite",
          }}
        />
        <span
          className="text-[10px] font-black tracking-widest"
          style={{ color: "#fff", opacity: 0.9 }}
        >
          LIVE
        </span>
      </div>

      {/* Right side fade */}
      <div
        className="absolute right-0 top-0 h-full w-10 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, #00195c 50%, transparent 100%)",
        }}
      />

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="ticker-track flex items-center h-full"
        style={{
          animation: `ticker-scroll ${duration}s linear infinite`,
          paddingLeft: 72, // space for LIVE badge
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => (
          <a
            key={`${item.id}-${i}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 whitespace-nowrap group"
          >
            {/* Source badge */}
            <span
              className="text-[9px] font-black px-1.5 py-[2px] rounded-sm tracking-wide flex-shrink-0"
              style={{
                background: SOURCE_COLORS[item.source] ?? "#334155",
                color: "#fff",
                opacity: 0.92,
              }}
            >
              {item.source}
            </span>

            {/* Headline */}
            <span
              className="text-[12px] font-medium group-hover:text-yellow-200 transition-colors duration-150"
              style={{ color: "rgba(255,255,255,0.93)" }}
            >
              {item.title}
            </span>

            {/* Separator */}
            <span
              className="text-[10px] flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              ◆
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
