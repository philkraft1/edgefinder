import { NextRequest, NextResponse } from "next/server";
import { loadOddsBundle } from "@/lib/odds/provider";
import { detectSteam } from "@/lib/edge/steam";
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
  const alerts = detectSteam(bundle.snapshots);

  const eventMap = new Map(bundle.events.map((e) => [e.id, e]));
  const enriched = alerts.map((alert) => {
    const event = eventMap.get(alert.eventId);
    return {
      ...alert,
      matchup: event
        ? `${event.awayTeam} @ ${event.homeTeam}`
        : alert.eventId,
      sportTitle: event?.sportTitle ?? "",
      commenceTime: event?.commenceTime ?? "",
    };
  });

  return NextResponse.json({
    source: bundle.source,
    fetchedAt: bundle.fetchedAt,
    window: bundle.window,
    alerts: enriched,
    snapshots: bundle.snapshots,
  });
}
