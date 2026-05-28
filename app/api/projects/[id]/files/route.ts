// app/api/projects/[id]/files/route.ts
// POST /api/projects/[id]/files — upload a reference file to a project
// GET  /api/projects/[id]/files — list all files in a project

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

  // Physically save the file content to uploads/ directory
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileId = crypto.randomUUID();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uniqueFilename = `${fileId}-${safeFilename}`;
  const filePath = path.join(uploadsDir, uniqueFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const storageUrl = uniqueFilename;

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
