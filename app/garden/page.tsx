// app/garden/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Garden dashboard — the main view of all your ideas.
// This is a SERVER component: it fetches ideas directly from the database
// using Prisma, with no extra API round-trip needed.
//
// Filtering by tag and status uses URL search parameters so filters are
// shareable/bookmarkable and work without client-side state.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IdeaCard } from "@/components/IdeaCard";
import { VestigeCard } from "@/components/VestigeCard";
import { FilterBar } from "@/components/FilterBar";
import { IdeaStatus, Vestige } from "@prisma/client";

interface PageProps {
  searchParams: {
    status?: string;
    tag?: string;
  };
}

export default async function GardenPage({ searchParams }: PageProps) {
  // Get the current user's session (guaranteed to exist — middleware protects this route)
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;

  // Build Prisma filter conditions from URL search params
  const statusFilter =
    searchParams.status &&
    Object.values(IdeaStatus).includes(searchParams.status as IdeaStatus)
      ? (searchParams.status as IdeaStatus)
      : undefined;

  // Fetch all ideas for this user, with their tags
  const ideas = await prisma.idea.findMany({
    where: {
      userId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(searchParams.tag
        ? { tags: { some: { tag: { slug: searchParams.tag } } } }
        : {}),
    },
    include: {
      tags: {
        include: { tag: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch Vestiges only if no tag or status filters are applied
  let vestiges: Vestige[] = [];
  if (!statusFilter && !searchParams.tag) {
    vestiges = await prisma.vestige.findMany({
      where: { userId },
      orderBy: { reconsideredAt: "desc" },
    });
  }

  // Fetch all tags for this user (for the filter dropdown)
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // Combine items and sort chronologically (newest first)
  const combinedItems = [
    ...ideas.map((idea) => ({ type: "idea" as const, data: idea, date: idea.updatedAt })),
    ...vestiges.map((vestige) => ({ type: "vestige" as const, data: vestige, date: vestige.reconsideredAt })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-ink">The Garden</h1>
          <p className="mt-1 text-ink-muted text-sm">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"} growing
          </p>
        </div>

        {/* New Idea button */}
        <Link href="/garden/ideas/new" className="btn-primary">
          + New Idea
        </Link>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <FilterBar tags={tags} currentStatus={searchParams.status} currentTag={searchParams.tag} />

      {/* ── Ideas grid ───────────────────────────────────────────────────── */}
      {combinedItems.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-serif text-xl text-ink-muted">The garden is quiet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            Plant your first idea — every essay begins as a seed.
          </p>
          <Link href="/garden/ideas/new" className="btn-primary mt-6 inline-flex">
            Plant a seed
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinedItems.map((item) =>
            item.type === "idea" ? (
              <IdeaCard key={`idea-${item.data.id}`} idea={item.data} />
            ) : (
              <VestigeCard key={`vestige-${item.data.id}`} vestige={item.data} />
            )
          )}
        </div>
      )}
    </div>
  );
}
