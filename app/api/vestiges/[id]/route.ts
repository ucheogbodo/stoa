import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const vestigeId = params.id;
  const vestige = await prisma.vestige.findUnique({ where: { id: vestigeId, userId } });
  
  if (!vestige) {
    return NextResponse.json({ error: "Vestige not found" }, { status: 404 });
  }

  try {
    const { reflection } = await request.json();

    // Enforce 30 day minimum reflection period
    const MS_IN_DAY = 1000 * 60 * 60 * 24;
    const daysPassed = (Date.now() - vestige.reconsideredAt.getTime()) / MS_IN_DAY;
    
    if (daysPassed < 30) {
      return NextResponse.json(
        { error: "A minimum of 30 days must pass before a reflection can be written." },
        { status: 403 }
      );
    }

    // Update logic:
    // If reflectionAt is null, set it to now() since this is the first save.
    const dataToUpdate: { reflection: string; reflectionAt?: Date } = { reflection };
    if (!vestige.reflectionAt) {
      dataToUpdate.reflectionAt = new Date();
    }

    const updatedVestige = await prisma.vestige.update({
      where: { id: vestigeId },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedVestige);
  } catch (error) {
    console.error("Error updating vestige reflection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const vestige = await prisma.vestige.findUnique({ where: { id: params.id, userId } });
  if (!vestige) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only truly empty vestiges (no meaningful title, no reflection) may be discarded.
  // A vestige with any content is a permanent philosophical record.
  const hasTitle = vestige.title && vestige.title.trim().length > 0 && vestige.title.trim().toLowerCase() !== "untitled";
  const hasReflection = vestige.reflection && vestige.reflection.trim().length > 0;

  if (hasTitle || hasReflection) {
    return NextResponse.json(
      { error: "Only empty vestiges may be discarded. Meaningful records are permanent." },
      { status: 403 }
    );
  }

  await prisma.vestige.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
