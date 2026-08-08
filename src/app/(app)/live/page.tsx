import { Suspense } from "react";
import Link from "next/link";
import { SourceBadge } from "@/components/SourceBadge";
import { StatPill } from "@/components/StatPill";
import { DeskControls } from "@/components/DeskControls";
import { EdgesTable } from "@/components/EdgesTable";
import { ParlayCard } from "@/components/ParlayCard";
import { LiveBadge } from "@/components/LiveBadge";
import { formatAmerican, formatPercent } from "@/lib/odds/convert";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import { suggestParlaysByBook } from "@/lib/edge/parlay";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { parseTimeWindow } from "@/lib/odds/window";
import type { BookKey } from "@/lib/odds/types";

export const dynamic = "force-dynamic";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; window?: string }>;
}) {
  const params = await searchParams;
  const book =
    params.book && params.book !== "any"
      ? (params.book as BookKey)
      : ("any" as const);
  // Default hard-locked to live; toggle can widen to soon/all from this page
  const window = parseTimeWindow(params.window ?? "live");

  const bundle = await loadOddsBundle({
    sports: DEFAULT_SETTINGS.sports,
    window,
  });
  const edges = rankEdges(bundle.events, DEFAULT_SETTINGS.minEvPercent, {
    book,
  });
  const parlays = suggestParlaysByBook(edges, {
    maxLegs: DEFAULT_SETTINGS.maxParlayLegs,
    bankroll: DEFAULT_SETTINGS.bankroll,
    kellyFraction: DEFAULT_SETTINGS.kellyFraction,
    limit: 4,
    book,
  });
  const top = edges[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="animate-steam inline-flex items-center rounded-sm border border-danger/40 bg-danger/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-danger">
              Live
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted">
              In-play only
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Live desk
          </h1>
          <p className="mt-1 text-muted">
            Games already started — edges and same-book parlays updating now.
          </p>
        </div>
        <SourceBadge source={bundle.source} fetchedAt={bundle.fetchedAt} />
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <DeskControls />
      </Suspense>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Live events" value={String(bundle.events.length)} />
        <StatPill
          label="+EV live"
          value={String(edges.length)}
          tone="positive"
        />
        <StatPill
          label="Same-book parlays"
          value={String(parlays.length)}
          tone="accent"
        />
      </section>

      <section className="animate-rise rounded-xl border border-line bg-panel/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Best live single
          </h2>
          <Link
            href="/edges?window=live"
            className="text-sm text-accent hover:underline"
          >
            Full live board
          </Link>
        </div>
        {top ? (
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {top.sportTitle}
              <LiveBadge commenceTime={top.commenceTime} />
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {top.awayTeam} @ {top.homeTeam}
            </div>
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  Selection
                </div>
                <div className="mt-1 text-lg">
                  {top.selection}
                  {top.point !== undefined
                    ? ` ${top.point > 0 ? "+" : ""}${top.point}`
                    : ""}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  Book
                </div>
                <div className="mt-1 font-mono text-lg text-accent">
                  {top.bookTitle} {formatAmerican(top.price)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  EV
                </div>
                <div className="mt-1 font-mono text-lg text-positive">
                  +{formatPercent(top.evPercent / 100)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted">
            No in-play +EV edges right now. Check Soon for games tipping off
            shortly.
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Live same-book parlays
          </h2>
          <Link
            href="/parlay?window=live&mode=sameBook"
            className="text-sm text-accent hover:underline"
          >
            Parlay Lab
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {parlays.map((parlay, i) => (
            <ParlayCard key={parlay.id} parlay={parlay} rank={i + 1} />
          ))}
          {!parlays.length ? (
            <p className="text-muted">No same-book live parlays available.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
          Live edges
        </h2>
        <EdgesTable edges={edges.slice(0, 25)} />
      </section>
    </div>
  );
}
