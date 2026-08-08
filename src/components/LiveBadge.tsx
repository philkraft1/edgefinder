import { eventPhase } from "@/lib/odds/window";

export function LiveBadge({ commenceTime }: { commenceTime: string }) {
  if (eventPhase(commenceTime) !== "live") return null;
  return (
    <span className="animate-steam inline-flex items-center rounded-sm border border-danger/40 bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-danger">
      Live
    </span>
  );
}
