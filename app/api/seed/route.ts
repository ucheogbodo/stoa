// app/api/seed/route.ts
// One-time admin seeding endpoint.
// Uses .env credentials (SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME).
// Blocked in production unless ALLOW_SEED=true is explicitly set.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  // Safety guard: refuse to run in production without an explicit override
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_SEED !== "true"
  ) {
    return NextResponse.json(
      { error: "Seeding is disabled in production." },
      { status: 403 }
    );
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@stoa.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, name, passwordHash },
  });

  return NextResponse.json({ success: true, userId: user.id });
}
