// app/api/ideas/[id]/verify/route.ts
// POST /api/ideas/[id]/verify — triggers a manual verification re-check

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashContent, checkForDuplicates } from "@/lib/verification";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const idea = await prisma.idea.findFirst({ where: { id: params.id, userId } });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentHash = hashContent(idea.body);
  const duplicateId = await checkForDuplicates(contentHash, idea.id);

  const newStatus = duplicateId ? "REVIEW" : "VERIFIED";
  const reason = duplicateId
    ? `Near-duplicate content detected (matched idea: ${duplicateId})`
    : "No duplicates found";

  const [updated] = await Promise.all([
    prisma.idea.update({
      where: { id: idea.id },
      data: { contentHash, verificationStatus: newStatus },
    }),
    prisma.verificationEvent.create({
      data: { ideaId: idea.id, status: newStatus, reason },
    }),
  ]);

  return NextResponse.json({ verificationStatus: updated.verificationStatus, reason });
}
