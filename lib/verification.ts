// lib/verification.ts
// Hashes idea body text for originality fingerprinting and near-duplicate detection.

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Extracts plain text from a Tiptap ProseMirror JSON body.
 */
function extractText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const doc = body as { content?: unknown[] };
  if (!doc.content) return "";

  function recurse(nodes: unknown[]): string {
    return nodes
      .map((node) => {
        const n = node as { type?: string; text?: string; content?: unknown[] };
        if (n.text) return n.text;
        if (n.content) return recurse(n.content);
        return "";
      })
      .join(" ");
  }

  return recurse(doc.content).trim();
}

/**
 * Returns a SHA-256 hash of the idea's body text.
 */
export function hashContent(body: unknown): string {
  const text = extractText(body);
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Checks for near-duplicate ideas in the database.
 * Returns the id of a matching idea if found, or null.
 * Currently checks for exact hash matches; can be extended for fuzzy matching.
 */
export async function checkForDuplicates(
  contentHash: string,
  excludeIdeaId?: string
): Promise<string | null> {
  const duplicate = await prisma.idea.findFirst({
    where: {
      contentHash,
      id: excludeIdeaId ? { not: excludeIdeaId } : undefined,
    },
    select: { id: true },
  });

  return duplicate?.id ?? null;
}
