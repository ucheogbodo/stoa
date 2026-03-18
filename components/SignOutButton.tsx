// components/SignOutButton.tsx
// A client component for the sign-out button in the nav.
// Must be client-side because `signOut` is a NextAuth client function.

"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-ink-muted hover:text-ink transition-colors"
    >
      Sign out
    </button>
  );
}
