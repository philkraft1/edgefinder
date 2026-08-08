import type {
  BookKey,
  BookmakerOdds,
  EventOdds,
  LineSnapshot,
  MarketKey,
  SportKey,
  TeamStats,
} from "@/lib/odds/types";
import { BOOK_TITLES } from "@/lib/odds/types";

const BOOKS: BookKey[] = [
  "pinnacle",
  "draftkings",
  "fanduel",
  "betmgm",
  "williamhill_us",
];

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

function bookmakersFor(
  home: string,
  away: string,
  ml: { home: number; away: number },
  spread: { line: number; home: number; away: number },
  total: { line: number; over: number; under: number },
  softBump: Partial<Record<BookKey, number>> = {},
): BookmakerOdds[] {
  return BOOKS.map((key) => {
    const bump = softBump[key] ?? (key === "pinnacle" ? 0 : 8 + (key.length % 5));
    // Soft books get slightly worse prices; one soft book gets a juicy outlier for +EV demos
    const juice = key === "pinnacle" ? 0 : bump;
    const outlier = softBump[key] ?? 0;

    const homeMl = ml.home + (key === "pinnacle" ? 0 : juice) + outlier;
    const awayMl = ml.away - (key === "pinnacle" ? 0 : Math.floor(juice / 2));

    return {
      key,
      title: BOOK_TITLES[key],
      markets: [
        {
          key: "h2h" as MarketKey,
          lastUpdate: new Date().toISOString(),
          outcomes: [
            { name: home, price: homeMl },
            { name: away, price: awayMl },
          ],
        },
        {
          key: "spreads" as MarketKey,
          lastUpdate: new Date().toISOString(),
          outcomes: [
            {
              name: home,
              price: spread.home + (key === "draftkings" ? outlier : 0),
              point: -spread.line,
            },
            {
              name: away,
              price: spread.away,
              point: spread.line,
            },
          ],
        },
        {
          key: "totals" as MarketKey,
          lastUpdate: new Date().toISOString(),
          outcomes: [
            {
              name: "Over",
              price: total.over + (key === "fanduel" ? Math.max(0, outlier) : 0),
              point: total.line,
            },
            {
              name: "Under",
              price: total.under,
              point: total.line,
            },
          ],
        },
      ],
    };
  });
}

const MOCK_EVENTS: EventOdds[] = [
  {
    id: "nfl-kc-buf",
    sportKey: "americanfootball_nfl",
    sportTitle: "NFL",
    commenceTime: hoursFromNow(30),
    homeTeam: "Buffalo Bills",
    awayTeam: "Kansas City Chiefs",
    bookmakers: bookmakersFor(
      "Buffalo Bills",
      "Kansas City Chiefs",
      { home: -125, away: 105 },
      { line: 2.5, home: -110, away: -110 },
      { line: 48.5, over: -108, under: -112 },
      { draftkings: 18, fanduel: -5 },
    ),
  },
  {
    id: "nfl-phi-dal",
    sportKey: "americanfootball_nfl",
    sportTitle: "NFL",
    commenceTime: hoursFromNow(32),
    homeTeam: "Dallas Cowboys",
    awayTeam: "Philadelphia Eagles",
    bookmakers: bookmakersFor(
      "Dallas Cowboys",
      "Philadelphia Eagles",
      { home: 145, away: -170 },
      { line: 3.5, home: -105, away: -115 },
      { line: 46.5, over: -110, under: -110 },
      { betmgm: 22 },
    ),
  },
  {
    id: "nba-bos-nyk",
    sportKey: "basketball_nba",
    sportTitle: "NBA",
    commenceTime: hoursFromNow(8),
    homeTeam: "New York Knicks",
    awayTeam: "Boston Celtics",
    bookmakers: bookmakersFor(
      "New York Knicks",
      "Boston Celtics",
      { home: 130, away: -150 },
      { line: 3.5, home: -108, away: -112 },
      { line: 218.5, over: -110, under: -110 },
      { fanduel: 25, williamhill_us: 10 },
    ),
  },
  {
    id: "nba-den-lal",
    sportKey: "basketball_nba",
    sportTitle: "NBA",
    commenceTime: hoursFromNow(10),
    homeTeam: "Los Angeles Lakers",
    awayTeam: "Denver Nuggets",
    bookmakers: bookmakersFor(
      "Los Angeles Lakers",
      "Denver Nuggets",
      { home: -115, away: -105 },
      { line: 1.5, home: -110, away: -110 },
      { line: 224.5, over: -105, under: -115 },
      { draftkings: 20 },
    ),
  },
  {
    id: "mlb-nyy-bos",
    sportKey: "baseball_mlb",
    sportTitle: "MLB",
    commenceTime: hoursFromNow(5),
    homeTeam: "Boston Red Sox",
    awayTeam: "New York Yankees",
    bookmakers: bookmakersFor(
      "Boston Red Sox",
      "New York Yankees",
      { home: -120, away: 100 },
      { line: 1.5, home: -150, away: 130 },
      { line: 8.5, over: -115, under: -105 },
      { betmgm: 16, fanduel: 12 },
    ),
  },
  {
    id: "mlb-lad-sd",
    sportKey: "baseball_mlb",
    sportTitle: "MLB",
    commenceTime: hoursFromNow(6),
    homeTeam: "San Diego Padres",
    awayTeam: "Los Angeles Dodgers",
    bookmakers: bookmakersFor(
      "San Diego Padres",
      "Los Angeles Dodgers",
      { home: 110, away: -130 },
      { line: 1.5, home: 105, away: -125 },
      { line: 7.5, over: -110, under: -110 },
      { williamhill_us: 19 },
    ),
  },
];

