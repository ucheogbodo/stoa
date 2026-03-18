// components/SessionProvider.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper around NextAuth's <SessionProvider>.
// This must be a client component ("use client") because SessionProvider uses
// React context under the hood — context is only available in client components.
// We import it here so the server-side root layout can use it.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface Props {
  children: React.ReactNode;
  session: Session | null;
}

export function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
