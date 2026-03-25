// app/api/projects/[id]/ideas/route.ts
// POST — link an idea to a project
// (DELETE is handled at /api/projects/[id]/ideas/[ideaId]/route.ts)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Verify the project belongs to the user
  const project = await prisma.project.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ideaId } = await req.json();
  if (!ideaId) return NextResponse.json({ error: "ideaId required" }, { status: 400 });

  // Verify the idea belongs to the user
  const idea = await prisma.idea.findFirst({ where: { id: ideaId, userId } });
  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  await prisma.ideaProject.upsert({
    where: { ideaId_projectId: { ideaId, projectId: params.id } },
    update: {},
    create: { ideaId, projectId: params.id },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
