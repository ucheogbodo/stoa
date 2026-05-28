// app/api/projects/[id]/files/[fileId]/route.ts
// GET /api/projects/[id]/files/[fileId] — Securely download a project reference file.
// Authenticates the request and verifies project ownership before streaming file from disk.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

type Params = { params: { id: string; fileId: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
  }

  // 2. Fetch file metadata
  const file = await prisma.projectFile.findFirst({
    where: { id: params.fileId, projectId: params.id },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // 3. Locate and read physical file from secure uploads directory
  const filePath = path.join(process.cwd(), "uploads", file.storageUrl);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);

    // Stream file response
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
      },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
