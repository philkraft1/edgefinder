import { NextRequest, NextResponse } from "next/server";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import {
  buildSinglesPortfolio,
  evaluateManualParlay,
  suggestParlaysByBook,
} from "@/lib/edge/parlay";
import type { BookKey, SportKey } from "@/lib/odds/types";
import { DEFAULT_SETTINGS, type TicketMode } from "@/lib/settings";
import { parseTimeWindow } from "@/lib/odds/window";

function parseMode(value: string | null): TicketMode {
  return value === "singles" ? "singles" : "sameBook";
}

export async function GET(req: NextRequest) {
  const sportsParam = req.nextUrl.searchParams.get("sports");
  const maxLegs = Number(
    req.nextUrl.searchParams.get("maxLegs") ?? DEFAULT_SETTINGS.maxParlayLegs,
  );
  const bankroll = Number(
    req.nextUrl.searchParams.get("bankroll") ?? DEFAULT_SETTINGS.bankroll,
  );
  const kellyFraction = Number(
    req.nextUrl.searchParams.get("kellyFraction") ??
      DEFAULT_SETTINGS.kellyFraction,
  );
  const sports = (
    sportsParam ? sportsParam.split(",") : DEFAULT_SETTINGS.sports
  ) as SportKey[];
  const window = parseTimeWindow(
    req.nextUrl.searchParams.get("window") ?? DEFAULT_SETTINGS.timeWindow,
  );
  const mode = parseMode(
    req.nextUrl.searchParams.get("mode") ?? DEFAULT_SETTINGS.ticketMode,
  );
  const bookParam = req.nextUrl.searchParams.get("book");
  const book =
    bookParam && bookParam !== "any"
      ? (bookParam as BookKey)
      : ("any" as const);

  const bundle = await loadOddsBundle({ sports, window });
  // Include small edges so same-book search has enough legs per platform
  const edges = rankEdges(bundle.events, 0, { book });

  if (mode === "singles") {
    const portfolio = buildSinglesPortfolio(edges, {
      bankroll: Number.isFinite(bankroll) ? bankroll : 1000,
      kellyFraction: Number.isFinite(kellyFraction) ? kellyFraction : 0.25,
      book,
      limit: 10,
    });
    return NextResponse.json({
      source: bundle.source,
      fetchedAt: bundle.fetchedAt,
      window: bundle.window,
      mode,
      book,
      portfolio,
      parlays: [],
    });
  }

  const parlays = suggestParlaysByBook(edges, {
    minLegs: 2,
    maxLegs: Number.isFinite(maxLegs) ? maxLegs : 4,
    bankroll: Number.isFinite(bankroll) ? bankroll : 1000,
    kellyFraction: Number.isFinite(kellyFraction) ? kellyFraction : 0.25,
    limit: 10,
    book,
  });

  return NextResponse.json({
    source: bundle.source,
    fetchedAt: bundle.fetchedAt,
    window: bundle.window,
    mode,
    book,
    parlays,
    portfolio: null,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    edgeIds?: string[];
    sports?: SportKey[];
    bankroll?: number;
    kellyFraction?: number;
    window?: string;
    book?: BookKey | "any";
  };

  const sports = body.sports?.length ? body.sports : DEFAULT_SETTINGS.sports;
  const window = parseTimeWindow(body.window ?? DEFAULT_SETTINGS.timeWindow);
  const book = body.book && body.book !== "any" ? body.book : ("any" as const);

  const bundle = await loadOddsBundle({ sports, window });
  const edges = rankEdges(bundle.events, 0, { book });
  const parlay = evaluateManualParlay(
    edges,
    body.edgeIds ?? [],
    body.bankroll ?? DEFAULT_SETTINGS.bankroll,
    body.kellyFraction ?? DEFAULT_SETTINGS.kellyFraction,
  );

  if (!parlay) {
    return NextResponse.json(
      { error: "Select at least two valid legs" },
      { status: 400 },
    );
  }

  return NextResponse.json({ parlay });
}
