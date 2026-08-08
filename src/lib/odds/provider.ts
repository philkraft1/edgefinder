import type {
  BookKey,
  BookmakerOdds,
  EventOdds,
  MarketKey,
  SportKey,
} from "@/lib/odds/types";
import { BOOK_TITLES } from "@/lib/odds/types";
import { getMockEvents, MOCK_SNAPSHOTS, getMockStats } from "@/lib/odds/mock";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

const SUPPORTED_BOOKS = new Set<string>([
  "draftkings",
  "fanduel",
  "betmgm",
  "williamhill_us",
  "pinnacle",
]);

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
  const bookmakers: BookmakerOdds[] = raw.bookmakers
    .filter((b) => SUPPORTED_BOOKS.has(b.key))
    .map((b) => ({
      key: b.key as BookKey,
      title: BOOK_TITLES[b.key as BookKey] ?? b.title,
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
    sportKey: raw.sport_key as SportKey,
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
    regions: "us,eu",
    markets: "h2h,spreads,totals",
    oddsFormat: "american",
    bookmakers: "draftkings,fanduel,betmgm,williamhill_us,pinnacle",
  });

  const url = `${ODDS_API_BASE}/sports/${sport}/odds?${params}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
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

export async function loadOddsBundle(sports: SportKey[]): Promise<OddsBundle> {
  const apiKey = process.env.ODDS_API_KEY?.trim();
  const fetchedAt = new Date().toISOString();

  if (!apiKey) {
    const events = getMockEvents(sports);
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
      sports.map((sport) => fetchSportOdds(sport, apiKey)),
    );
    const events = chunks.flat();
    return {
      source: "live",
      events,
      // Live API doesn't include historical opens — keep mock steam demos
      snapshots: MOCK_SNAPSHOTS,
      stats: getMockStats(
        events.flatMap((e) => [e.homeTeam, e.awayTeam]),
      ),
      fetchedAt,
    };
  } catch {
    const events = getMockEvents(sports);
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
