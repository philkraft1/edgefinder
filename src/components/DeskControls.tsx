"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WindowToggle } from "@/components/WindowToggle";
import { BookScopeToggle } from "@/components/BookScopeToggle";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type PreferredBook,
  type TicketMode,
} from "@/lib/settings";
import { parseTimeWindow, type TimeWindow } from "@/lib/odds/window";

export function DeskControls({
  showTicketMode = false,
}: {
  showTicketMode?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [window, setWindow] = useState<TimeWindow>(DEFAULT_SETTINGS.timeWindow);
  const [book, setBook] = useState<PreferredBook>(DEFAULT_SETTINGS.preferredBook);
  const [ticketMode, setTicketMode] = useState<TicketMode>(
    DEFAULT_SETTINGS.ticketMode,
  );

  useEffect(() => {
    const settings = loadSettings();
    const fromUrl = parseTimeWindow(searchParams.get("window"));
    const bookFromUrl = (searchParams.get("book") as PreferredBook | null) ?? settings.preferredBook;
    const modeFromUrl =
      (searchParams.get("mode") as TicketMode | null) ?? settings.ticketMode;
    setWindow(searchParams.get("window") ? fromUrl : settings.timeWindow);
    setBook(bookFromUrl || "any");
    setTicketMode(modeFromUrl === "singles" ? "singles" : "sameBook");
  }, [searchParams]);

  function pushParams(next: {
    window?: TimeWindow;
    book?: PreferredBook;
    mode?: TicketMode;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const w = next.window ?? window;
    const b = next.book ?? book;
    const m = next.mode ?? ticketMode;
    params.set("window", w);
    if (b && b !== "any") params.set("book", b);
    else params.delete("book");
    if (showTicketMode) params.set("mode", m);
    const settings = { ...loadSettings(), timeWindow: w, preferredBook: b, ticketMode: m };
    saveSettings(settings);
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  }

  useEffect(() => {
    if (window !== "live" && window !== "soon") return;
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [window, router]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <WindowToggle
        value={window}
        onChange={(value) => {
          setWindow(value);
          pushParams({ window: value });
        }}
      />
      <BookScopeToggle
        book={book}
        ticketMode={ticketMode}
        showTicketMode={showTicketMode}
        onBookChange={(value) => {
          setBook(value);
          pushParams({ book: value });
        }}
        onTicketModeChange={(value) => {
          setTicketMode(value);
          pushParams({ mode: value });
        }}
      />
    </div>
  );
}
