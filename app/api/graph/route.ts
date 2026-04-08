// app/api/graph/route.ts
// GET /api/graph — returns ideas, projects, and all link types for the Knowledge Graph.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const [ideas, ideaLinks, projects, ideaProjects, vestiges] = await Promise.all([
    // Ideas with their tags for cluster halos
    prisma.idea.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        tags: {
          select: { tag: { select: { name: true, slug: true } } },
        },
      },
    }),
    // Idea-to-idea links
    prisma.ideaLink.findMany({
      where: { fromIdea: { userId } },
      select: { fromIdeaId: true, toIdeaId: true },
    }),
    // Projects
    prisma.project.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
    // Idea-to-project links
    prisma.ideaProject.findMany({
      where: { idea: { userId } },
      select: { ideaId: true, projectId: true },
    }),
    // Reconsidered ideas (vestiges) — ghost nodes, no links
    prisma.vestige.findMany({
      where: {
        userId,
        NOT: { title: "" },   // skip truly empty/accidental vestiges
      },
      select: { id: true, title: true, reconsideredAt: true },
    }),
  ]);

  const nodes = [
    ...ideas.map((idea) => ({
      id: idea.id,
      label: idea.title || "Untitled",
      type: "idea" as const,
      status: idea.status,
      tags: idea.tags.map((t) => t.tag.slug),
      tagNames: idea.tags.map((t) => t.tag.name),
    })),
    ...projects.map((project) => ({
      id: project.id,
      label: project.name,
      type: "project" as const,
      status: undefined,
      tags: [] as string[],
      tagNames: [] as string[],
    })),
    ...vestiges.map((v) => ({
      id:       `vestige-${v.id}`,
      label:    v.title,
      type:     "vestige" as const,
      status:   undefined,
      tags:     [] as string[],
      tagNames: [] as string[],
      reconsideredAt: v.reconsideredAt,
    })),
  ];

  const links = [
    ...ideaLinks.map((l) => ({
      source: l.fromIdeaId,
      target: l.toIdeaId,
      type: "idea-idea" as const,
    })),
    ...ideaProjects.map((l) => ({
      source: l.ideaId,
      target: l.projectId,
      type: "idea-project" as const,
    })),
  ];

  return NextResponse.json({ nodes, links });
}
