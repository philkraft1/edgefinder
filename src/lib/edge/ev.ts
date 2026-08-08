import {
  americanToDecimal,
  formatAmerican,
  probabilityToAmerican,
} from "@/lib/odds/convert";
import { fairProbabilities } from "@/lib/edge/devig";
import type {
  BookKey,
  EventOdds,
  MarketKey,
  OutcomeOdds,
} from "@/lib/odds/types";
import { BOOK_TITLES, SHARP_BOOK } from "@/lib/odds/types";

export interface EdgeOpportunity {
  id: string;
  eventId: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  market: MarketKey;
  selection: string;
  point?: number;
  book: BookKey;
  bookTitle: string;
  price: number;
  fairProb: number;
  fairAmerican: number;
  impliedProb: number;
  evPercent: number;
  edgePercent: number;
  decimalOdds: number;
}

function marketOutcomes(
  event: EventOdds,
  bookKey: BookKey,
  market: MarketKey,
): OutcomeOdds[] | null {
  const book = event.bookmakers.find((b) => b.key === bookKey);
  const m = book?.markets.find((x) => x.key === market);
  return m?.outcomes ?? null;
}

function outcomeKey(o: OutcomeOdds): string {
  return o.point === undefined ? o.name : `${o.name}|${o.point}`;
}

function medianPrice(prices: number[]): number {
  const sorted = [...prices].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Sharp book when available; otherwise consensus (median price per selection)
 * across books so soft outliers don't define "fair".
 */
function findReferenceOutcomes(
  event: EventOdds,
  market: MarketKey,
): OutcomeOdds[] | null {
  const sharp = marketOutcomes(event, SHARP_BOOK, market);
  if (sharp && sharp.length >= 2) return sharp;

  const bySelection = new Map<string, { outcome: OutcomeOdds; prices: number[] }>();
  for (const book of event.bookmakers) {
    const m = book.markets.find((x) => x.key === market);
    if (!m) continue;
    for (const o of m.outcomes) {
      const key = outcomeKey(o);
      const entry = bySelection.get(key) ?? { outcome: o, prices: [] };
      entry.prices.push(o.price);
      bySelection.set(key, entry);
    }
  }

  if (bySelection.size < 2) {
    for (const book of event.bookmakers) {
      const m = book.markets.find((x) => x.key === market);
      if (m && m.outcomes.length >= 2) return m.outcomes;
    }
    return null;
  }

  return [...bySelection.values()].map(({ outcome, prices }) => ({
    name: outcome.name,
    point: outcome.point,
    price: medianPrice(prices),
  }));
}

export function rankEdges(
  events: EventOdds[],
  minEvPercent = 0,
  opts: { book?: BookKey | "any"; maxAbsPrice?: number } = {},
): EdgeOpportunity[] {
  const edges: EdgeOpportunity[] = [];
  const bookFilter = opts.book && opts.book !== "any" ? opts.book : null;
  const maxAbsPrice = opts.maxAbsPrice ?? 1000;

  for (const event of events) {
    const markets: MarketKey[] = ["h2h", "spreads", "totals"];
    for (const market of markets) {
      const reference = findReferenceOutcomes(event, market);
      if (!reference) continue;

      const fairMap = new Map<string, number>();
      const fairProbs = fairProbabilities(reference.map((o) => o.price));
      reference.forEach((o, i) => fairMap.set(outcomeKey(o), fairProbs[i]));

      for (const book of event.bookmakers) {
        if (bookFilter && book.key !== bookFilter) continue;
        const bookMarket = book.markets.find((m) => m.key === market);
        if (!bookMarket) continue;

        for (const outcome of bookMarket.outcomes) {
          if (Math.abs(outcome.price) >= maxAbsPrice) continue;

          const key = outcomeKey(outcome);
          const fairProb = fairMap.get(key);
          if (fairProb === undefined) continue;

          const decimalOdds = americanToDecimal(outcome.price);
          const ev = fairProb * (decimalOdds - 1) - (1 - fairProb);
          const evPercent = ev * 100;
          if (evPercent < minEvPercent) continue;

          // Skip offering the sharp book against itself as "value"
          if (book.key === SHARP_BOOK && Math.abs(evPercent) < 0.25) continue;

          const implied =
            outcome.price > 0
              ? 100 / (outcome.price + 100)
              : Math.abs(outcome.price) / (Math.abs(outcome.price) + 100);

          edges.push({
            id: `${event.id}:${market}:${key}:${book.key}`,
            eventId: event.id,
            sportTitle: event.sportTitle,
            commenceTime: event.commenceTime,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            market,
            selection: outcome.name,
            point: outcome.point,
            book: book.key,
            bookTitle: BOOK_TITLES[book.key] ?? book.title,
            price: outcome.price,
            fairProb,
            fairAmerican: probabilityToAmerican(fairProb),
            impliedProb: implied,
            evPercent,
            edgePercent: (fairProb - implied) * 100,
            decimalOdds,
          });
        }
      }
    }
  }

  return edges.sort((a, b) => b.evPercent - a.evPercent);
}

export function bestPriceBoard(events: EventOdds[]) {
  return events.map((event) => {
    const rows: {
      market: MarketKey;
      selection: string;
      point?: number;
      bestPrice: number;
      bestBook: string;
      prices: { book: string; price: number }[];
    }[] = [];

    for (const market of ["h2h", "spreads", "totals"] as MarketKey[]) {
      const bySelection = new Map<
        string,
        { selection: string; point?: number; prices: { book: string; price: number }[] }
      >();

      for (const book of event.bookmakers) {
        const m = book.markets.find((x) => x.key === market);
        if (!m) continue;
        for (const o of m.outcomes) {
          const key = outcomeKey(o);
          const entry = bySelection.get(key) ?? {
            selection: o.name,
            point: o.point,
            prices: [],
          };
          entry.prices.push({
            book: BOOK_TITLES[book.key] ?? book.title,
            price: o.price,
          });
          bySelection.set(key, entry);
        }
      }

      for (const entry of bySelection.values()) {
        const best = entry.prices.reduce((a, b) =>
          a.price > b.price ? a : b,
        );
        rows.push({
          market,
          selection: entry.selection,
          point: entry.point,
          bestPrice: best.price,
          bestBook: best.book,
          prices: entry.prices,
        });
      }
    }

    return { event, rows };
  });
}

export function describeEdge(edge: EdgeOpportunity): string {
  const point =
    edge.point !== undefined
      ? ` ${edge.point > 0 ? "+" : ""}${edge.point}`
      : "";
  return `${edge.selection}${point} @ ${edge.bookTitle} ${formatAmerican(edge.price)}`;
}
