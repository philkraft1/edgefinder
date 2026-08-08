export type SportKey = string;

export type MarketKey = "h2h" | "spreads" | "totals";

export type BookKey = string;

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

export const BOOK_TITLES: Record<string, string> = {
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  betmgm: "BetMGM",
  williamhill_us: "Caesars",
  pinnacle: "Pinnacle",
  bovada: "Bovada",
  betrivers: "BetRivers",
  mybookieag: "MyBookie.ag",
  betonlineag: "BetOnline.ag",
  lowvig: "LowVig.ag",
  betus: "BetUS",
};

export const SPORT_TITLES: Record<string, string> = {
  americanfootball_nfl: "NFL",
  basketball_nba: "NBA",
  baseball_mlb: "MLB",
  basketball_wnba: "WNBA",
  soccer_usa_mls: "MLS",
  soccer_brazil_campeonato: "Brazil Série A",
  soccer_brazil_serie_b: "Brazil Série B",
  soccer_argentina_primera_division: "Argentina Primera",
  soccer_chile_campeonato: "Chile Primera",
  soccer_portugal_primeira_liga: "Portugal Primeira",
  tennis_atp_canadian_open: "ATP Canadian Open",
  mma_mixed_martial_arts: "MMA",
  boxing_boxing: "Boxing",
  americanfootball_cfl: "CFL",
};

/** Sports fetched when a live Odds API key is present */
export const DEFAULT_LIVE_SPORTS: SportKey[] = [
  "baseball_mlb",
  "basketball_nba",
  "basketball_wnba",
  "americanfootball_nfl",
  "soccer_usa_mls",
  "soccer_brazil_campeonato",
  "soccer_argentina_primera_division",
  "mma_mixed_martial_arts",
  "boxing_boxing",
];

export const LIVE_BOOKMAKERS =
  "draftkings,fanduel,betmgm,williamhill_us,pinnacle,bovada,betrivers,mybookieag,betonlineag,lowvig,betus";

export const SHARP_BOOK: BookKey = "pinnacle";
