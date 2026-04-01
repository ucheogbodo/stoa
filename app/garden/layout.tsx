// app/garden/layout.tsx
// Garden layout — wraps all /garden/* routes.
// Renders the top navigation bar with logo, links, search, theme toggle, and sign-out.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function GardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin =
    session?.user?.email === (process.env.SEED_ADMIN_EMAIL ?? "admin@stoa.local");

  return (
    <div className="min-h-screen bg-parchment">
      {/* ── Navigation bar ─────────────────────────────────────────────── */}
      <nav className="border-b border-parchment-border bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 grid grid-cols-3 items-center">
          {/* Wordmark (Left) */}
          <div>
            <Link href="/garden" className="font-serif text-xl text-ink tracking-tight hover:text-ink-light transition-colors">
              Stoa
            </Link>
          </div>

          {/* Nav links (Center) */}
          <div className="flex items-center justify-center gap-8 text-sm text-ink-muted">
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
            <Link href="/garden/settings/profile" className="hover:text-ink transition-colors">
              Profile
            </Link>
            {isAdmin && (
              <Link href="/garden/admin/flagged" className="hover:text-ink transition-colors text-xs opacity-60">
                Admin
              </Link>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center justify-end gap-4 shrink-0">
            <SearchBar />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
