import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  try {
    const { ideaId } = await request.json();
    if (!ideaId) {
      return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
    }

    const idea = await prisma.idea.findUnique({ where: { id: ideaId, userId } });
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Use a transaction to safely migrate the idea to a vestige and delete the idea
    const vestige = await prisma.$transaction(async (tx) => {
      const v = await tx.vestige.create({
        data: {
          title: idea.title || "Untitled",
          userId,
        },
      });
      await tx.idea.delete({ where: { id: ideaId } });
      return v;
    });

    return NextResponse.json(vestige);
  } catch (error) {
    console.error("Error creating vestige:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
