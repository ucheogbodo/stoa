// app/api/agora/encounter/route.ts
// GET /api/agora/encounter?tagSlug=optional
// Returns one random PUBLISHED + VERIFIED idea for the Agora Encounter mechanic.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tagSlug = req.nextUrl.searchParams.get("tagSlug");

  const where: Prisma.IdeaWhereInput = {
    status: "PUBLISHED",
    verificationStatus: { in: ["VERIFIED", "UNVERIFIED"] },
  };

  if (tagSlug) {
    where.tags = {
      some: {
        tag: { slug: tagSlug },
      },
    };
  }

  // Count matching ideas first so we can pick a random offset
  const count = await prisma.idea.count({ where });
  if (count === 0) {
    return NextResponse.json({ error: "No published ideas found" }, { status: 404 });
  }

  const skip = Math.floor(Math.random() * count);

  const [idea] = await prisma.idea.findMany({
    where,
    skip,
    take: 1,
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      publishedAt: true,
      updatedAt: true,
      user: { select: { name: true, id: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });

  return NextResponse.json(idea);
}
