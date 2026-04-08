// app/garden/layout.tsx
// Garden layout — top nav with wordmark, centered links, right controls.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function GardenLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.email === (process.env.SEED_ADMIN_EMAIL ?? "admin@stoa.local");

  const navLinks = [
    { href: "/garden",                  label: "Garden"    },
    { href: "/garden/projects",         label: "Projects"  },
    { href: "/garden/graph",            label: "Graph"     },
    { href: "/agora",                   label: "Agora"     },
    { href: "/garden/settings/profile", label: "Profile"   },
    { href: "/garden/vestibule",        label: "Vestibule" },
  ];

  return (
    <div className="min-h-screen bg-parchment">
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="border-b border-parchment-border/70 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

          {/* Wordmark */}
          <Link
            href="/garden"
            className="font-serif text-xl text-ink tracking-tight hover:text-sage transition-colors duration-200 shrink-0"
          >
            Stoa
          </Link>

          {/* Center nav */}
          <div className="flex items-center gap-1 text-sm text-ink-muted overflow-x-auto no-scrollbar">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-ink hover:bg-parchment-dark transition-all duration-150
                           px-3 py-1.5 rounded-lg whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/garden/admin/flagged"
                className="hover:text-ink hover:bg-parchment-dark transition-all duration-150
                           px-3 py-1.5 rounded-lg whitespace-nowrap text-xs opacity-50"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 shrink-0">
            <SearchBar />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
