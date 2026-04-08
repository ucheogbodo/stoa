// app/(public)/agora/discussions/page.tsx
// The Discourse — list of public discussion threads.

import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface DiscussionItem {
  id: string;
  prompt: string;
  createdAt: Date;
  _count: { posts: number };
  posts: { createdAt: Date }[];
}

export const metadata = {
  title: "The Discourse — Stoa Agora",
  description: "Open questions from the Garden. No votes. No ranking. Just thought.",
};

export default async function DiscussionsPage() {
  const raw = await prisma.discussion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { posts: true } },
      posts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  const discussions = raw.sort((a: DiscussionItem, b: DiscussionItem) => {
    const aDate = a.posts[0]?.createdAt ?? a.createdAt;
    const bDate = b.posts[0]?.createdAt ?? b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-10">
        <p className="label-overline mb-2">The Discourse</p>
        <div className="flex items-end justify-between">
          <h1 className="font-serif text-4xl text-ink">Open Questions</h1>
          <Link
            href="/agora/discussions/new"
            className="text-sm text-sage hover:underline underline-offset-4 decoration-sage/40"
          >
            Open a thread →
          </Link>
        </div>
        <p className="text-ink-muted text-sm mt-1.5">
          No votes. No ranking. Just thought.
        </p>
      </div>

      <Link href="/agora/browse" className="text-xs text-ink-muted/60 hover:text-ink transition-colors mb-10 inline-block">
        ← Browse ideas
      </Link>

      {discussions.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-serif text-xl text-ink-muted">The discourse is quiet.</p>
          <p className="mt-2 text-sm text-ink-muted/60">
            Open a thread to begin.
          </p>
          <Link href="/agora/discussions/new" className="btn-primary mt-6 inline-flex">
            Open the first thread
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-parchment-border/60 mt-4">
          {discussions.map((d: DiscussionItem) => {
            const lastActivity = d.posts[0]?.createdAt ?? d.createdAt;
            return (
              <li key={d.id}>
                <Link href={`/agora/discussions/${d.id}`} className="group flex items-start justify-between gap-4 py-6">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-ink group-hover:text-sage transition-colors duration-150 leading-snug mb-2">
                      {d.prompt}
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                      <span>
                        {d._count.posts} {d._count.posts === 1 ? "response" : "responses"}
                      </span>
                      <span className="text-parchment-border">·</span>
                      <span>
                        {new Date(lastActivity).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-ink-muted/30 group-hover:text-sage/60 transition-colors pt-1 shrink-0">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
