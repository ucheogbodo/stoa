// app/api/profile/[userId]/route.ts
// GET /api/profile/[userId]
// Returns the public profile for a given user.
// Only returns data if profilePublic = true. No auth required.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      profilePublic: true,
      inscription: true,
      epigraph: true,
      intellectualLineage: true,
      epistemicStance: true,
      intellectualSeasons: true,
      unresolvedQuestions: true,
      // Garden Gate counts
      ideas: {
        where: { status: "PUBLISHED" },
        select: { status: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!user.profilePublic) {
    return NextResponse.json({ error: "Profile is private" }, { status: 403 });
  }

  // Compute Garden Gate counts
  const allIdeas = await prisma.idea.findMany({
    where: { userId: params.userId },
    select: { status: true },
  });

  const counts = {
    seed: allIdeas.filter((i) => i.status === "SEED").length,
    growing: allIdeas.filter((i) => i.status === "GROWING").length,
    published: allIdeas.filter((i) => i.status === "PUBLISHED").length,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ideas: _ideas, ...profile } = user;

  return NextResponse.json({ ...profile, gardenGate: counts });
}
