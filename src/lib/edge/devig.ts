import { americanToImplied } from "@/lib/odds/convert";

/**
 * Multiplicative (proportional) vig removal.
 * Normalizes implied probabilities so they sum to 1.
 */
export function multiplicativeDevig(americanPrices: number[]): number[] {
  const implied = americanPrices.map(americanToImplied);
  const total = implied.reduce((a, b) => a + b, 0);
  if (total <= 0) return americanPrices.map(() => 1 / americanPrices.length);
  return implied.map((p) => p / total);
}

/**
 * Power method approximation: find exponent k such that sum(p_i^k) ≈ 1.
 */
export function powerDevig(americanPrices: number[]): number[] {
  const implied = americanPrices.map(americanToImplied);
  let lo = 0.5;
  let hi = 2.5;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const sum = implied.reduce((acc, p) => acc + Math.pow(p, mid), 0);
    if (sum > 1) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;
  const powered = implied.map((p) => Math.pow(p, k));
  const total = powered.reduce((a, b) => a + b, 0);
  return powered.map((p) => p / total);
}

/** Prefer power method; fall back to multiplicative for degenerate lines. */
export function fairProbabilities(americanPrices: number[]): number[] {
  if (americanPrices.length < 2) {
    return americanPrices.map((p) => americanToImplied(p));
  }
  try {
    const powered = powerDevig(americanPrices);
    if (powered.every((p) => Number.isFinite(p) && p > 0)) return powered;
  } catch {
    /* fall through */
  }
  return multiplicativeDevig(americanPrices);
}
