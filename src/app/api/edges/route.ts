import { NextRequest, NextResponse } from "next/server";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import type { SportKey } from "@/lib/odds/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const sportsParam = req.nextUrl.searchParams.get("sports");
  const minEv = Number(
    req.nextUrl.searchParams.get("minEv") ?? DEFAULT_SETTINGS.minEvPercent,
  );
  const sports = (
    sportsParam ? sportsParam.split(",") : DEFAULT_SETTINGS.sports
  ) as SportKey[];

  const bundle = await loadOddsBundle(sports);
  const edges = rankEdges(bundle.events, Number.isFinite(minEv) ? minEv : 0);

  return NextResponse.json({
    source: bundle.source,
    fetchedAt: bundle.fetchedAt,
    count: edges.length,
    edges,
  });
}
