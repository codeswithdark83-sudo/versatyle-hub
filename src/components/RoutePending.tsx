/** Lightweight placeholder shown while a page's data is loading (after a short delay). */
export function RoutePending() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-16 md:py-24" aria-busy="true" aria-live="polite">
      <div className="h-3 w-40 bg-muted animate-pulse" />
      <div className="mt-5 h-12 w-72 max-w-full bg-muted animate-pulse" />
      <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="aspect-[3/4] bg-muted animate-pulse" />
            <div className="mt-4 h-4 w-3/4 bg-muted animate-pulse" />
            <div className="mt-2 h-4 w-1/3 bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
