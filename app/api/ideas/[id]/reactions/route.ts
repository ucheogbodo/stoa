// app/api/ideas/[id]/reactions/route.ts
// GET  /api/ideas/[id]/reactions — returns emoji → count map for the idea.
// POST /api/ideas/[id]/reactions — adds an anonymous reaction. No auth required.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMOJIS = new Set(["💡", "🔥", "🌱"]);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const reactions = await prisma.reaction.groupBy({
    by: ["emoji"],
    where: { ideaId: params.id },
    _count: { emoji: true },
  });

  const counts: Record<string, number> = { "💡": 0, "🔥": 0, "🌱": 0 };
  for (const r of reactions) {
    counts[r.emoji] = r._count.emoji;
  }

  return NextResponse.json(counts);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const emoji: unknown = body.emoji;

  if (typeof emoji !== "string" || !ALLOWED_EMOJIS.has(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  // Ensure the idea exists and is published
  const idea = await prisma.idea.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    select: { id: true },
  });

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  await prisma.reaction.create({
    data: { ideaId: params.id, emoji },
  });

  return NextResponse.json({ ok: true });
}
