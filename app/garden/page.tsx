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
import { FilterBar } from "@/components/FilterBar";
import { IdeaStatus } from "@prisma/client";

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

  // Fetch all tags for this user (for the filter dropdown)
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

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
      {ideas.length === 0 ? (
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
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
