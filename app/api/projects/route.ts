// app/api/projects/route.ts
// GET /api/projects — list all projects for the current user
// POST /api/projects — create a new project

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { ideas: true, files: true } },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      userId: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export const dynamic = "force-dynamic";
