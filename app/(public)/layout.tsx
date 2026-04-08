// app/(public)/layout.tsx
// Public layout — minimal, reader-focused nav for Agora visitors.

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
      {/* Nav */}
      <header className="border-b border-parchment-border/70 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-xl text-ink hover:text-sage transition-colors duration-200"
          >
            Stoa
          </Link>

          <nav className="flex items-center gap-1 text-sm text-ink-muted">
            {[
              { href: "/agora",              label: "Encounter" },
              { href: "/agora/browse",       label: "Browse"    },
              { href: "/agora/discussions",  label: "Discourse" },
              { href: "/login",              label: "Garden"    },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-ink hover:bg-parchment-dark transition-all duration-150
                           px-3 py-1.5 rounded-lg"
              >
                {label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-parchment-border/50 px-6 py-8 text-center text-xs text-ink-muted/50 tracking-wide">
        Ideas are seeds. Share them freely.
      </footer>
    </div>
  );
}
