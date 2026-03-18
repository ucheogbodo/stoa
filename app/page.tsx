// app/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root page — redirects to /garden if signed in, otherwise to /login.
// The middleware also handles this, but this gives a clean entry point.
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/garden");
  } else {
    redirect("/login");
  }
}
