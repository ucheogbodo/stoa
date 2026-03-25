// app/api/ideas/[id]/verification-status/route.ts
// PATCH /api/ideas/[id]/verification-status — admin-only manual status update

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@stoa.local";

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin-only gate
  if ((session.user as { email: string }).email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { verificationStatus, reason } = await req.json();
  const allowed = ["UNVERIFIED", "REVIEW", "VERIFIED", "FLAGGED"];
  if (!allowed.includes(verificationStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [updated] = await Promise.all([
    prisma.idea.update({
      where: { id: params.id },
      data: { verificationStatus },
    }),
    prisma.verificationEvent.create({
      data: {
        ideaId: params.id,
        status: verificationStatus,
        reason: reason ?? `Manually set to ${verificationStatus} by admin`,
      },
    }),
  ]);

  return NextResponse.json({ verificationStatus: updated.verificationStatus });
}
