import { Suspense } from "react";
import { ParlayLabClient } from "./ParlayLabClient";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import {
  buildSinglesPortfolio,
  suggestParlaysByBook,
} from "@/lib/edge/parlay";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { parseTimeWindow } from "@/lib/odds/window";
import type { BookKey } from "@/lib/odds/types";

export const dynamic = "force-dynamic";

export default async function ParlayPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; book?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const window = parseTimeWindow(params.window ?? DEFAULT_SETTINGS.timeWindow);
  const book =
    params.book && params.book !== "any"
      ? (params.book as BookKey)
      : ("any" as const);
  const mode = params.mode === "singles" ? "singles" : "sameBook";

  const bundle = await loadOddsBundle({
    sports: DEFAULT_SETTINGS.sports,
    window,
  });
  const edges = rankEdges(bundle.events, 0.5, { book });
  const parlays =
    mode === "sameBook"
      ? suggestParlaysByBook(edges, {
          maxLegs: DEFAULT_SETTINGS.maxParlayLegs,
          bankroll: DEFAULT_SETTINGS.bankroll,
          kellyFraction: DEFAULT_SETTINGS.kellyFraction,
          limit: 6,
          book,
        })
      : [];
  const portfolio =
    mode === "singles"
      ? buildSinglesPortfolio(edges, {
          bankroll: DEFAULT_SETTINGS.bankroll,
          kellyFraction: DEFAULT_SETTINGS.kellyFraction,
          book,
          limit: 10,
        })
      : null;

  return (
    <Suspense fallback={<div className="text-muted">Loading Parlay Lab…</div>}>
      <ParlayLabClient
        source={bundle.source}
        fetchedAt={bundle.fetchedAt}
        initialEdges={edges}
        initialParlays={parlays}
        initialPortfolio={portfolio?.items ?? null}
        mode={mode}
      />
    </Suspense>
  );
}
