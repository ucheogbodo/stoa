// app/api/projects/[id]/files/route.ts
// POST /api/projects/[id]/files — upload a reference file to a project
// GET  /api/projects/[id]/files — list all files in a project

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const project = await prisma.project.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const files = await prisma.projectFile.findMany({
    where: { projectId: params.id },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(files);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const project = await prisma.project.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Read multipart form data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // In a full implementation this would stream to Supabase Storage.
  // For now we record the metadata and use a placeholder storageUrl.
  // The /api/projects/[id]/files/upload-url endpoint would return a presigned URL.
  const storageUrl = `projects/${params.id}/${Date.now()}-${file.name}`;

  const projectFile = await prisma.projectFile.create({
    data: {
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      storageUrl,
      sizeBytes: file.size,
      projectId: params.id,
    },
  });

  return NextResponse.json(projectFile, { status: 201 });
}
