/**
 * Full Kelly fraction for a binary bet.
 * b = decimal odds - 1 (net fractional payout)
 * p = true win probability
 * q = 1 - p
 */
export function kellyFraction(decimalOdds: number, trueProb: number): number {
  const b = decimalOdds - 1;
  if (b <= 0 || trueProb <= 0 || trueProb >= 1) return 0;
  const q = 1 - trueProb;
  const f = (b * trueProb - q) / b;
  return Math.max(0, f);
}

/** Fractional Kelly stake in dollars */
export function kellyStake(
  bankroll: number,
  decimalOdds: number,
  trueProb: number,
  fraction = 0.25,
): number {
  const full = kellyFraction(decimalOdds, trueProb);
  return Math.max(0, Math.round(bankroll * full * fraction * 100) / 100);
}

export function unitStake(bankroll: number, unitPercent = 0.01): number {
  return Math.max(1, Math.round(bankroll * unitPercent * 100) / 100);
}
