// app/(public)/idea/[id]/page.tsx
// Read-only public view of a single published idea.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const idea = await prisma.idea.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    select: { title: true },
  });
  return { title: idea ? `${idea.title} — Stoa` : "Idea — Stoa" };
}

function renderBody(body: unknown): string {
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

export default async function PublicIdeaPage({ params }: { params: { id: string } }) {
  const idea = await prisma.idea.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    include: {
      user: { select: { name: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });

  if (!idea) notFound();

  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <Link href="/agora" className="text-sm text-ink-muted hover:text-sage mb-6 inline-block">
        &larr; Back to Agora
      </Link>

      <header className="mb-8">
        <h1 className="font-serif text-4xl text-ink leading-tight mb-4">{idea.title}</h1>
        {idea.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {idea.tags.map(({ tag }) => (
              <span
                key={tag.slug}
                className="text-xs px-3 py-1 bg-parchment-dark text-ink-muted rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose prose-sage max-w-none text-ink leading-relaxed mb-12">
        {idea.body ? (
          <p className="whitespace-pre-wrap">{renderBody(idea.body)}</p>
        ) : (
          <p className="text-ink-muted italic">This idea has no body content.</p>
        )}
      </div>

      <footer className="border-t border-parchment-dark pt-6 text-sm text-ink-muted">
        By {idea.user.name ?? "Anonymous"} &middot;{" "}
        {new Date(idea.updatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </footer>
    </article>
  );
}
