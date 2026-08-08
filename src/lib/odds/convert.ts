/** American odds → decimal odds */
export function americanToDecimal(american: number): number {
  if (american === 0) return 1;
  if (american > 0) return 1 + american / 100;
  return 1 + 100 / Math.abs(american);
}

/** Decimal odds → American odds */
export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) return -10000;
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

/** American odds → raw implied probability (includes vig) */
export function americanToImplied(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

/** Probability → American odds */
export function probabilityToAmerican(p: number): number {
  const clamped = Math.min(0.999, Math.max(0.001, p));
  if (clamped >= 0.5) return Math.round((-100 * clamped) / (1 - clamped));
  return Math.round((100 * (1 - clamped)) / clamped);
}

/** Combine independent decimal odds into a parlay decimal */
export function combineDecimalOdds(decimals: number[]): number {
  return decimals.reduce((acc, d) => acc * d, 1);
}

export function formatAmerican(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}
