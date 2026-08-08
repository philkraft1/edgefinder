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
): Promise<EventOdds[]> {
  const params = new URLSearchParams({
    apiKey,
    regions: "us,eu,uk",
    markets: "h2h,spreads,totals",
    oddsFormat: "american",
    bookmakers: LIVE_BOOKMAKERS,
  });

  const url = `${ODDS_API_BASE}/sports/${sport}/odds?${params}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    // Sport may be out of season / unavailable — skip rather than fail all
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
}

export async function loadOddsBundle(sports?: SportKey[]): Promise<OddsBundle> {
  const apiKey = process.env.ODDS_API_KEY?.trim();
  const fetchedAt = new Date().toISOString();
  const sportList =
    sports?.length ? sports : apiKey ? DEFAULT_LIVE_SPORTS : [
      "americanfootball_nfl",
      "basketball_nba",
      "baseball_mlb",
    ];

  if (!apiKey) {
    const events = getMockEvents(sportList as never);
    return {
      source: "mock",
      events,
      snapshots: MOCK_SNAPSHOTS,
      stats: getMockStats(
        events.flatMap((e) => [e.homeTeam, e.awayTeam]),
      ),
      fetchedAt,
    };
  }

  try {
    const chunks = await Promise.all(
      sportList.map((sport) => fetchSportOdds(sport, apiKey)),
    );
    const events = chunks.flat().filter((e) => e.bookmakers.length > 0);
    return {
      source: "live",
      events,
      snapshots: MOCK_SNAPSHOTS,
      stats: getMockStats(
        events.flatMap((e) => [e.homeTeam, e.awayTeam]),
      ),
      fetchedAt,
    };
  } catch {
    const events = getMockEvents(sportList as never);
    return {
      source: "mock",
      events,
      snapshots: MOCK_SNAPSHOTS,
      stats: getMockStats(
        events.flatMap((e) => [e.homeTeam, e.awayTeam]),
      ),
      fetchedAt,
    };
  }
}
