"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EdgesTable, type EdgeRow } from "@/components/EdgesTable";
import { ParlayCard, type ParlayView } from "@/components/ParlayCard";
import { SourceBadge } from "@/components/SourceBadge";
import { DeskControls } from "@/components/DeskControls";
import { LiveBadge } from "@/components/LiveBadge";
import { loadSettings } from "@/lib/settings";
import { formatAmerican, formatPercent } from "@/lib/odds/convert";
import { useSearchParams } from "next/navigation";

interface PortfolioItem {
  edgeId: string;
  matchup: string;
  selection: string;
  point?: number;
  bookTitle: string;
  price: number;
  evPercent: number;
  kellyStake: number;
  commenceTime: string;
  sportTitle: string;
}

interface Props {
  initialEdges: EdgeRow[];
  initialParlays: ParlayView[];
  initialPortfolio: PortfolioItem[] | null;
  source: string;
  fetchedAt: string;
  mode: "sameBook" | "singles";
}

export function ParlayLabClient({
  initialEdges,
  initialParlays,
  initialPortfolio,
  source,
  fetchedAt,
  mode: initialMode,
}: Props) {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manual, setManual] = useState<ParlayView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [edges, setEdges] = useState(initialEdges);
  const [parlays, setParlays] = useState(initialParlays);
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [mode, setMode] = useState(initialMode);
  const [meta, setMeta] = useState({ source, fetchedAt });

  const settings = useMemo(() => loadSettings(), []);

  const refresh = useCallback(async () => {
    const window = searchParams.get("window") ?? settings.timeWindow;
    const book = searchParams.get("book") ?? settings.preferredBook;
    const ticketMode =
      searchParams.get("mode") ?? settings.ticketMode ?? "sameBook";
    const qs = new URLSearchParams({
      window,
      mode: ticketMode,
      bankroll: String(settings.bankroll),
      kellyFraction: String(settings.kellyFraction),
      maxLegs: String(settings.maxParlayLegs),
    });
    if (book && book !== "any") qs.set("book", book);

    const [edgesRes, parlaysRes] = await Promise.all([
      fetch(`/api/edges?${qs}&minEv=0.5`),
      fetch(`/api/parlays?${qs}`),
    ]);
    const edgesData = await edgesRes.json();
    const parlaysData = await parlaysRes.json();
    setEdges(edgesData.edges ?? []);
    setParlays(parlaysData.parlays ?? []);
    setPortfolio(parlaysData.portfolio?.items ?? null);
    setMode(parlaysData.mode === "singles" ? "singles" : "sameBook");
    setMeta({
      source: parlaysData.source ?? edgesData.source,
      fetchedAt: parlaysData.fetchedAt ?? edgesData.fetchedAt,
    });
  }, [searchParams, settings]);

  useEffect(() => {
    setEdges(initialEdges);
    setParlays(initialParlays);
    setPortfolio(initialPortfolio);
    setMode(initialMode);
    setMeta({ source, fetchedAt });
  }, [initialEdges, initialParlays, initialPortfolio, initialMode, source, fetchedAt]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const window = searchParams.get("window") ?? settings.timeWindow;
    if (window !== "live" && window !== "soon") return;
    const id = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(id);
  }, [searchParams, settings.timeWindow, refresh]);

  useEffect(() => {
    setManual(null);
    setError(null);
  }, [selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function buildManual() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parlays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edgeIds: [...selected],
          bankroll: settings.bankroll,
          kellyFraction: settings.kellyFraction,
          sports: settings.sports,
          window: searchParams.get("window") ?? settings.timeWindow,
          book: searchParams.get("book") ?? settings.preferredBook,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not build parlay");
        setManual(null);
        return;
      }
      setManual(data.parlay);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Parlay Lab
          </h1>
          <p className="mt-1 text-muted">
            Same-book parlays you can actually ticket — or a multi-book singles
            portfolio.
          </p>
        </div>
        <SourceBadge source={meta.source} fetchedAt={meta.fetchedAt} />
      </div>

      <DeskControls showTicketMode />

      {mode === "singles" ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Singles portfolio
          </h2>
          <p className="text-sm text-warn">
            Bet each leg at its listed book — not one combined parlay.
          </p>
          <div className="overflow-x-auto rounded-xl border border-line bg-panel/50">
            <table className="min-w-full text-sm">
              <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-3 py-3 text-left">Matchup</th>
                  <th className="px-3 py-3 text-left">Selection</th>
                  <th className="px-3 py-3 text-left">Book</th>
                  <th className="px-3 py-3 text-left">Price</th>
                  <th className="px-3 py-3 text-left">EV</th>
                  <th className="px-3 py-3 text-left">Kelly</th>
                </tr>
              </thead>
              <tbody>
                {(portfolio ?? []).map((item) => (
                  <tr key={item.edgeId} className="border-b border-line/70">
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.matchup}
                        <LiveBadge commenceTime={item.commenceTime} />
                      </div>
                      <div className="text-xs text-muted">{item.sportTitle}</div>
                    </td>
                    <td className="px-3 py-3">
                      {item.selection}
                      {item.point !== undefined
                        ? ` ${item.point > 0 ? "+" : ""}${item.point}`
                        : ""}
                    </td>
                    <td className="px-3 py-3">{item.bookTitle}</td>
                    <td className="px-3 py-3 font-mono text-accent">
                      {formatAmerican(item.price)}
                    </td>
                    <td className="px-3 py-3 font-mono text-positive">
                      +{formatPercent(item.evPercent / 100)}
                    </td>
                    <td className="px-3 py-3 font-mono">
                      ${item.kellyStake.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!portfolio?.length ? (
            <p className="text-muted">No +EV singles in this window.</p>
          ) : null}
        </section>
      ) : (
        <section>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
            Same-book suggestions
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {parlays.map((parlay, i) => (
              <ParlayCard key={parlay.id} parlay={parlay} rank={i + 1} />
            ))}
            {!parlays.length ? (
              <p className="text-muted">
                No positive-EV same-book parlays in this window.
              </p>
            ) : null}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Build your own
          </h2>
          <button
            type="button"
            onClick={buildManual}
            disabled={selected.size < 2 || loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#10140f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Scoring…" : `Score ${selected.size} legs`}
          </button>
        </div>
        <p className="text-xs text-muted">
          Tip: pick legs from the same book for a real ticket. Mixing books
          shows a warning.
        </p>

        <EdgesTable
          edges={edges.slice(0, 20)}
          selectable
          selectedIds={selected}
          onToggle={toggle}
        />

        {error ? (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {manual ? (
          <div className="animate-rise rounded-xl border border-accent/30 bg-panel/70 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  {manual.bookTitle ?? "Your"} ticket
                </div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-accent">
                  {formatAmerican(manual.combinedAmerican)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-positive">
                  EV +{formatPercent(manual.evPercent / 100)}
                </div>
                <div className="text-sm text-muted">
                  Suggested stake ${manual.kellyStake.toFixed(2)}
                </div>
              </div>
            </div>
            {manual.correlationFlags.length > 0 ? (
              <div className="mt-3 text-sm text-warn">
                {manual.correlationFlags.join(" · ")}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
