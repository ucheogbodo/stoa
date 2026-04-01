// lib/readingTime.ts
// Walks a Tiptap ProseMirror JSON document, counts words,
// and returns a human-readable estimated reading time string.

const WORDS_PER_MINUTE = 200;

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

export function getReadingTime(body: unknown): string {
  const text = extractText(body);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return "";
  const minutes = Math.ceil(words / WORDS_PER_MINUTE);
  return `${minutes} min read`;
}

export function getWordCount(body: unknown): number {
  const text = extractText(body);
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Extract headings (h1–h3) for a Table of Contents */
export interface TocHeading {
  level: 1 | 2 | 3;
  text: string;
  id: string;
}

export function extractHeadings(body: unknown): TocHeading[] {
  if (!body || typeof body !== "object") return [];
  const doc = body as { content?: unknown[] };
  if (!doc.content) return [];

  const headings: TocHeading[] = [];

  for (const node of doc.content) {
    const n = node as { type?: string; attrs?: { level?: number }; content?: unknown[] };
    if (n.type === "heading" && n.attrs?.level && n.attrs.level <= 3 && n.content) {
      const text = (n.content as { text?: string }[])
        .map((t) => t.text ?? "")
        .join("");
      if (text.trim()) {
        const id = text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        headings.push({ level: n.attrs.level as 1 | 2 | 3, text, id });
      }
    }
  }

  return headings;
}
