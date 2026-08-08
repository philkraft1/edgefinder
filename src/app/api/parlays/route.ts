import { NextRequest, NextResponse } from "next/server";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import {
  evaluateManualParlay,
  suggestParlays,
} from "@/lib/edge/parlay";
import type { SportKey } from "@/lib/odds/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

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

  const bundle = await loadOddsBundle(sports);
  const edges = rankEdges(bundle.events, 0.5);
  const parlays = suggestParlays(edges, {
    minLegs: 2,
    maxLegs: Number.isFinite(maxLegs) ? maxLegs : 4,
    bankroll: Number.isFinite(bankroll) ? bankroll : 1000,
    kellyFraction: Number.isFinite(kellyFraction) ? kellyFraction : 0.25,
    limit: 10,
  });

  return NextResponse.json({
    source: bundle.source,
    fetchedAt: bundle.fetchedAt,
    parlays,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    edgeIds?: string[];
    sports?: SportKey[];
    bankroll?: number;
    kellyFraction?: number;
  };

  const sports = body.sports?.length ? body.sports : DEFAULT_SETTINGS.sports;
  const bundle = await loadOddsBundle(sports);
  const edges = rankEdges(bundle.events, 0);
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
