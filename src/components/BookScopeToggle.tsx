"use client";

import type { PreferredBook, TicketMode } from "@/lib/settings";
import { BOOK_TITLES } from "@/lib/odds/types";

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

export function BookScopeToggle({
  book,
  ticketMode,
  onBookChange,
  onTicketModeChange,
  showTicketMode = true,
}: {
  book: PreferredBook;
  ticketMode: TicketMode;
  onBookChange: (book: PreferredBook) => void;
  onTicketModeChange: (mode: TicketMode) => void;
  showTicketMode?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {showTicketMode ? (
        <div
          className="inline-flex rounded-lg border border-line bg-elevated/80 p-0.5 text-sm"
          role="group"
          aria-label="Ticket mode"
        >
          <button
            type="button"
            onClick={() => onTicketModeChange("sameBook")}
            className={`rounded-md px-3 py-1.5 ${
              ticketMode === "sameBook"
                ? "bg-accent/20 font-semibold text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Same book
          </button>
          <button
            type="button"
            onClick={() => onTicketModeChange("singles")}
            className={`rounded-md px-3 py-1.5 ${
              ticketMode === "singles"
                ? "bg-accent/20 font-semibold text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Singles portfolio
          </button>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="uppercase tracking-[0.12em] text-[10px]">Book</span>
        <select
          value={book}
          onChange={(e) => onBookChange(e.target.value as PreferredBook)}
          className="rounded-md border border-line bg-panel px-2 py-1.5 text-foreground outline-none focus:border-accent"
        >
          {BOOKS.map((key) => (
            <option key={key} value={key}>
              {key === "any" ? "Any platform" : BOOK_TITLES[key] ?? key}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
