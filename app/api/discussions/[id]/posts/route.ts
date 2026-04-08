// app/api/discussions/[id]/posts/route.ts
// POST /api/discussions/[id]/posts — add a reply to a thread (auth required)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const discussion = await prisma.discussion.findUnique({
    where: { id: params.id },
  });
  if (!discussion) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  const body = await req.json();
  const text = (body.body ?? "").trim();

  if (!text || text.length < 2) {
    return NextResponse.json({ error: "Reply is too short" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Reply must be under 2000 characters" }, { status: 400 });
  }

  const post = await prisma.discussionPost.create({
    data: {
      body: text,
      discussionId: params.id,
      userId,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
