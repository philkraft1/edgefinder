import {
  americanToDecimal,
  combineDecimalOdds,
  decimalToAmerican,
} from "@/lib/odds/convert";
import { kellyStake } from "@/lib/bankroll/kelly";
import type { EdgeOpportunity } from "@/lib/edge/ev";

export interface ParlayLeg {
  edgeId: string;
  eventId: string;
  selection: string;
  point?: number;
  market: string;
  book: string;
  price: number;
  fairProb: number;
  homeTeam: string;
  awayTeam: string;
}

export interface SuggestedParlay {
  id: string;
  legs: ParlayLeg[];
  combinedDecimal: number;
  combinedAmerican: number;
  fairProb: number;
  evPercent: number;
  correlationFlags: string[];
  kellyStake: number;
  score: number;
}

function toLeg(edge: EdgeOpportunity): ParlayLeg {
  return {
    edgeId: edge.id,
    eventId: eventId(edge),
    selection: edge.selection,
    point: edge.point,
    market: edge.market,
    book: edge.bookTitle,
    price: edge.price,
    fairProb: edge.fairProb,
    homeTeam: edge.homeTeam,
    awayTeam: edge.awayTeam,
  };
}

function eventId(edge: EdgeOpportunity): string {
  return edge.eventId;
}

function correlationFlags(legs: ParlayLeg[]): string[] {
  const flags: string[] = [];
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const a = legs[i];
      const b = legs[j];
      if (a.eventId === b.eventId) {
        flags.push(`Same game: ${a.awayTeam} @ ${a.homeTeam}`);
      }
      const aTeams = new Set([a.homeTeam, a.awayTeam, a.selection]);
      const overlap =
        aTeams.has(b.selection) ||
        b.selection === a.homeTeam ||
        b.selection === a.awayTeam ||
        a.selection === b.homeTeam ||
        a.selection === b.awayTeam;
      if (a.eventId !== b.eventId && overlap) {
        flags.push(`Shared team exposure: ${a.selection} / ${b.selection}`);
      }
    }
  }
  return [...new Set(flags)];
}

function scoreParlay(
  legs: ParlayLeg[],
  bankroll: number,
  kellyFraction: number,
): SuggestedParlay {
  const decimals = legs.map((l) => americanToDecimal(l.price));
  const combinedDecimal = combineDecimalOdds(decimals);
  // Independence assumption, then penalize correlation in score
  const fairProb = legs.reduce((acc, l) => acc * l.fairProb, 1);
  const ev = fairProb * (combinedDecimal - 1) - (1 - fairProb);
  const flags = correlationFlags(legs);
  const corrPenalty = flags.length * 0.35;
  const diversityBonus = new Set(legs.map((l) => l.eventId)).size * 0.15;
  const score = ev * 100 - corrPenalty + diversityBonus;

  return {
    id: legs.map((l) => l.edgeId).join("|"),
    legs,
    combinedDecimal,
    combinedAmerican: decimalToAmerican(combinedDecimal),
    fairProb,
    evPercent: ev * 100,
    correlationFlags: flags,
    kellyStake: kellyStake(bankroll, combinedDecimal, fairProb, kellyFraction),
    score,
  };
}

/**
 * Beam-ish search over top edges for viable parlays.
 * Prefers de-correlated legs with positive combined EV.
 */
export function suggestParlays(
  edges: EdgeOpportunity[],
  opts: {
    minLegs?: number;
    maxLegs?: number;
    bankroll?: number;
    kellyFraction?: number;
    limit?: number;
    poolSize?: number;
  } = {},
): SuggestedParlay[] {
  const minLegs = opts.minLegs ?? 2;
  const maxLegs = opts.maxLegs ?? 4;
  const bankroll = opts.bankroll ?? 1000;
  const kellyFraction = opts.kellyFraction ?? 0.25;
  const limit = opts.limit ?? 8;
  const poolSize = opts.poolSize ?? 24;

  // Deduplicate by event+market+selection keeping best EV book
  const bestBySelection = new Map<string, EdgeOpportunity>();
  for (const edge of edges) {
    const key = `${edge.eventId}:${edge.market}:${edge.selection}:${edge.point ?? ""}`;
    const prev = bestBySelection.get(key);
    if (!prev || edge.evPercent > prev.evPercent) bestBySelection.set(key, edge);
  }

  const pool = [...bestBySelection.values()]
    .filter((e) => e.evPercent > 0)
    .sort((a, b) => b.evPercent - a.evPercent)
    .slice(0, poolSize);

  if (pool.length < minLegs) return [];

  type Beam = { indices: number[] };
  let beams: Beam[] = pool.map((_, i) => ({ indices: [i] }));
  const completed: SuggestedParlay[] = [];

  for (let legCount = 2; legCount <= maxLegs; legCount++) {
    const next: Beam[] = [];
    for (const beam of beams) {
      const usedEvents = new Set(beam.indices.map((i) => pool[i].eventId));
      const last = Math.max(...beam.indices);
      for (let i = last + 1; i < pool.length; i++) {
        // Soft prefer unique events; allow same-game only if still scoring later
        const candidate = [...beam.indices, i];
        if (candidate.length < minLegs) {
          next.push({ indices: candidate });
          continue;
        }
        const legs = candidate.map((idx) => toLeg(pool[idx]));
        const scored = scoreParlay(legs, bankroll, kellyFraction);
        if (scored.evPercent > 0) completed.push(scored);
        // Keep expanding if we haven't hit max and events stay diverse
        if (candidate.length < maxLegs) {
          const uniqueEvents = new Set(candidate.map((idx) => pool[idx].eventId));
          if (uniqueEvents.size >= usedEvents.size) {
            next.push({ indices: candidate });
          }
        }
      }
    }
    // Cap beam width
    beams = next
      .map((b) => ({
        b,
        s: scoreParlay(
          b.indices.map((i) => toLeg(pool[i])),
          bankroll,
          kellyFraction,
        ).score,
      }))
      .sort((a, c) => c.s - a.s)
      .slice(0, 40)
      .map((x) => x.b);
  }

  // Deduplicate by leg set
  const seen = new Set<string>();
  const unique = completed.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return unique.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function evaluateManualParlay(
  edges: EdgeOpportunity[],
  edgeIds: string[],
  bankroll: number,
  kellyFraction: number,
): SuggestedParlay | null {
  const selected = edgeIds
    .map((id) => edges.find((e) => e.id === id))
    .filter((e): e is EdgeOpportunity => Boolean(e));
  if (selected.length < 2) return null;
  return scoreParlay(selected.map(toLeg), bankroll, kellyFraction);
}
