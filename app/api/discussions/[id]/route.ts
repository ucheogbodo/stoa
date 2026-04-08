// app/api/discussions/[id]/route.ts
// GET /api/discussions/[id] — fetch a single discussion with all its posts (public)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: params.id },
    include: {
      posts: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!discussion) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  return NextResponse.json(discussion);
}