export const MOCK_STATS: TeamStats[] = [
  {
    team: "Buffalo Bills",
    sportKey: "americanfootball_nfl",
    record: "11-3",
    form: "WWLWW",
    pace: 64,
    efficiency: 112,
    note: "Top-5 EPA offense; home dog rarely this short vs KC.",
  },
  {
    team: "Kansas City Chiefs",
    sportKey: "americanfootball_nfl",
    record: "10-4",
    form: "WLWWW",
    pace: 61,
    efficiency: 108,
    note: "Road ATS fade after short weeks in mock sample.",
  },
  {
    team: "Boston Celtics",
    sportKey: "basketball_nba",
    record: "42-18",
    form: "WWWWW",
    pace: 98,
    efficiency: 118,
    note: "Elite net rating; Knicks total often under in rivalry spots.",
  },
  {
    team: "New York Knicks",
    sportKey: "basketball_nba",
    record: "38-22",
    form: "WLWLW",
    pace: 96,
    efficiency: 114,
    note: "Half-court defense suppresses pace vs Boston.",
  },
  {
    team: "New York Yankees",
    sportKey: "baseball_mlb",
    record: "71-48",
    form: "WWLWL",
    pace: 4.6,
    efficiency: 109,
    note: "Strong road run differential; F5 markets volatile.",
  },
  {
    team: "Los Angeles Dodgers",
    sportKey: "baseball_mlb",
    record: "74-45",
    form: "LWWWW",
    pace: 4.8,
    efficiency: 112,
    note: "Rotation depth keeps under in play more often midweek.",
  },
];

function buildSnapshots(): LineSnapshot[] {
  const snaps: LineSnapshot[] = [];
  const openAt = new Date(Date.now() - 36 * 3600_000).toISOString();
  const now = new Date().toISOString();

  const moves: {
    eventId: string;
    market: MarketKey;
    selection: string;
    point?: number;
    open: number;
    current: number;
  }[] = [
    {
      eventId: "nfl-kc-buf",
      market: "h2h",
      selection: "Buffalo Bills",
      open: -110,
      current: -125,
    },
    {
      eventId: "nfl-kc-buf",
      market: "spreads",
      selection: "Buffalo Bills",
      point: -2.5,
      open: -105,
      current: -115,
    },
    {
      eventId: "nba-bos-nyk",
      market: "totals",
      selection: "Under",
      point: 218.5,
      open: -102,
      current: -115,
    },
    {
      eventId: "mlb-nyy-bos",
      market: "h2h",
      selection: "New York Yankees",
      open: -115,
      current: 100,
    },
    {
      eventId: "nba-den-lal",
      market: "spreads",
      selection: "Los Angeles Lakers",
      point: -1.5,
      open: -120,
      current: -105,
    },
  ];

  for (const m of moves) {
    for (const book of BOOKS) {
      const sharpLead = book === "pinnacle" ? 4 : 0;
      const softLag = book === "pinnacle" ? 0 : 3;
      snaps.push({
        eventId: m.eventId,
        market: m.market,
        selection: m.selection,
        point: m.point,
        book,
        price: m.open + softLag,
        capturedAt: openAt,
        phase: "open",
      });
      snaps.push({
        eventId: m.eventId,
        market: m.market,
        selection: m.selection,
        point: m.point,
        book,
        price: m.current - sharpLead + (book === "pinnacle" ? 0 : 2),
        capturedAt: now,
        phase: "current",
      });
    }
  }

  return snaps;
}

export const MOCK_SNAPSHOTS = buildSnapshots();

export function getMockEvents(sports?: SportKey[]): EventOdds[] {
  if (!sports?.length) return MOCK_EVENTS;
  return MOCK_EVENTS.filter((e) => sports.includes(e.sportKey));
}

export function getMockStats(teams?: string[]): TeamStats[] {
  if (!teams?.length) return MOCK_STATS;
  const set = new Set(teams);
  return MOCK_STATS.filter((s) => set.has(s.team));
}
