function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`animate-shimmer rounded-2xl bg-slate-200/80 ${className}`}
    />
  );
}

export function MetricSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`metric-skeleton-${index}`}
          className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_18px_45px_rgba(84,106,149,0.10)]"
        >
          <Shimmer className="mb-4 h-4 w-24" />
          <Shimmer className="mb-3 h-9 w-16" />
          <Shimmer className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
      <Shimmer className="h-6 w-40" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`list-skeleton-${index}`}
          className="rounded-3xl border border-slate-100 px-4 py-4"
        >
          <Shimmer className="mb-3 h-4 w-32" />
          <Shimmer className="mb-2 h-5 w-48" />
          <Shimmer className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_18px_45px_rgba(84,106,149,0.10)]">
      <Shimmer className="mb-4 h-6 w-56" />
      <Shimmer className="mb-4 h-4 w-full" />
      <Shimmer className="mb-3 h-12 w-full" />
      <Shimmer className="mb-3 h-12 w-full" />
      <Shimmer className="mb-6 h-24 w-full" />
      <Shimmer className="h-11 w-40" />
    </div>
  );
}
