# EdgeFinder

Sportsbook analyzer for finding the most viable singles and parlays.

EdgeFinder shops odds across books, de-vigs against a sharp reference (Pinnacle when available), ranks **+EV** opportunities, suggests correlation-aware parlays, and surfaces line-movement / steam alerts.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API key required — the app ships with a deterministic **mock feed** for NFL, NBA, and MLB.

## Live odds (optional)

1. Copy `.env.example` → `.env.local`
2. Add a key from [The Odds API](https://the-odds-api.com):

```env
ODDS_API_KEY=your_key_here
```

3. Restart `npm run dev`

When the key is present, odds refresh from the live API. Steam timelines still use snapshot demos until historical opens are wired.

## What’s inside

| Area | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Brand + CTA |
| Desk | `/dashboard` | Best single, steam, parlays, stats |
| Edges | `/edges` | +EV ranking + best-price board |
| Parlay Lab | `/parlay` | Auto suggestions + manual builder |
| Trades | `/trades` | Open→current movement / steam |
| Settings | `/settings` | Bankroll, Kelly, min EV, sports |

### Engines

- `src/lib/edge/devig.ts` — multiplicative + power-method vig removal
- `src/lib/edge/ev.ts` — fair odds & EV ranking
- `src/lib/edge/parlay.ts` — beam-style parlay search with correlation flags
- `src/lib/edge/steam.ts` — sharp-led movement detection
- `src/lib/bankroll/kelly.ts` — fractional Kelly stakes

## Disclaimer

EdgeFinder is an analysis tool only. It does not place bets. Odds and edges can be wrong or stale. Gambling involves risk — bet responsibly and confirm prices at your book.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```
