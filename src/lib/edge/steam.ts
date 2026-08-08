import type { BookKey, LineSnapshot } from "@/lib/odds/types";
import { SHARP_BOOK } from "@/lib/odds/types";

export interface SteamAlert {
  id: string;
  eventId: string;
  market: string;
  selection: string;
  point?: number;
  openPrice: number;
  currentPrice: number;
  move: number;
  sharpLed: boolean;
  booksMoved: string[];
  capturedAt: string;
  severity: "info" | "steam" | "reverse";
}

function selectionKey(s: LineSnapshot): string {
  return `${s.eventId}|${s.market}|${s.selection}|${s.point ?? ""}|${s.book}`;
}

function baseKey(s: LineSnapshot): string {
  return `${s.eventId}|${s.market}|${s.selection}|${s.point ?? ""}`;
}

/**
 * Compare open vs current snapshots. Steam = sharp book shortened first / most.
 */
export function detectSteam(snapshots: LineSnapshot[]): SteamAlert[] {
  const open = new Map<string, LineSnapshot>();
  const current = new Map<string, LineSnapshot>();

  for (const snap of snapshots) {
    const key = selectionKey(snap);
    if (snap.phase === "open") open.set(key, snap);
    else current.set(key, snap);
  }

  const groups = new Map<string, { open: LineSnapshot[]; current: LineSnapshot[] }>();
  for (const snap of snapshots) {
    const key = baseKey(snap);
    const g = groups.get(key) ?? { open: [], current: [] };
    if (snap.phase === "open") g.open.push(snap);
    else g.current.push(snap);
    groups.set(key, g);
  }

  const alerts: SteamAlert[] = [];

  for (const [key, group] of groups) {
    if (!group.open.length || !group.current.length) continue;

    const avgOpen =
      group.open.reduce((a, s) => a + s.price, 0) / group.open.length;
    const avgCurrent =
      group.current.reduce((a, s) => a + s.price, 0) / group.current.length;
    const move = avgCurrent - avgOpen;

    if (Math.abs(move) < 5) continue;

    const sharpOpen = group.open.find((s) => s.book === SHARP_BOOK);
    const sharpCurrent = group.current.find((s) => s.book === SHARP_BOOK);
    const sharpMove =
      sharpOpen && sharpCurrent ? sharpCurrent.price - sharpOpen.price : 0;

    const booksMoved = group.current
      .filter((c) => {
        const o = group.open.find((x) => x.book === c.book);
        return o && Math.abs(c.price - o.price) >= 5;
      })
      .map((c) => c.book);

    const sharpLed =
      Boolean(sharpOpen && sharpCurrent) &&
      Math.abs(sharpMove) >= Math.abs(move) * 0.8;

    const sample = group.current[0];
    alerts.push({
      id: key,
      eventId: sample.eventId,
      market: sample.market,
      selection: sample.selection,
      point: sample.point,
      openPrice: Math.round(avgOpen),
      currentPrice: Math.round(avgCurrent),
      move: Math.round(move),
      sharpLed,
      booksMoved,
      capturedAt: sample.capturedAt,
      severity:
        sharpLed && Math.abs(move) >= 12
          ? "steam"
          : move > 0
            ? "reverse"
            : "info",
    });
  }

  return alerts.sort(
    (a, b) => Math.abs(b.move) - Math.abs(a.move),
  );
}

export function movementTimeline(
  snapshots: LineSnapshot[],
  eventId: string,
  book: BookKey = SHARP_BOOK,
) {
  return snapshots
    .filter((s) => s.eventId === eventId && s.book === book)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}
