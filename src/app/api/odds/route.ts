import { NextRequest, NextResponse } from "next/server";
import { loadOddsBundle } from "@/lib/odds/provider";
import { bestPriceBoard } from "@/lib/edge/ev";
import type { SportKey } from "@/lib/odds/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { parseTimeWindow } from "@/lib/odds/window";

export async function GET(req: NextRequest) {
  const sportsParam = req.nextUrl.searchParams.get("sports");
  const sports = (
    sportsParam ? sportsParam.split(",") : DEFAULT_SETTINGS.sports
  ) as SportKey[];
  const window = parseTimeWindow(
    req.nextUrl.searchParams.get("window") ?? DEFAULT_SETTINGS.timeWindow,
  );

  const bundle = await loadOddsBundle({ sports, window });
  const board = bestPriceBoard(bundle.events);

  return NextResponse.json({
    source: bundle.source,
    fetchedAt: bundle.fetchedAt,
    window: bundle.window,
    events: bundle.events,
    board,
    stats: bundle.stats,
  });
}
