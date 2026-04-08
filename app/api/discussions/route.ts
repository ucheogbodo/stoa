// app/api/discussions/route.ts
// GET  /api/discussions  — list all discussions (public, no auth)
// POST /api/discussions  — create a new discussion (auth required)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DiscussionWithActivity = Awaited<ReturnType<typeof prisma.discussion.findMany<{
  include: {
    _count: { select: { posts: true } };
    posts: { orderBy: { createdAt: "desc" }; take: 1; select: { createdAt: true } };
  };
}>>>[number];

export async function GET() {
  const discussions = await prisma.discussion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { posts: true } },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  // Sort by most recent activity (last post, falling back to creation date)
  const sorted = discussions.sort((a: DiscussionWithActivity, b: DiscussionWithActivity) => {
    const aDate = a.posts[0]?.createdAt ?? a.createdAt;
    const bDate = b.posts[0]?.createdAt ?? b.createdAt;
    return bDate.getTime() - aDate.getTime();
  });

  const response = sorted.map((d: DiscussionWithActivity) => ({
    id: d.id,
    prompt: d.prompt,
    sourceUrl: d.sourceUrl,
    createdAt: d.createdAt,
    postCount: d._count.posts,
    lastActivityAt: d.posts[0]?.createdAt ?? d.createdAt,
  }));

  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const prompt = (body.prompt ?? "").trim();
  const sourceUrl = (body.sourceUrl ?? "").trim() || null;

  if (!prompt || prompt.length < 5) {
    return NextResponse.json({ error: "Prompt is too short" }, { status: 400 });
  }
  if (prompt.length > 1000) {
    return NextResponse.json({ error: "Prompt must be under 1000 characters" }, { status: 400 });
  }

  const discussion = await prisma.discussion.create({
    data: { prompt, sourceUrl },
  });

  return NextResponse.json(discussion, { status: 201 });
}

export const dynamic = "force-dynamic";
