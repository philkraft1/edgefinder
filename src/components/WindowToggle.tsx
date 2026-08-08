"use client";

import type { TimeWindow } from "@/lib/odds/window";

const OPTIONS: { value: TimeWindow; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "soon", label: "Soon" },
  { value: "all", label: "All" },
];

export function WindowToggle({
  value,
  onChange,
}: {
  value: TimeWindow;
  onChange: (value: TimeWindow) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-line bg-elevated/80 p-0.5 text-sm"
      role="group"
      aria-label="Time window"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              active
                ? "bg-accent/20 font-semibold text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
