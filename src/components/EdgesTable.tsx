"use client";

import { formatAmerican, formatPercent } from "@/lib/odds/convert";
import { LiveBadge } from "@/components/LiveBadge";

export interface EdgeRow {
  id: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  point?: number;
  bookTitle: string;
  price: number;
  fairAmerican: number;
  evPercent: number;
  edgePercent: number;
}

export function EdgesTable({
  edges,
  selectable,
  selectedIds,
  onToggle,
}: {
  edges: EdgeRow[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
}) {
  if (!edges.length) {
    return (
      <div className="rounded-xl border border-line bg-panel/60 px-4 py-10 text-center text-muted">
        No +EV edges above your threshold. Lower min EV in Settings or wait for
        softer books to drift.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel/50">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
          <tr>
            {selectable ? <th className="px-3 py-3">Pick</th> : null}
            <th className="px-3 py-3">Rank</th>
            <th className="px-3 py-3">Matchup</th>
            <th className="px-3 py-3">Market</th>
            <th className="px-3 py-3">Selection</th>
            <th className="px-3 py-3">Book</th>
            <th className="px-3 py-3">Price</th>
            <th className="px-3 py-3">Fair</th>
            <th className="px-3 py-3">EV</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge, i) => {
            const point =
              edge.point !== undefined
                ? ` ${edge.point > 0 ? "+" : ""}${edge.point}`
                : "";
            const checked = selectedIds?.has(edge.id) ?? false;
            return (
              <tr
                key={edge.id}
                className={`animate-tick border-b border-line/70 transition-colors hover:bg-accent/5 ${
                  checked ? "bg-accent/10" : ""
                }`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                {selectable ? (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle?.(edge.id)}
                      className="accent-[var(--accent)]"
                      aria-label={`Select ${edge.selection}`}
                    />
                  </td>
                ) : null}
                <td className="px-3 py-3 font-mono text-muted">#{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {edge.awayTeam} @ {edge.homeTeam}
                    <LiveBadge commenceTime={edge.commenceTime} />
                  </div>
                  <div className="text-xs text-muted">
                    {edge.sportTitle} ·{" "}
                    {new Date(edge.commenceTime).toLocaleString([], {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="px-3 py-3 uppercase text-muted">{edge.market}</td>
                <td className="px-3 py-3">
                  {edge.selection}
                  {point}
                </td>
                <td className="px-3 py-3">{edge.bookTitle}</td>
                <td className="px-3 py-3 font-mono tabular text-accent">
                  {formatAmerican(edge.price)}
                </td>
                <td className="px-3 py-3 font-mono tabular text-muted">
                  {formatAmerican(edge.fairAmerican)}
                </td>
                <td className="px-3 py-3 font-mono tabular text-positive">
                  +{formatPercent(edge.evPercent / 100)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
