export type SportKey = "americanfootball_nfl" | "basketball_nba" | "baseball_mlb";

export type MarketKey = "h2h" | "spreads" | "totals";

export type BookKey =
  | "draftkings"
  | "fanduel"
  | "betmgm"
  | "williamhill_us"
  | "pinnacle";

export interface OutcomeOdds {
  name: string;
  price: number; // American odds
  point?: number;
}

export interface BookMarket {
  key: MarketKey;
  lastUpdate: string;
  outcomes: OutcomeOdds[];
}

export interface BookmakerOdds {
  key: BookKey;
  title: string;
  markets: BookMarket[];
}

export interface EventOdds {
  id: string;
  sportKey: SportKey;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmakers: BookmakerOdds[];
}

export interface TeamStats {
  team: string;
  sportKey: SportKey;
  record: string;
  form: string; // e.g. WWLWW
  pace: number;
  efficiency: number;
  note: string;
}

export interface LineSnapshot {
  eventId: string;
  market: MarketKey;
  selection: string;
  point?: number;
  book: BookKey;
  price: number;
  capturedAt: string;
  phase: "open" | "current";
}

export const BOOK_TITLES: Record<BookKey, string> = {
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  betmgm: "BetMGM",
  williamhill_us: "Caesars",
  pinnacle: "Pinnacle",
};

export const SPORT_TITLES: Record<SportKey, string> = {
  americanfootball_nfl: "NFL",
  basketball_nba: "NBA",
  baseball_mlb: "MLB",
};

export const SHARP_BOOK: BookKey = "pinnacle";
