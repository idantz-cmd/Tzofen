export function MatchCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/20 overflow-hidden animate-pulse"
          style={{ background: "rgba(248,250,255,0.6)" }}
        >
          <div className="h-1 bg-gray-200/40" />
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-20 rounded-full bg-gray-200/50" />
              <div className="h-4 w-28 rounded bg-gray-200/40" />
            </div>
            {/* Teams */}
            <div className="grid grid-cols-3 items-center gap-2 mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-200/50" />
                <div className="h-3 w-20 rounded bg-gray-200/40" />
              </div>
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-gray-200/40" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-200/50" />
                <div className="h-3 w-20 rounded bg-gray-200/40" />
              </div>
            </div>
            {/* Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <div className="h-11 rounded-lg bg-gray-200/40" />
              <div className="h-11 rounded-lg bg-gray-200/40" />
              <div className="h-11 rounded-lg bg-gray-200/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
