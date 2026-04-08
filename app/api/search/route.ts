// app/api/search/route.ts
// GET /api/search?q=<query>
// Returns matching ideas for the authenticated user, searching title and body text.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function extractText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const doc = body as { content?: unknown[] };
  if (!doc.content) return "";
  function recurse(nodes: unknown[]): string {
    return nodes
      .map((n) => {
        const node = n as { text?: string; content?: unknown[] };
        if (node.text) return node.text;
        if (node.content) return recurse(node.content);
        return "";
      })
      .join(" ");
  }
  return recurse(doc.content);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const ideas = await prisma.idea.findMany({
    where: {
      userId,
      title: { contains: q, mode: "insensitive" },
    },
    select: { id: true, title: true, status: true, body: true },
    take: 10,
    orderBy: { updatedAt: "desc" },
  });

  // Also search ideas whose title didn't match but body text does
  const allIdeas = await prisma.idea.findMany({
    where: { userId },
    select: { id: true, title: true, status: true, body: true },
    orderBy: { updatedAt: "desc" },
  });

  const titleMatchIds = new Set(ideas.map((i) => i.id));
  const bodyMatches = allIdeas
    .filter(
      (idea) =>
        !titleMatchIds.has(idea.id) &&
        extractText(idea.body).toLowerCase().includes(q.toLowerCase())
    )
    .slice(0, 5);

  const results = [...ideas, ...bodyMatches].slice(0, 12).map((idea) => {
    const bodyText = extractText(idea.body);
    const idx = bodyText.toLowerCase().indexOf(q.toLowerCase());
    let snippet = "";
    if (idx !== -1) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(bodyText.length, idx + q.length + 80);
      snippet = (start > 0 ? "…" : "") + bodyText.slice(start, end) + (end < bodyText.length ? "…" : "");
    }
    return { id: idea.id, title: idea.title, status: idea.status, snippet };
  });

  return NextResponse.json(results);
}

export const dynamic = "force-dynamic";
