import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16 md:px-10">
        <p className="animate-rise text-xs uppercase tracking-[0.35em] text-muted">
          Live · Sportsbook · Parlays
        </p>
        <h1 className="animate-rise mt-4 font-[family-name:var(--font-display)] text-6xl font-extrabold leading-[0.92] tracking-tight text-accent sm:text-7xl md:text-8xl">
          EdgeFinder
        </h1>
        <p
          className="animate-rise mt-6 max-w-xl text-lg text-foreground/90 md:text-xl"
          style={{ animationDelay: "80ms" }}
        >
          Find the most viable live bet.
        </p>
        <div
          className="animate-rise mt-10 flex flex-wrap items-center gap-4"
          style={{ animationDelay: "140ms" }}
        >
          <Link
            href="/live?window=live"
            className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-[#10140f] transition hover:bg-accent-dim"
          >
            Open live desk
          </Link>
          <Link
            href="/parlay?window=live&mode=sameBook"
            className="rounded-md border border-line px-6 py-3 text-sm text-muted transition hover:border-accent/40 hover:text-foreground"
          >
            Live parlays
          </Link>
        </div>
        <p
          className="animate-rise mt-16 max-w-md text-xs leading-relaxed text-muted"
          style={{ animationDelay: "220ms" }}
        >
          Analysis only — EdgeFinder does not place wagers. Always confirm lines
          at your book. Gambling involves risk; bet responsibly.
        </p>
      </div>
    </main>
  );
}
