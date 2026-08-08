import type { EventOdds } from "@/lib/odds/types";

export type TimeWindow = "live" | "soon" | "all";
export type EventPhase = "live" | "upcoming";

export const SOON_HOURS = 6;

export function parseTimeWindow(value: string | null | undefined): TimeWindow {
  if (value === "live" || value === "soon" || value === "all") return value;
  return "soon";
}

export function eventPhase(
  commenceTime: string,
  nowMs = Date.now(),
): EventPhase {
  return new Date(commenceTime).getTime() <= nowMs ? "live" : "upcoming";
}

export function filterEventsByWindow(
  events: EventOdds[],
  window: TimeWindow,
  nowMs = Date.now(),
): EventOdds[] {
  if (window === "all") return events;

  const soonCutoff = nowMs + SOON_HOURS * 3600_000;

  return events.filter((event) => {
    const start = new Date(event.commenceTime).getTime();
    if (window === "live") return start <= nowMs;
    // soon: in-play + starting within horizon
    return start <= soonCutoff;
  });
}
