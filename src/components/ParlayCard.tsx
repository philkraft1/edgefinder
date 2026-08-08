import { formatAmerican, formatPercent } from "@/lib/odds/convert";
import { LiveBadge } from "@/components/LiveBadge";

export interface ParlayView {
  id: string;
  book?: string;
  bookTitle?: string;
  legs: {
    selection: string;
    point?: number;
    market: string;
    book: string;
    price: number;
    homeTeam: string;
    awayTeam: string;
    commenceTime?: string;
  }[];
  combinedAmerican: number;
  evPercent: number;
  correlationFlags: string[];
  kellyStake: number;
  score: number;
}

export function ParlayCard({
  parlay,
  rank,
}: {
  parlay: ParlayView;
  rank: number;
}) {
  const bookLabel = parlay.bookTitle ?? parlay.legs[0]?.book ?? "Ticket";

  return (
    <article className="animate-rise rounded-xl border border-line bg-panel/70 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {bookLabel} ticket · #{rank}
          </div>
          <div className="mt-1 font-[family-name:var(--font-display)] text-2xl text-accent">
            {formatAmerican(parlay.combinedAmerican)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-positive">
            EV +{formatPercent(parlay.evPercent / 100)}
          </div>
          <div className="text-xs text-muted">
            Kelly ${parlay.kellyStake.toFixed(2)}
          </div>
        </div>
      </div>

      <ol className="space-y-2">
        {parlay.legs.map((leg, i) => {
          const point =
            leg.point !== undefined
              ? ` ${leg.point > 0 ? "+" : ""}${leg.point}`
              : "";
          return (
            <li
              key={`${parlay.id}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line/80 bg-elevated/60 px-3 py-2 text-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  {leg.selection}
                  {point}
                  {leg.commenceTime ? (
                    <LiveBadge commenceTime={leg.commenceTime} />
                  ) : null}
                </div>
                <div className="text-xs text-muted">
                  {leg.awayTeam} @ {leg.homeTeam} · {leg.book}
                </div>
              </div>
              <div className="font-mono tabular text-accent">
                {formatAmerican(leg.price)}
              </div>
            </li>
          );
        })}
      </ol>

      {parlay.correlationFlags.length > 0 ? (
        <div className="mt-3 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
          {parlay.correlationFlags.join(" · ")}
        </div>
      ) : (
        <div className="mt-3 text-xs text-info">Same-book · low correlation flags</div>
      )}
    </article>
  );
}
