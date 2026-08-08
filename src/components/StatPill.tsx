export function StatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "danger" | "accent";
}) {
  const toneClass =
    tone === "positive"
      ? "text-positive"
      : tone === "danger"
        ? "text-danger"
        : tone === "accent"
          ? "text-accent"
          : "text-foreground";

  return (
    <div className="rounded-lg border border-line bg-panel/80 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
        {label}
      </div>
      <div className={`mt-1 font-mono text-lg tabular ${toneClass}`}>{value}</div>
    </div>
  );
}
