import { NextRequest, NextResponse } from "next/server";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import type { BookKey, SportKey } from "@/lib/odds/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { parseTimeWindow } from "@/lib/odds/window";

export async function GET(req: NextRequest) {
  const sportsParam = req.nextUrl.searchParams.get("sports");
  const minEv = Number(
    req.nextUrl.searchParams.get("minEv") ?? DEFAULT_SETTINGS.minEvPercent,
  );
  const sports = (
    sportsParam ? sportsParam.split(",") : DEFAULT_SETTINGS.sports
  ) as SportKey[];
  const window = parseTimeWindow(
    req.nextUrl.searchParams.get("window") ?? DEFAULT_SETTINGS.timeWindow,
  );
  const bookParam = req.nextUrl.searchParams.get("book");
  const book =
    bookParam && bookParam !== "any"
      ? (bookParam as BookKey)
      : ("any" as const);

  const bundle = await loadOddsBundle({ sports, window });
  const edges = rankEdges(bundle.events, Number.isFinite(minEv) ? minEv : 0, {
    book,
  });

  return NextResponse.json({
    source: bundle.source,
    fetchedAt: bundle.fetchedAt,
    window: bundle.window,
    book,
    count: edges.length,
    edges,
  });
}
