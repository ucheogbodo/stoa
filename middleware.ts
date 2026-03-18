// middleware.ts (placed in the project root)
// ─────────────────────────────────────────────────────────────────────────────
// Next.js middleware runs on the Edge before every matching request.
// We use it to protect all Garden routes — if you are not signed in,
// you are redirected to /login.
// ─────────────────────────────────────────────────────────────────────────────

export { default } from "next-auth/middleware";

export const config = {
  // Protect everything under /garden — the private workspace
  matcher: ["/garden/:path*"],
};
