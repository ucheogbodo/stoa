// app/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root layout — wraps every page in the app.
// Sets up fonts, metadata, and the NextAuth session provider.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Stoa — A Digital Garden",
  description:
    "A private space to cultivate and connect your ideas. Plant seeds of thought, grow them into essays, and share them in the agora.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the session on the server side so we can pass it to the client-side
  // SessionProvider without an extra round-trip.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        {/* Google Fonts are loaded via globals.css @import */}
      </head>
      <body>
        {/* SessionProvider makes the session available to all client components */}
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
