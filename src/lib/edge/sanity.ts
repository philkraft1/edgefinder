import type { EdgeOpportunity } from "@/lib/edge/ev";

/** Drop absurd in-play chalk/dogs that distort EV and parlays. */
export const EXTREME_PRICE = 1000;

export function isSanePrice(american: number): boolean {
  return Math.abs(american) < EXTREME_PRICE;
}

export function filterSaneEdges(edges: EdgeOpportunity[]): EdgeOpportunity[] {
  return edges.filter((e) => isSanePrice(e.price));
}
