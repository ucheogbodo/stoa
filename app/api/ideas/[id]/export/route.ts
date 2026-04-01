// app/api/ideas/[id]/export/route.ts
// GET /api/ideas/[id]/export?format=md|pdf
// Streams the idea body as a downloadable Markdown or PDF file.
// Auth is required so only the owner can export their private ideas.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Tiptap JSON → Markdown serializer ────────────────────────────────────────
function nodeToMd(node: unknown, depth = 0): string {
  const n = node as {
    type?: string;
    text?: string;
    marks?: { type: string }[];
    attrs?: Record<string, unknown>;
    content?: unknown[];
  };

  if (!n) return "";

  if (n.type === "text") {
    let text = n.text ?? "";
    if (n.marks) {
      for (const mark of n.marks) {
        if (mark.type === "bold") text = `**${text}**`;
        else if (mark.type === "italic") text = `*${text}*`;
        else if (mark.type === "code") text = `\`${text}\``;
      }
    }
    return text;
  }

  const children = (n.content ?? []).map((c) => nodeToMd(c, depth)).join("");

  switch (n.type) {
    case "doc":
      return (n.content ?? []).map((c) => nodeToMd(c)).join("\n\n");
    case "paragraph":
      return children || "";
    case "heading": {
      const level = (n.attrs?.level as number) ?? 1;
      return `${"#".repeat(level)} ${children}`;
    }
    case "bulletList":
      return (n.content ?? [])
        .map((li) => `- ${nodeToMd(li)}`)
        .join("\n");
    case "orderedList":
      return (n.content ?? [])
        .map((li, i) => `${i + 1}. ${nodeToMd(li)}`)
        .join("\n");
    case "listItem":
      return children.trim();
    case "blockquote":
      return (n.content ?? [])
        .map((c) => `> ${nodeToMd(c)}`)
        .join("\n");
    case "codeBlock":
      return `\`\`\`\n${children}\n\`\`\``;
    case "hardBreak":
      return "  \n";
    default:
      return children;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "md";

  const idea = await prisma.idea.findFirst({
    where: { id: params.id, userId },
    select: { title: true, body: true, updatedAt: true },
  });

  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const slug = idea.title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 60) || "idea";

  if (format === "md") {
    const bodyMd = nodeToMd(idea.body ?? { type: "doc", content: [] });
    const md = `# ${idea.title}\n\n${bodyMd}\n\n---\n*Exported from Stoa on ${idea.updatedAt.toISOString().slice(0, 10)}*\n`;

    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.md"`,
      },
    });
  }

  if (format === "pdf") {
    // Build a minimal HTML document and use it as the PDF source via a data URL
    // Since @react-pdf/renderer adds significant bundle weight and requires a
    // separate worker for server-side rendering in Next.js App Router, we emit
    // a fully-styled HTML document that browsers can File > Print → Save as PDF.
    // This is the most dependency-free approach compatible with Next.js 15.
    const bodyMd = nodeToMd(idea.body ?? { type: "doc", content: [] });
    const htmlBody = bodyMd
      .split("\n\n")
      .map((block) => {
        if (block.startsWith("# ")) return `<h1>${block.slice(2)}</h1>`;
        if (block.startsWith("## ")) return `<h2>${block.slice(3)}</h2>`;
        if (block.startsWith("### ")) return `<h3>${block.slice(4)}</h3>`;
        if (block.startsWith("---")) return `<hr>`;
        return `<p>${block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>")}</p>`;
      })
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${idea.title}</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 60px auto; color: #1a1a2e; line-height: 1.8; }
  h1 { font-size: 2rem; margin-bottom: 0.5rem; }
  h2 { font-size: 1.5rem; margin-top: 2rem; }
  h3 { font-size: 1.2rem; margin-top: 1.5rem; }
  p  { margin-bottom: 1rem; }
  hr { border: none; border-top: 1px solid #ccc; margin: 2rem 0; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>${idea.title}</h1>
${htmlBody}
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.html"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
