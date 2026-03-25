// app/(public)/agora/browse/page.tsx
// Chronological, non-ranked list of all published ideas.

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Browse Ideas — Stoa Agora",
  description: "A chronological, non-ranked archive of published ideas from the Garden.",
};

export default async function AgoraBrowsePage() {
  const ideas = await prisma.idea.findMany({
    where: {
      status: "PUBLISHED",
      verificationStatus: { in: ["VERIFIED", "UNVERIFIED"] },
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

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-ink-muted text-sm uppercase tracking-widest mb-2">Archive</p>
        <h1 className="font-serif text-4xl text-ink">All Published Ideas</h1>
        <p className="text-ink-muted mt-2 text-sm">
          Chronological. No ranking. No trending.
        </p>
      </div>

      {ideas.length === 0 ? (
        <p className="text-ink-muted">No published ideas yet. Check back soon.</p>
      ) : (
        <ul className="divide-y divide-parchment-dark">
          {ideas.map((idea: typeof ideas[number]) => (
            <li key={idea.id} className="py-6">
              <Link href={`/idea/${idea.id}`} className="group">
                <h2 className="font-serif text-xl text-ink group-hover:text-sage transition-colors mb-2">
                  {idea.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span>{idea.user.name ?? "Anonymous"}</span>
                  <span>&middot;</span>
                  <span>
                    {new Date(idea.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {idea.tags.map(({ tag }: { tag: { name: string; slug: string } }) => (
                    <span
                      key={tag.slug}
                      className="px-2 py-0.5 bg-parchment-dark rounded-full"
                    >
                      {tag.name}
                    </span>
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
