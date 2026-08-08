import { SourceBadge } from "@/components/SourceBadge";
import { formatAmerican } from "@/lib/odds/convert";
import { loadOddsBundle } from "@/lib/odds/provider";
import { detectSteam } from "@/lib/edge/steam";
import { BOOK_TITLES } from "@/lib/odds/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const bundle = await loadOddsBundle(DEFAULT_SETTINGS.sports);
  const alerts = detectSteam(bundle.snapshots);
  const eventMap = new Map(bundle.events.map((e) => [e.id, e]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Trades
          </h1>
          <p className="mt-1 text-muted">
            Open-to-current movement and sharp-led steam signals.
          </p>
        </div>
        <SourceBadge source={bundle.source} fetchedAt={bundle.fetchedAt} />
      </div>

      <section className="space-y-3">
        {alerts.map((alert, i) => {
          const event = eventMap.get(alert.eventId);
          return (
            <article
              key={alert.id}
              className={`animate-rise rounded-xl border bg-panel/60 p-4 ${
                alert.severity === "steam"
                  ? "animate-steam border-warn/50"
                  : "border-line"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-muted">
                    {alert.severity === "steam"
                      ? "Steam"
                      : alert.severity === "reverse"
                        ? "Reverse / drift"
                        : "Move"}
                    {alert.sharpLed ? " · sharp-led" : ""}
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {event
                      ? `${event.awayTeam} @ ${event.homeTeam}`
                      : alert.eventId}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {alert.selection}
                    {alert.point !== undefined
                      ? ` ${alert.point > 0 ? "+" : ""}${alert.point}`
                      : ""}{" "}
                    · {alert.market}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-muted">
                    {formatAmerican(alert.openPrice)} →{" "}
                    <span className="text-foreground">
                      {formatAmerican(alert.currentPrice)}
                    </span>
                  </div>
                  <div
                    className={
                      alert.move < 0 ? "text-warn" : "text-info"
                    }
                  >
                    {alert.move > 0 ? "+" : ""}
                    {alert.move} pts
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                {alert.booksMoved.map((book) => (
                  <span
                    key={book}
                    className="rounded-full border border-line px-2 py-0.5"
                  >
                    {BOOK_TITLES[book as keyof typeof BOOK_TITLES] ?? book}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
        {!alerts.length ? (
          <p className="text-muted">No material line movement in snapshots.</p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl">
          Snapshot tape
        </h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-panel/40">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-3 py-3">Phase</th>
                <th className="px-3 py-3">Event</th>
                <th className="px-3 py-3">Selection</th>
                <th className="px-3 py-3">Book</th>
                <th className="px-3 py-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {bundle.snapshots.slice(0, 40).map((snap, i) => (
                <tr key={`${snap.eventId}-${snap.book}-${snap.phase}-${i}`} className="border-b border-line/60">
                  <td className="px-3 py-2 uppercase text-muted">{snap.phase}</td>
                  <td className="px-3 py-2 font-mono text-xs">{snap.eventId}</td>
                  <td className="px-3 py-2">
                    {snap.selection}
                    {snap.point !== undefined
                      ? ` ${snap.point > 0 ? "+" : ""}${snap.point}`
                      : ""}
                  </td>
                  <td className="px-3 py-2">
                    {BOOK_TITLES[snap.book] ?? snap.book}
                  </td>
                  <td className="px-3 py-2 font-mono text-accent">
                    {formatAmerican(snap.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
