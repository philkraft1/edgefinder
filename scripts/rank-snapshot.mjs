/** Rank edges + parlays from a pasted Odds API snapshot (no API key needed). */
import { readFileSync, writeFileSync } from "fs";

const americanToImplied = (a) =>
  a > 0 ? 100 / (a + 100) : Math.abs(a) / (Math.abs(a) + 100);
const americanToDecimal = (a) =>
  a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a);
const decimalToAmerican = (d) =>
  d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
const fmt = (a) => (a > 0 ? `+${a}` : `${a}`);

function fairProbs(prices) {
  const implied = prices.map(americanToImplied);
  let lo = 0.5,
    hi = 2.5;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const sum = implied.reduce((s, p) => s + Math.pow(p, mid), 0);
    if (sum > 1) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;
  const powered = implied.map((p) => Math.pow(p, k));
  const t = powered.reduce((a, b) => a + b, 0);
  return powered.map((p) => p / t);
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// Extreme live / nearly decided — skip for parlays
function isExtreme(price) {
  return Math.abs(price) >= 800;
}

const events = JSON.parse(readFileSync("tmp-odds.json", "utf8"));
const edges = [];

for (const ev of events) {
  if (!ev.bookmakers?.length) continue;
  const bySel = new Map();
  for (const b of ev.bookmakers) {
    const m = b.markets.find((x) => x.key === "h2h");
    if (!m) continue;
    for (const o of m.outcomes) {
      const arr = bySel.get(o.name) || [];
      arr.push({ book: b.title, key: b.key, price: o.price });
      bySel.set(o.name, arr);
    }
  }
  const names = [...bySel.keys()];
  if (names.length < 2) continue;
  // Skip events where median prices are extreme (live blowouts)
  const medians = names.map((n) => median(bySel.get(n).map((x) => x.price)));
  if (medians.every((p) => isExtreme(p))) continue;

  const fair = fairProbs(medians);
  const fairMap = Object.fromEntries(names.map((n, i) => [n, fair[i]]));

  for (const [name, quotes] of bySel) {
    if (quotes.length < 2) continue;
    const best = quotes.reduce((a, b) => (a.price > b.price ? a : b));
    if (isExtreme(best.price) && best.price < 0) continue; // skip chalk blowouts
    const p = fairMap[name];
    const dec = americanToDecimal(best.price);
    const evPct = (p * (dec - 1) - (1 - p)) * 100;
    edges.push({
      eventId: ev.id,
      sport: ev.sport_title,
      match: `${ev.away_team} @ ${ev.home_team}`,
      selection: name,
      book: best.book,
      price: best.price,
      books: quotes.length,
      fairPct: +(p * 100).toFixed(1),
      evPct: +evPct.toFixed(2),
      decimal: dec,
      fairProb: p,
    });
  }
}

edges.sort((a, b) => b.evPct - a.evPct);
const pool = edges
  .filter((e) => e.evPct > 0.5 && e.books >= 2 && !isExtreme(e.price))
  .slice(0, 20);

function scoreParlay(legs) {
  const combined = legs.reduce((a, l) => a * l.decimal, 1);
  const fairProb = legs.reduce((a, l) => a * l.fairProb, 1);
  const ev = fairProb * (combined - 1) - (1 - fairProb);
  const events = new Set(legs.map((l) => l.eventId));
  const corr = legs.length - events.size;
  const score = ev * 100 - corr * 2 + events.size * 0.2;
  return {
    legs,
    american: decimalToAmerican(combined),
    decimal: +combined.toFixed(3),
    evPct: +(ev * 100).toFixed(2),
    fairPct: +(fairProb * 100).toFixed(2),
    score: +score.toFixed(2),
    sports: [...new Set(legs.map((l) => l.sport))],
  };
}

const parlays = [];
for (let i = 0; i < pool.length; i++) {
  for (let j = i + 1; j < pool.length; j++) {
    if (pool[i].eventId === pool[j].eventId) continue;
    const two = scoreParlay([pool[i], pool[j]]);
    if (two.evPct > 0) parlays.push(two);
    for (let k = j + 1; k < pool.length; k++) {
      if (
        pool[k].eventId === pool[i].eventId ||
        pool[k].eventId === pool[j].eventId
      )
        continue;
      const three = scoreParlay([pool[i], pool[j], pool[k]]);
      if (three.evPct > 0) parlays.push(three);
    }
  }
}

parlays.sort((a, b) => b.score - a.score);
const topParlays = parlays.slice(0, 8).map((p, idx) => ({
  rank: idx + 1,
  american: fmt(p.american),
  evPct: p.evPct,
  fairWinPct: p.fairPct,
  sports: p.sports,
  legs: p.legs.map(
    (l) =>
      `${l.selection} ${fmt(l.price)} @ ${l.book} (${l.sport}: ${l.match})`,
  ),
}));

const out = {
  topEdges: pool.slice(0, 10).map((e, i) => ({
    rank: i + 1,
    selection: e.selection,
    price: fmt(e.price),
    book: e.book,
    evPct: e.evPct,
    fairPct: e.fairPct,
    match: e.match,
    sport: e.sport,
  })),
  topParlays,
};
writeFileSync("snapshot-analysis.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
