// app/api/profile/route.ts
// GET  /api/profile  — returns the authenticated user's profile fields
// PATCH /api/profile — updates any subset of the 7 profile fields

import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  inscription: true,
  epigraph: true,
  intellectualLineage: true,
  epistemicStance: true,
  intellectualSeasons: true,
  unresolvedQuestions: true,
  profilePublic: true,
};

function getUserId(session: Session | null) {
  return (session?.user as { id?: string })?.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const allowedFields = [
    "inscription",
    "epigraph",
    "intellectualLineage",
    "epistemicStance",
    "intellectualSeasons",
    "unresolvedQuestions",
    "profilePublic",
    "name",
  ] as const;

  // Build update data from only the fields present in the request body
  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field];
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: PROFILE_SELECT,
  });

  return NextResponse.json(updated);
}
