export function SourceBadge({
  source,
  fetchedAt,
}: {
  source: "live" | "mock" | string;
  fetchedAt?: string;
}) {
  const live = source === "live";
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
          live
            ? "border-positive/40 bg-positive/10 text-positive"
            : "border-warn/40 bg-warn/10 text-warn"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${live ? "bg-positive" : "bg-warn"}`}
        />
        {live ? "Live Odds API" : "Mock feed"}
      </span>
      {fetchedAt ? (
        <span className="tabular">
          Updated {new Date(fetchedAt).toLocaleTimeString()}
        </span>
      ) : null}
    </div>
  );
}
