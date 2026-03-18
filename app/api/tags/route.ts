// app/api/tags/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/tags   — list tags for the current user (with optional search)
// POST /api/tags   — create a new tag
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── GET /api/tags ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q"); // optional search query from TagInput autocomplete

  const tags = await prisma.tag.findMany({
    where: {
      userId,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    take: 10, // limit dropdown results
  });

  return NextResponse.json(tags);
}

// ── POST /api/tags ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  // upsert: if a tag with this slug already exists for this user, return it
  const tag = await prisma.tag.upsert({
    where: { slug_userId: { slug, userId } },
    update: {},
    create: { name, slug, userId },
  });

  return NextResponse.json(tag, { status: 201 });
}
