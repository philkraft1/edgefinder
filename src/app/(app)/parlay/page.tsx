import { ParlayLabClient } from "./ParlayLabClient";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import { suggestParlays } from "@/lib/edge/parlay";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ParlayPage() {
  const bundle = await loadOddsBundle(DEFAULT_SETTINGS.sports);
  const edges = rankEdges(bundle.events, 0.5);
  const parlays = suggestParlays(edges, {
    maxLegs: DEFAULT_SETTINGS.maxParlayLegs,
    bankroll: DEFAULT_SETTINGS.bankroll,
    kellyFraction: DEFAULT_SETTINGS.kellyFraction,
    limit: 6,
  });

  return (
    <ParlayLabClient
      source={bundle.source}
      fetchedAt={bundle.fetchedAt}
      initialEdges={edges}
      initialParlays={parlays}
    />
  );
}
