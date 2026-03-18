// app/api/ideas/[id]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET    /api/ideas/[id]  — fetch a single idea with tags and links
// PATCH  /api/ideas/[id]  — update title, body, status, tags, and links
// DELETE /api/ideas/[id]  — delete an idea
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IdeaStatus } from "@prisma/client";

// Helper: get the idea and verify ownership
async function getOwnedIdea(id: string, userId: string) {
  return prisma.idea.findFirst({ where: { id, userId } });
}

// ── GET /api/ideas/[id] ────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const idea = await prisma.idea.findFirst({
    where: { id: params.id, userId },
    include: {
      tags: { include: { tag: true } },
      linksFrom: {
        include: {
          toIdea: { select: { id: true, title: true, status: true } },
        },
      },
      linksTo: {
        include: {
          fromIdea: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(idea);
}

// ── PATCH /api/ideas/[id] ──────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const idea = await getOwnedIdea(params.id, userId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { title, body: editorBody, status, tagIds, linkedIdeaIds } = body;

  const validStatus =
    status && Object.values(IdeaStatus).includes(status)
      ? (status as IdeaStatus)
      : undefined;

  // Use a Prisma transaction so tags and links update atomically
  const updated = await prisma.$transaction(async (tx) => {

    // 1. Update core fields
    const updatedIdea = await tx.idea.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(editorBody !== undefined ? { body: editorBody } : {}),
        ...(validStatus ? { status: validStatus } : {}),
      },
    });

    // 2. Re-sync tags: delete all existing, then insert the new set
    if (tagIds !== undefined) {
      await tx.ideaTag.deleteMany({ where: { ideaId: params.id } });
      if (tagIds.length > 0) {
        await tx.ideaTag.createMany({
          data: (tagIds as string[]).map((tagId: string) => ({
            ideaId: params.id,
            tagId,
          })),
        });
      }
    }

    // 3. Re-sync linked ideas (we only store links originating FROM this idea)
    if (linkedIdeaIds !== undefined) {
      await tx.ideaLink.deleteMany({ where: { fromIdeaId: params.id } });
      if (linkedIdeaIds.length > 0) {
        await tx.ideaLink.createMany({
          data: (linkedIdeaIds as string[]).map((toId: string) => ({
            fromIdeaId: params.id,
            toIdeaId: toId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updatedIdea;
  });

  // Return the full idea with relations
  const full = await prisma.idea.findUnique({
    where: { id: updated.id },
    include: {
      tags: { include: { tag: true } },
      linksFrom: { include: { toIdea: { select: { id: true, title: true, status: true } } } },
      linksTo: { include: { fromIdea: { select: { id: true, title: true, status: true } } } },
    },
  });

  return NextResponse.json(full);
}

// ── DELETE /api/ideas/[id] ─────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const idea = await getOwnedIdea(params.id, userId);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.idea.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
