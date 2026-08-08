import Link from "next/link";
import { SourceBadge } from "@/components/SourceBadge";
import { StatPill } from "@/components/StatPill";
import { formatAmerican, formatPercent } from "@/lib/odds/convert";
import { loadOddsBundle } from "@/lib/odds/provider";
import { rankEdges } from "@/lib/edge/ev";
import { suggestParlays } from "@/lib/edge/parlay";
import { detectSteam } from "@/lib/edge/steam";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { unitStake } from "@/lib/bankroll/kelly";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const bundle = await loadOddsBundle(DEFAULT_SETTINGS.sports);
  const edges = rankEdges(bundle.events, DEFAULT_SETTINGS.minEvPercent);
  const parlays = suggestParlays(edges, {
    maxLegs: DEFAULT_SETTINGS.maxParlayLegs,
    bankroll: DEFAULT_SETTINGS.bankroll,
    kellyFraction: DEFAULT_SETTINGS.kellyFraction,
    limit: 3,
  });
  const steam = detectSteam(bundle.snapshots).slice(0, 3);
  const unit = unitStake(
    DEFAULT_SETTINGS.bankroll,
    DEFAULT_SETTINGS.unitPercent,
  );
  const top = edges[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
            Desk
          </h1>
          <p className="mt-1 text-muted">
            Best viable options from today&apos;s board.
          </p>
        </div>
        <SourceBadge source={bundle.source} fetchedAt={bundle.fetchedAt} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Events" value={String(bundle.events.length)} />
        <StatPill
          label="+EV singles"
          value={String(edges.length)}
          tone="positive"
        />
        <StatPill
          label="Top EV"
          value={top ? `+${formatPercent(top.evPercent / 100)}` : "—"}
          tone="accent"
        />
        <StatPill label="Unit size" value={`$${unit.toFixed(0)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="animate-rise rounded-xl border border-line bg-panel/60 p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl">
              Best single
            </h2>
            <Link href="/edges" className="text-sm text-accent hover:underline">
              All edges
            </Link>
          </div>
          {top ? (
            <div>
              <div className="text-sm text-muted">{top.sportTitle}</div>
              <div className="mt-1 text-2xl font-semibold">
                {top.awayTeam} @ {top.homeTeam}
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                    Selection
                  </div>
                  <div className="mt-1 text-lg">
                    {top.selection}
                    {top.point !== undefined
                      ? ` ${top.point > 0 ? "+" : ""}${top.point}`
                      : ""}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                    Book / price
                  </div>
                  <div className="mt-1 font-mono text-lg text-accent">
                    {top.bookTitle} {formatAmerican(top.price)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
                    Expected value
                  </div>
                  <div className="mt-1 font-mono text-lg text-positive">
                    +{formatPercent(top.evPercent / 100)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted">No edges above threshold.</p>
          )}
        </div>

        <div className="animate-rise rounded-xl border border-line bg-panel/60 p-5 lg:col-span-2" style={{ animationDelay: "80ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl">
              Steam
            </h2>
            <Link href="/trades" className="text-sm text-accent hover:underline">
              Trades
            </Link>
          </div>
          <ul className="space-y-3">
            {steam.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-lg border border-line/80 bg-elevated/50 px-3 py-2 text-sm ${
                  alert.severity === "steam" ? "animate-steam border-warn/40" : ""
                }`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{alert.selection}</span>
                  <span className="font-mono text-warn">
                    {alert.move > 0 ? "+" : ""}
                    {alert.move}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {alert.sharpLed ? "Sharp-led" : "Market"} · {alert.market}
                </div>
              </li>
            ))}
            {!steam.length ? (
              <li className="text-sm text-muted">No material movement.</li>
            ) : null}
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Top parlays
          </h2>
          <Link href="/parlay" className="text-sm text-accent hover:underline">
            Parlay Lab
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {parlays.map((p, i) => (
            <div
              key={p.id}
              className="animate-rise rounded-xl border border-line bg-panel/50 p-4"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-accent">
                  {formatAmerican(p.combinedAmerican)}
                </span>
                <span className="font-mono text-positive">
                  +{formatPercent(p.evPercent / 100)}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {p.legs.map((leg, idx) => (
                  <li key={idx}>
                    {leg.selection}
                    {leg.point !== undefined
                      ? ` ${leg.point > 0 ? "+" : ""}${leg.point}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!parlays.length ? (
            <p className="text-muted">No positive-EV parlays found.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl">
          Context
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bundle.stats.slice(0, 6).map((stat) => (
            <div
              key={stat.team}
              className="rounded-xl border border-line bg-elevated/50 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{stat.team}</div>
                <div className="font-mono text-sm text-accent">{stat.record}</div>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.14em] text-muted">
                Form {stat.form} · Pace {stat.pace} · Eff {stat.efficiency}
              </div>
              <p className="mt-2 text-sm text-muted">{stat.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
