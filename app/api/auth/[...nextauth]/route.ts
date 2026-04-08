// app/api/auth/[...nextauth]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// NextAuth catch-all API route.
// This handles all auth endpoints automatically:
//   GET/POST /api/auth/signin
//   GET/POST /api/auth/signout
//   GET      /api/auth/session
//   GET      /api/auth/csrf
//   POST     /api/auth/callback/credentials
// ─────────────────────────────────────────────────────────────────────────────

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

// Next.js App Router requires named exports for HTTP methods
export { handler as GET, handler as POST };
