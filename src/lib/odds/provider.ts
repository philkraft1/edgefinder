import type {
  BookmakerOdds,
  EventOdds,
  MarketKey,
  SportKey,
} from "@/lib/odds/types";
import {
  BOOK_TITLES,
  DEFAULT_LIVE_SPORTS,
  LIVE_BOOKMAKERS,
} from "@/lib/odds/types";
import { getMockEvents, MOCK_SNAPSHOTS, getMockStats } from "@/lib/odds/mock";
import { filterEventsByWindow, type TimeWindow } from "@/lib/odds/window";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: string;
  last_update: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

function normalizeEvent(raw: OddsApiEvent): EventOdds {
  const bookmakers: BookmakerOdds[] = (raw.bookmakers ?? []).map((b) => ({
    key: b.key,
    title: BOOK_TITLES[b.key] ?? b.title,
    markets: b.markets
      .filter((m) => ["h2h", "spreads", "totals"].includes(m.key))
      .map((m) => ({
        key: m.key as MarketKey,
        lastUpdate: m.last_update,
        outcomes: m.outcomes.map((o) => ({
          name: o.name,
          price: o.price,
          point: o.point,
        })),
      })),
  }));

  return {
    id: raw.id,
    sportKey: raw.sport_key,
    sportTitle: raw.sport_title,
    commenceTime: raw.commence_time,
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    bookmakers,
  };
}

async function fetchSportOdds(
  sport: SportKey,
  apiKey: string,
  window: TimeWindow,
): Promise<EventOdds[]> {
  const params = new URLSearchParams({
    apiKey,
    regions: "us,eu,uk",
    markets: "h2h,spreads,totals",
    oddsFormat: "american",
    bookmakers: LIVE_BOOKMAKERS,
  });

  // Filter Live/Soon client-side so in-play is never dropped by API time params.
  const revalidate = window === "all" ? 60 : 20;
  const url = `${ODDS_API_BASE}/sports/${sport}/odds?${params}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    if (res.status === 404 || res.status === 422) return [];
    throw new Error(`Odds API ${sport} failed: ${res.status}`);
  }
  const data = (await res.json()) as OddsApiEvent[];
  return data.map(normalizeEvent);
}

export type OddsSource = "live" | "mock";

export interface OddsBundle {
  source: OddsSource;
  events: EventOdds[];
  snapshots: typeof MOCK_SNAPSHOTS;
  stats: ReturnType<typeof getMockStats>;
  fetchedAt: string;
  window: TimeWindow;
}

export async function loadOddsBundle(opts?: {
  sports?: SportKey[];
  window?: TimeWindow;
}): Promise<OddsBundle> {
  const apiKey = process.env.ODDS_API_KEY?.trim();
  const fetchedAt = new Date().toISOString();
  const window = opts?.window ?? "soon";
  const sportList =
    opts?.sports?.length
      ? opts.sports
      : apiKey
        ? DEFAULT_LIVE_SPORTS
        : ["americanfootball_nfl", "basketball_nba", "baseball_mlb"];

  if (!apiKey) {
    const raw = getMockEvents(sportList);
    const events = filterEventsByWindow(raw, window);
    return {
      source: "mock",
      events,
      snapshots: MOCK_SNAPSHOTS,
      stats: getMockStats(events.flatMap((e) => [e.homeTeam, e.awayTeam])),
      fetchedAt,
      window,
    };
  }

  try {
    const chunks = await Promise.all(
      sportList.map((sport) => fetchSportOdds(sport, apiKey, window)),
    );
    const raw = chunks.flat().filter((e) => e.bookmakers.length > 0);
    const events = filterEventsByWindow(raw, window);
    return {
      source: "live",
      events,
      snapshots: MOCK_SNAPSHOTS,
      stats: getMockStats(events.flatMap((e) => [e.homeTeam, e.awayTeam])),
      fetchedAt,
      window,
    };
  } catch {
    const raw = getMockEvents(sportList);
    const events = filterEventsByWindow(raw, window);
    return {
      source: "mock",
      events,
      snapshots: MOCK_SNAPSHOTS,
      stats: getMockStats(events.flatMap((e) => [e.homeTeam, e.awayTeam])),
      fetchedAt,
      window,
    };
  }
}
