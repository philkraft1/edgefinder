import { SourceBadge } from "@/components/SourceBadge";
import { EdgesTable } from "@/components/EdgesTable";
import { loadOddsBundle } from "@/lib/odds/provider";
import { bestPriceBoard, rankEdges } from "@/lib/edge/ev";
import { formatAmerican } from "@/lib/odds/convert";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function EdgesPage() {
  const bundle = await loadOddsBundle(DEFAULT_SETTINGS.sports);
  const edges = rankEdges(bundle.events, DEFAULT_SETTINGS.minEvPercent);
  const board = bestPriceBoard(bundle.events).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Value finder
          </h1>
          <p className="mt-1 text-muted">
            Singles ranked by expected value after sharp-book de-vig.
          </p>
        </div>
        <SourceBadge source={bundle.source} fetchedAt={bundle.fetchedAt} />
      </div>

      <EdgesTable edges={edges} />

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
          Odds board — best price
        </h2>
        <div className="space-y-4">
          {board.map(({ event, rows }) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-xl border border-line bg-panel/50"
            >
              <div className="border-b border-line px-4 py-3">
                <div className="font-medium">
                  {event.awayTeam} @ {event.homeTeam}
                </div>
                <div className="text-xs text-muted">
                  {event.sportTitle} ·{" "}
                  {new Date(event.commenceTime).toLocaleString()}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Market</th>
                      <th className="px-4 py-2 text-left">Selection</th>
                      <th className="px-4 py-2 text-left">Best</th>
                      <th className="px-4 py-2 text-left">Book</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row, i) => (
                      <tr key={i} className="border-t border-line/70">
                        <td className="px-4 py-2 uppercase text-muted">
                          {row.market}
                        </td>
                        <td className="px-4 py-2">
                          {row.selection}
                          {row.point !== undefined
                            ? ` ${row.point > 0 ? "+" : ""}${row.point}`
                            : ""}
                        </td>
                        <td className="px-4 py-2 font-mono text-accent">
                          {formatAmerican(row.bestPrice)}
                        </td>
                        <td className="px-4 py-2">{row.bestBook}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
