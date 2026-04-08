// app/garden/page.tsx
// Garden dashboard — overview of all ideas and vestiges.

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IdeaCard } from "@/components/IdeaCard";
import { VestigeCard } from "@/components/VestigeCard";
import { FilterBar } from "@/components/FilterBar";
import { IdeaStatus, Vestige } from "@prisma/client";

interface PageProps {
  searchParams: { status?: string; tag?: string };
}

export default async function GardenPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;
  const userName = session?.user?.name?.split(" ")[0] ?? "Gardener";

  const statusFilter =
    searchParams.status && Object.values(IdeaStatus).includes(searchParams.status as IdeaStatus)
      ? (searchParams.status as IdeaStatus)
      : undefined;

  const ideas = await prisma.idea.findMany({
    where: {
      userId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(searchParams.tag ? { tags: { some: { tag: { slug: searchParams.tag } } } } : {}),
    },
    include: { tags: { include: { tag: true } } },
    orderBy: { updatedAt: "desc" },
  });

  let vestiges: Vestige[] = [];
  if (!statusFilter && !searchParams.tag) {
    vestiges = await prisma.vestige.findMany({
      where: { userId },
      orderBy: { reconsideredAt: "desc" },
    });
  }

  const tags = await prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });

  const combinedItems = [
    ...ideas.map((idea) => ({ type: "idea" as const, data: idea, date: idea.updatedAt })),
    ...vestiges.map((v) => ({ type: "vestige" as const, data: v, date: v.reconsideredAt })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const isFiltered = !!(statusFilter || searchParams.tag);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="label-overline mb-1">Your Space</p>
          <h1 className="font-serif text-3xl text-ink">
            {isFiltered ? "The Garden" : `Good ${getTimeOfDay()}, ${userName}`}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"} growing
            {vestiges.length > 0 && !isFiltered && (
              <> · <Link href="/garden/vestibule" className="hover:text-ink underline underline-offset-4 decoration-parchment-border">{vestiges.length} reconsidered</Link></>
            )}
          </p>
        </div>
        <Link href="/garden/ideas/new" className="btn-primary">
          + New Idea
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <FilterBar tags={tags} currentStatus={searchParams.status} currentTag={searchParams.tag} />
      </div>

      {/* Ideas grid */}
      {combinedItems.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="font-serif text-2xl text-ink-muted mb-3">
            {isFiltered ? "Nothing matches this filter." : "The garden is quiet."}
          </p>
          <p className="text-sm text-ink-muted/60 mb-8">
            {isFiltered
              ? "Try clearing the filter to see all ideas."
              : "Every essay begins as a seed. Plant your first."}
          </p>
          {isFiltered ? (
            <Link href="/garden" className="btn-ghost">
              Clear filters
            </Link>
          ) : (
            <Link href="/garden/ideas/new" className="btn-primary">
              Plant a seed
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
