import {
  americanToDecimal,
  combineDecimalOdds,
  decimalToAmerican,
} from "@/lib/odds/convert";
import { kellyStake } from "@/lib/bankroll/kelly";
import type { EdgeOpportunity } from "@/lib/edge/ev";
import type { BookKey } from "@/lib/odds/types";
import { BOOK_TITLES } from "@/lib/odds/types";

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
  commenceTime?: string;
}

export interface SuggestedParlay {
  id: string;
  book: BookKey;
  bookTitle: string;
  legs: ParlayLeg[];
  combinedDecimal: number;
  combinedAmerican: number;
  fairProb: number;
  evPercent: number;
  correlationFlags: string[];
  kellyStake: number;
  score: number;
}

export interface SinglesPortfolioItem {
  edgeId: string;
  eventId: string;
  sportTitle: string;
  matchup: string;
  selection: string;
  point?: number;
  market: string;
  book: BookKey;
  bookTitle: string;
  price: number;
  evPercent: number;
  kellyStake: number;
  commenceTime: string;
}

export interface SinglesPortfolio {
  items: SinglesPortfolioItem[];
  totalKellyStake: number;
  note: string;
}

function toLeg(edge: EdgeOpportunity): ParlayLeg {
  return {
    edgeId: edge.id,
    eventId: edge.eventId,
    selection: edge.selection,
    point: edge.point,
    market: edge.market,
    book: edge.bookTitle,
    price: edge.price,
    fairProb: edge.fairProb,
    homeTeam: edge.homeTeam,
    awayTeam: edge.awayTeam,
    commenceTime: edge.commenceTime,
  };
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
  book: BookKey,
  bookTitle: string,
): SuggestedParlay {
  const decimals = legs.map((l) => americanToDecimal(l.price));
  const combinedDecimal = combineDecimalOdds(decimals);
  const fairProb = legs.reduce((acc, l) => acc * l.fairProb, 1);
  const ev = fairProb * (combinedDecimal - 1) - (1 - fairProb);
  const flags = correlationFlags(legs);
  const corrPenalty = flags.length * 0.35;
  const diversityBonus = new Set(legs.map((l) => l.eventId)).size * 0.15;
  const score = ev * 100 - corrPenalty + diversityBonus;

  return {
    id: `${book}|${legs.map((l) => l.edgeId).join("|")}`,
    book,
    bookTitle,
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
 * Beam search within a single book's edges only (bettable on that platform).
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
    book?: BookKey;
    bookTitle?: string;
  } = {},
): SuggestedParlay[] {
  const minLegs = opts.minLegs ?? 2;
  const maxLegs = opts.maxLegs ?? 4;
  const bankroll = opts.bankroll ?? 1000;
  const kellyFraction = opts.kellyFraction ?? 0.25;
  const limit = opts.limit ?? 8;
  const poolSize = opts.poolSize ?? 24;
  const bookKey = opts.book ?? (edges[0]?.book as BookKey | undefined);
  const bookTitle =
    opts.bookTitle ??
    (bookKey ? BOOK_TITLES[bookKey] ?? String(bookKey) : "Book");

  if (!bookKey) return [];

  // Within one book: keep best EV per event+market+selection
  const bestBySelection = new Map<string, EdgeOpportunity>();
  for (const edge of edges) {
    if (edge.book !== bookKey) continue;
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
        const candidate = [...beam.indices, i];
        if (candidate.length < minLegs) {
          next.push({ indices: candidate });
          continue;
        }
        const legs = candidate.map((idx) => toLeg(pool[idx]));
        const scored = scoreParlay(
          legs,
          bankroll,
          kellyFraction,
          bookKey,
          bookTitle,
        );
        if (scored.evPercent > 0) completed.push(scored);
        if (candidate.length < maxLegs) {
          const uniqueEvents = new Set(
            candidate.map((idx) => pool[idx].eventId),
          );
          if (uniqueEvents.size >= usedEvents.size) {
            next.push({ indices: candidate });
          }
        }
      }
    }
    beams = next
      .map((b) => ({
        b,
        s: scoreParlay(
          b.indices.map((i) => toLeg(pool[i])),
          bankroll,
          kellyFraction,
          bookKey,
          bookTitle,
        ).score,
      }))
      .sort((a, c) => c.s - a.s)
      .slice(0, 40)
      .map((x) => x.b);
  }

  const seen = new Set<string>();
  return completed
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Build bettable same-book parlays by partitioning edges per bookmaker.
 */
