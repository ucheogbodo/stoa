// app/(public)/idea/[id]/page.tsx
// Read-only public view of a single published idea.
// Phase 4: Added reading time, Table of Contents, and ReactionBar.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReactionBar } from "@/components/ReactionBar";
import { getReadingTime, extractHeadings, type TocHeading } from "@/lib/readingTime";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const idea = await prisma.idea.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    select: { title: true },
  });
  return { title: idea ? `${idea.title} — Stoa` : "Idea — Stoa" };
}

function renderBody(body: unknown): React.ReactNode {
  if (!body || typeof body !== "object") return null;
  const doc = body as { content?: unknown[] };
  if (!doc.content) return null;

  function renderNode(node: unknown, idx: number): React.ReactNode {
    const n = node as {
      type?: string;
      text?: string;
      marks?: { type: string }[];
      attrs?: Record<string, unknown>;
      content?: unknown[];
    };

    if (n.type === "text") {
      let el: React.ReactNode = n.text ?? "";
      if (n.marks) {
        for (const mark of n.marks) {
          if (mark.type === "bold") el = <strong key={idx}>{el}</strong>;
          else if (mark.type === "italic") el = <em key={idx}>{el}</em>;
          else if (mark.type === "code") el = <code key={idx} className="font-mono text-sm bg-parchment-dark px-1.5 py-0.5 rounded">{el}</code>;
        }
      }
      return el;
    }

    const children = (n.content ?? []).map((c, i) => renderNode(c, i));

    switch (n.type) {
      case "paragraph":
        return <p key={idx} className="mb-4 leading-relaxed">{children}</p>;
      case "heading": {
        const level = (n.attrs?.level as number) ?? 1;
        const text = (n.content ?? []).map((c) => (c as { text?: string }).text ?? "").join("");
        const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const Tag = `h${level}` as "h1" | "h2" | "h3";
        const sizes = { h1: "text-2xl", h2: "text-xl", h3: "text-lg" };
        return <Tag key={idx} id={id} className={`font-serif ${sizes[Tag] ?? "text-base"} font-semibold mt-6 mb-3 text-ink`}>{children}</Tag>;
      }
      case "bulletList":
        return <ul key={idx} className="list-disc list-inside mb-4 space-y-1">{children}</ul>;
      case "orderedList":
        return <ol key={idx} className="list-decimal list-inside mb-4 space-y-1">{children}</ol>;
      case "listItem":
        return <li key={idx}>{children}</li>;
      case "blockquote":
        return <blockquote key={idx} className="border-l-4 border-parchment-border pl-4 italic text-ink-muted my-4">{children}</blockquote>;
      case "codeBlock":
        return <pre key={idx} className="bg-parchment-dark rounded p-4 overflow-x-auto my-4 text-sm font-mono">{children}</pre>;
      case "hardBreak":
        return <br key={idx} />;
      default:
        return <span key={idx}>{children}</span>;
    }
  }

  return <>{(doc.content).map((n, i) => renderNode(n, i))}</>;
}

function TableOfContents({ headings }: { headings: TocHeading[] }) {
  if (headings.length < 3) return null;
  return (
    <aside className="hidden xl:block w-56 shrink-0 sticky top-24 self-start">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">Contents</p>
      <nav className="space-y-1">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`block text-sm text-ink-muted hover:text-ink transition-colors truncate ${
              h.level === 1 ? "" : h.level === 2 ? "pl-3" : "pl-6"
            }`}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default async function PublicIdeaPage({ params }: { params: { id: string } }) {
  const idea = await prisma.idea.findFirst({
    where: { id: params.id, status: "PUBLISHED" },
    include: {
      user: { select: { name: true, id: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });

  if (!idea) notFound();

  const readingTime = getReadingTime(idea.body);
  const headings = extractHeadings(idea.body);

  // Silence Metric: Cultivated for X days
  let cultivatedDays = 0;
  const pubIdea = idea as { publishedAt: Date | null; createdAt: Date };
  if (pubIdea.publishedAt) {
    const diffTime = Math.abs(pubIdea.publishedAt.getTime() - pubIdea.createdAt.getTime());
    cultivatedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 flex gap-12">
      {/* Main article */}
      <article className="flex-1 min-w-0">
        <Link href="/agora" className="text-sm text-ink-muted hover:text-sage mb-6 inline-block">
          &larr; Back to Agora
        </Link>

        <header className="mb-8">
          <h1 className="font-serif text-4xl text-ink leading-tight mb-3">{idea.title}</h1>
          <div className="flex items-center gap-3 flex-wrap text-sm text-ink-muted mb-4">
            <Link href={`/profile/${idea.user.id}`} className="hover:text-ink transition-colors underline decoration-parchment-border underline-offset-4">
              By {idea.user.name ?? "Anonymous"}
            </Link>
            <span>&middot;</span>
            <span>
              {new Date(idea.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {readingTime && (
              <>
                <span>&middot;</span>
                <span>{readingTime}</span>
              </>
            )}
          </div>
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

        <div className="prose prose-sage max-w-none text-ink leading-relaxed">
          {idea.body ? renderBody(idea.body) : (
            <p className="text-ink-muted italic">This idea has no body content.</p>
          )}
        </div>

        {/* Reaction Bar */}
        <div className="mt-12 flex items-center justify-between border-t border-parchment-border pt-6">
          <ReactionBar ideaId={idea.id} />
          {cultivatedDays > 0 && (
            <span className="text-xs text-ink-muted italic">Cultivated for {cultivatedDays} day{cultivatedDays !== 1 ? "s" : ""}</span>
          )}
        </div>
      </article>

      {/* Table of Contents (desktop only) */}
      <TableOfContents headings={headings} />
    </div>
  );
}
