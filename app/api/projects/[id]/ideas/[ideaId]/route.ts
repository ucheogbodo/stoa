// app/api/projects/[id]/ideas/[ideaId]/route.ts
// DELETE — unlink an idea from a project

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string; ideaId: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const project = await prisma.project.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.ideaProject.deleteMany({
    where: { ideaId: params.ideaId, projectId: params.id },
  });

  return new NextResponse(null, { status: 204 });
}
