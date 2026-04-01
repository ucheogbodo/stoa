// app/(public)/layout.tsx
// Clean, reader-focused public layout for the Agora.

import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Stoa — The Agora",
  description: "A curated collection of published ideas, encountered by serendipity.",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* Minimal public nav */}
      <header className="border-b border-parchment-dark px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-ink hover:text-sage transition-colors">
          Stoa
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-muted">
          <Link href="/agora" className="hover:text-ink transition-colors">
            Encounter
          </Link>
          <Link href="/agora/browse" className="hover:text-ink transition-colors">
            Browse
          </Link>
          <Link href="/login" className="hover:text-ink transition-colors">
            Enter Garden
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-parchment-dark px-6 py-6 text-center text-xs text-ink-muted">
        Ideas are seeds. Share them freely.
      </footer>
    </div>
  );
}
