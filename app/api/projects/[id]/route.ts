// app/api/projects/[id]/route.ts
// GET, PATCH, DELETE for a single project

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

async function getOwnedProject(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
  });
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
    include: {
      ideas: {
        include: { idea: { select: { id: true, title: true, status: true, updatedAt: true } } },
      },
      files: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const project = await getOwnedProject(userId, params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, description } = await req.json();
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      description: description !== undefined ? description?.trim() ?? null : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const project = await getOwnedProject(userId, params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
