// app/garden/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Garden layout — wraps all /garden/* routes.
// Renders the top navigation bar with logo, links, and sign-out button.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export default function GardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment">
      {/* ── Navigation bar ─────────────────────────────────────────────── */}
      <nav className="border-b border-parchment-border bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Wordmark */}
          <Link href="/garden" className="font-serif text-xl text-ink tracking-tight hover:text-ink-light transition-colors">
            Stoa
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-sm text-ink-muted">
            <Link href="/garden" className="hover:text-ink transition-colors">
              Garden
            </Link>
            <Link href="/garden/projects" className="hover:text-ink transition-colors">
              Projects
            </Link>
            <Link href="/garden/graph" className="hover:text-ink transition-colors">
              Graph
            </Link>
            <Link href="/agora" className="hover:text-ink transition-colors">
              Agora
            </Link>
            <Link href="/garden/admin/flagged" className="hover:text-ink transition-colors text-xs opacity-60">
              Admin
            </Link>
          </div>

          {/* Sign out */}
          <SignOutButton />
        </div>
      </nav>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
