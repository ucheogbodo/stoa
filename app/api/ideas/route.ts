// app/api/ideas/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/ideas   — list all ideas for the current user (with optional search)
// POST /api/ideas   — create a new idea
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IdeaStatus } from "@prisma/client";

// ── GET /api/ideas ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q"); // search query (used by LinkedIdeasPanel)

  const ideas = await prisma.idea.findMany({
    where: {
      userId,
      ...(q
        ? { title: { contains: q, mode: "insensitive" } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20, // cap results for search
  });

  return NextResponse.json(ideas);
}

// ── POST /api/ideas ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const { title, body: editorBody, status, tagIds } = body;

  // Validate status
  const validStatus = Object.values(IdeaStatus).includes(status)
    ? (status as IdeaStatus)
    : IdeaStatus.SEED;

  const idea = await prisma.idea.create({
    data: {
      title: title ?? "Untitled",
      body: editorBody ?? undefined,
      status: validStatus,
      userId,
      // Connect tags using the IdeaTag join table
      tags: {
        create: (tagIds as string[] ?? []).map((tagId: string) => ({
          tag: { connect: { id: tagId } },
        })),
      },
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(idea, { status: 201 });
}

export const dynamic = "force-dynamic";
