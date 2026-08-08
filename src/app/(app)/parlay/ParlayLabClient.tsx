"use client";

import { useEffect, useMemo, useState } from "react";
import { EdgesTable, type EdgeRow } from "@/components/EdgesTable";
import { ParlayCard, type ParlayView } from "@/components/ParlayCard";
import { SourceBadge } from "@/components/SourceBadge";
import { loadSettings } from "@/lib/settings";
import { formatAmerican, formatPercent } from "@/lib/odds/convert";

interface Props {
  initialEdges: EdgeRow[];
  initialParlays: ParlayView[];
  source: string;
  fetchedAt: string;
}

export function ParlayLabClient({
  initialEdges,
  initialParlays,
  source,
  fetchedAt,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manual, setManual] = useState<ParlayView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const settings = useMemo(() => loadSettings(), []);

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
            Auto-suggested tickets plus a manual builder from top edges.
          </p>
        </div>
        <SourceBadge source={source} fetchedAt={fetchedAt} />
      </div>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
          Auto suggestions
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {initialParlays.map((parlay, i) => (
            <ParlayCard key={parlay.id} parlay={parlay} rank={i + 1} />
          ))}
          {!initialParlays.length ? (
            <p className="text-muted">No positive-EV parlays in the pool.</p>
          ) : null}
        </div>
      </section>

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

        <EdgesTable
          edges={initialEdges.slice(0, 20)}
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
                  Your ticket
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
