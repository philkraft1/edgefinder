import type { SportKey } from "@/lib/odds/types";

export interface AnalyzerSettings {
  bankroll: number;
  kellyFraction: number;
  unitPercent: number;
  minEvPercent: number;
  maxParlayLegs: number;
  sports: SportKey[];
}

export const DEFAULT_SETTINGS: AnalyzerSettings = {
  bankroll: 1000,
  kellyFraction: 0.25,
  unitPercent: 0.01,
  minEvPercent: 1.5,
  maxParlayLegs: 4,
  sports: ["americanfootball_nfl", "basketball_nba", "baseball_mlb"],
};

const STORAGE_KEY = "edgefinder-settings";

export function loadSettings(): AnalyzerSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AnalyzerSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
