// app/(public)/agora/browse/page.tsx
// Browse — chronological archive with tag filtering and title search.

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Browse Ideas — Stoa Agora",
  description: "A chronological, non-ranked archive of published ideas from the Garden.",
};

interface PageProps {
  searchParams: { tag?: string; q?: string };
}

export default async function AgoraBrowsePage({ searchParams }: PageProps) {
  const tagSlug = searchParams.tag?.trim() || undefined;
  const query   = searchParams.q?.trim()   || undefined;

  const ideas = await prisma.idea.findMany({
    where: {
      status: "PUBLISHED",
      verificationStatus: { in: ["VERIFIED", "UNVERIFIED"] },
      ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
      ...(query   ? { title: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      user: { select: { name: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });

  const allTags = await prisma.tag.findMany({
    where: {
      ideas: {
        some: {
          idea: {
            status: "PUBLISHED",
            verificationStatus: { in: ["VERIFIED", "UNVERIFIED"] },
          },
        },
      },
    },
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-10">
        <p className="label-overline mb-2">Archive</p>
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-4xl text-ink">All Ideas</h1>
          <Link href="/agora/discussions" className="text-xs text-ink-muted hover:text-sage transition-colors">
            The Discourse →
          </Link>
        </div>
        <p className="text-ink-muted text-sm mt-1.5">Chronological. No ranking. No trending.</p>
      </div>

      {/* Search + tag filters */}
      <form method="GET" action="/agora/browse" className="mb-8 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search by title…"
            className="input flex-1"
          />
          <button type="submit" className="btn-ghost">
            Search
          </button>
          {(query || tagSlug) && (
            <Link href="/agora/browse" className="btn-ghost text-rust border-rust/30 hover:bg-rust-light">
              Clear
            </Link>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/agora/browse?tag=${tag.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-150 ${
                  tagSlug === tag.slug
                    ? "bg-sage text-white"
                    : "bg-parchment-dark text-ink-muted hover:bg-sage/15 hover:text-sage"
                }`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </form>

      {(query || tagSlug) && (
        <p className="text-xs text-ink-muted mb-6">
          {ideas.length} {ideas.length === 1 ? "result" : "results"}
          {query ? ` for "${query}"` : ""}
          {tagSlug ? ` tagged "${allTags.find((t) => t.slug === tagSlug)?.name ?? tagSlug}"` : ""}
        </p>
      )}

      {/* List */}
      {ideas.length === 0 ? (
        <p className="text-ink-muted/60 text-sm">No ideas match your search.</p>
      ) : (
        <ul className="divide-y divide-parchment-border/60">
          {ideas.map((idea) => (
            <li key={idea.id} className="py-6 group">
              <Link href={`/idea/${idea.id}`} className="block">
                <h2 className="font-serif text-xl text-ink group-hover:text-sage transition-colors duration-150 mb-2 leading-snug">
                  {idea.title}
                </h2>
                <div className="flex items-center gap-2.5 text-xs text-ink-muted flex-wrap">
                  <span>{idea.user.name ?? "Anonymous"}</span>
                  <span className="text-parchment-border">·</span>
                  <span>
                    {new Date(idea.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                  {idea.tags.map(({ tag }) => (
                    <Link
                      key={tag.slug}
                      href={`/agora/browse?tag=${tag.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-0.5 bg-parchment-dark rounded-full hover:bg-sage/15 hover:text-sage transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
