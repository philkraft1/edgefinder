"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AnalyzerSettings,
} from "@/lib/settings";
import type { SportKey } from "@/lib/odds/types";
import { BOOK_TITLES, SPORT_TITLES } from "@/lib/odds/types";
import type { PreferredBook, TicketMode } from "@/lib/settings";
import type { TimeWindow } from "@/lib/odds/window";

const ALL_SPORTS = Object.keys(SPORT_TITLES) as SportKey[];
const WINDOWS: TimeWindow[] = ["live", "soon", "all"];
const BOOKS: PreferredBook[] = [
  "any",
  "draftkings",
  "fanduel",
  "betmgm",
  "bovada",
  "betrivers",
  "williamhill_us",
  "pinnacle",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AnalyzerSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update<K extends keyof AnalyzerSettings>(
    key: K,
    value: AnalyzerSettings[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleSport(sport: SportKey) {
    setSettings((prev) => {
      const has = prev.sports.includes(sport);
      const sports = has
        ? prev.sports.filter((s) => s !== sport)
        : [...prev.sports, sport];
      return { ...prev, sports: sports.length ? sports : prev.sports };
    });
    setSaved(false);
  }

  function onSave() {
    saveSettings(settings);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-muted">
          Bankroll, risk, and filters stored locally in your browser.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-panel/60 p-5">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Bankroll ($)
          </span>
          <input
            type="number"
            min={50}
            value={settings.bankroll}
            onChange={(e) => update("bankroll", Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-line bg-elevated px-3 py-2 font-mono outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Kelly fraction ({settings.kellyFraction})
          </span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={settings.kellyFraction}
            onChange={(e) => update("kellyFraction", Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Unit size (% of bankroll)
          </span>
          <input
            type="number"
            min={0.25}
            max={5}
            step={0.25}
            value={settings.unitPercent * 100}
            onChange={(e) =>
              update("unitPercent", Number(e.target.value) / 100)
            }
            className="mt-1 w-full rounded-md border border-line bg-elevated px-3 py-2 font-mono outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Min EV %
          </span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={settings.minEvPercent}
            onChange={(e) => update("minEvPercent", Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-line bg-elevated px-3 py-2 font-mono outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Max parlay legs
          </span>
          <input
            type="number"
            min={2}
            max={6}
            value={settings.maxParlayLegs}
            onChange={(e) => update("maxParlayLegs", Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-line bg-elevated px-3 py-2 font-mono outline-none focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Default time window
          </span>
          <select
            value={settings.timeWindow}
            onChange={(e) =>
              update("timeWindow", e.target.value as TimeWindow)
            }
            className="mt-1 w-full rounded-md border border-line bg-elevated px-3 py-2 outline-none focus:border-accent"
          >
            {WINDOWS.map((w) => (
              <option key={w} value={w}>
                {w === "live"
                  ? "Live (in-play only)"
                  : w === "soon"
                    ? "Soon (live + 6h)"
                    : "All upcoming"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Default ticket mode
          </span>
          <select
            value={settings.ticketMode}
            onChange={(e) =>
              update("ticketMode", e.target.value as TicketMode)
            }
            className="mt-1 w-full rounded-md border border-line bg-elevated px-3 py-2 outline-none focus:border-accent"
          >
            <option value="sameBook">Same-book parlays</option>
            <option value="singles">Multi-book singles portfolio</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">
            Preferred book
          </span>
          <select
            value={settings.preferredBook}
            onChange={(e) =>
              update("preferredBook", e.target.value as PreferredBook)
            }
            className="mt-1 w-full rounded-md border border-line bg-elevated px-3 py-2 outline-none focus:border-accent"
          >
            {BOOKS.map((key) => (
              <option key={key} value={key}>
                {key === "any" ? "Any platform" : BOOK_TITLES[key] ?? key}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted">
            Sports
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_SPORTS.map((sport) => {
              const on = settings.sports.includes(sport);
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleSport(sport)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    on
                      ? "border-accent/50 bg-accent/15 text-accent"
                      : "border-line text-muted"
                  }`}
                >
                  {SPORT_TITLES[sport]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-[#10140f]"
          >
            Save settings
          </button>
          {saved ? (
            <span className="text-sm text-positive">Saved locally</span>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-elevated/40 p-5 text-sm text-muted">
        <p className="font-medium text-foreground">Live odds</p>
        <p className="mt-2">
          Copy <code className="text-accent">.env.example</code> to{" "}
          <code className="text-accent">.env.local</code> and set{" "}
          <code className="text-accent">ODDS_API_KEY</code> from{" "}
          <a
            href="https://the-odds-api.com"
            target="_blank"
            rel="noreferrer"
            className="text-info underline"
          >
            the-odds-api.com
          </a>
          . Without a key, EdgeFinder runs on the mock feed.
        </p>
      </section>
    </div>
  );
}