export function suggestParlaysByBook(
  edges: EdgeOpportunity[],
  opts: {
    minLegs?: number;
    maxLegs?: number;
    bankroll?: number;
    kellyFraction?: number;
    limit?: number;
    book?: BookKey | "any";
  } = {},
): SuggestedParlay[] {
  const bookFilter = opts.book && opts.book !== "any" ? opts.book : null;
  const byBook = new Map<BookKey, EdgeOpportunity[]>();

  for (const edge of edges) {
    if (bookFilter && edge.book !== bookFilter) continue;
    const list = byBook.get(edge.book) ?? [];
    list.push(edge);
    byBook.set(edge.book, list);
  }

  const perBookLimit = Math.max(2, Math.ceil((opts.limit ?? 8) / 2));
  const all: SuggestedParlay[] = [];

  for (const [book, bookEdges] of byBook) {
    const tickets = suggestParlays(bookEdges, {
      ...opts,
      book,
      bookTitle: BOOK_TITLES[book] ?? book,
      limit: perBookLimit,
    });
    all.push(...tickets);
  }

  return all.sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 8);
}

/**
 * Best-price singles across books — place each leg at its own book (not a parlay).
 */
export function buildSinglesPortfolio(
  edges: EdgeOpportunity[],
  opts: {
    limit?: number;
    bankroll?: number;
    kellyFraction?: number;
    book?: BookKey | "any";
  } = {},
): SinglesPortfolio {
  const limit = opts.limit ?? 8;
  const bankroll = opts.bankroll ?? 1000;
  const kellyFraction = opts.kellyFraction ?? 0.25;
  const bookFilter = opts.book && opts.book !== "any" ? opts.book : null;

  const bestBySelection = new Map<string, EdgeOpportunity>();
  for (const edge of edges) {
    if (bookFilter && edge.book !== bookFilter) continue;
    if (edge.evPercent <= 0) continue;
    const key = `${edge.eventId}:${edge.market}:${edge.selection}:${edge.point ?? ""}`;
    const prev = bestBySelection.get(key);
    if (!prev || edge.evPercent > prev.evPercent) bestBySelection.set(key, edge);
  }

  const items = [...bestBySelection.values()]
    .sort((a, b) => b.evPercent - a.evPercent)
    .slice(0, limit)
    .map((edge) => {
      const stake = kellyStake(
        bankroll,
        edge.decimalOdds,
        edge.fairProb,
        kellyFraction,
      );
      return {
        edgeId: edge.id,
        eventId: edge.eventId,
        sportTitle: edge.sportTitle,
        matchup: `${edge.awayTeam} @ ${edge.homeTeam}`,
        selection: edge.selection,
        point: edge.point,
        market: edge.market,
        book: edge.book,
        bookTitle: edge.bookTitle,
        price: edge.price,
        evPercent: edge.evPercent,
        kellyStake: stake,
        commenceTime: edge.commenceTime,
      };
    });

  return {
    items,
    totalKellyStake: items.reduce((s, i) => s + i.kellyStake, 0),
    note: "Bet these as separate singles at each book — not one combined parlay.",
  };
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

  const books = new Set(selected.map((e) => e.book));
  if (books.size > 1) {
    // Still score for preview, but tag correlation with cross-book warning
    const book = selected[0].book;
    const scored = scoreParlay(
      selected.map(toLeg),
      bankroll,
      kellyFraction,
      book,
      selected[0].bookTitle,
    );
    scored.correlationFlags = [
      "Cross-book legs — not bettable as one parlay. Lock to one book or use singles portfolio.",
      ...scored.correlationFlags,
    ];
    scored.score -= 50;
    return scored;
  }

  const book = selected[0].book;
  return scoreParlay(
    selected.map(toLeg),
    bankroll,
    kellyFraction,
    book,
    selected[0].bookTitle,
  );
}
