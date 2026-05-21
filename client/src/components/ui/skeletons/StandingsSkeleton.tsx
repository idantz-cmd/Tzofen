export function StandingsSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200/40 mb-4" />
      <div className="rounded-xl border border-border/20 overflow-hidden">
        <div className="h-10 bg-gray-200/30 border-b border-border/10" />
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b border-border/10 last:border-0"
          >
            <div className="w-6 h-4 rounded bg-gray-200/40 shrink-0" />
            <div className="w-8 h-8 rounded-full bg-gray-200/40 shrink-0" />
            <div className="flex-1 h-3.5 rounded bg-gray-200/50" />
            <div className="w-6 h-4 rounded bg-gray-200/30" />
            <div className="w-6 h-4 rounded bg-gray-200/30" />
            <div className="w-6 h-4 rounded bg-gray-200/30" />
            <div className="w-6 h-4 rounded bg-gray-200/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
