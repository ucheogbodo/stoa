// app/api/graph/route.ts
// GET /api/graph — returns all ideas + links for the Knowledge Graph visualisation.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const [ideas, links] = await Promise.all([
    prisma.idea.findMany({
      where: { userId },
      select: { id: true, title: true, status: true },
    }),
    prisma.ideaLink.findMany({
      where: { fromIdea: { userId } },
      select: { fromIdeaId: true, toIdeaId: true },
    }),
  ]);

  type IdeaRow = (typeof ideas)[number];
  type LinkRow = (typeof links)[number];
  return NextResponse.json({
    nodes: ideas.map((idea: IdeaRow) => ({ id: idea.id, label: idea.title, status: idea.status })),
    links: links.map((l: LinkRow) => ({ source: l.fromIdeaId, target: l.toIdeaId })),
  });
}
