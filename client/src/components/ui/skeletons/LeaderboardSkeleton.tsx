export function LeaderboardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-border/20"
          style={{ background: "oklch(0.97 0.015 228 / 0.5)" }}
        >
          <div className="w-8 h-8 rounded-full bg-gray-200/50 shrink-0" />
          <div className="w-9 h-9 rounded-full bg-gray-200/40 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-gray-200/50" />
            <div className="h-3 w-16 rounded bg-gray-200/30" />
          </div>
          <div className="h-6 w-12 rounded-full bg-gray-200/40" />
        </div>
      ))}
    </div>
  );
}
