// app/garden/ideas/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-page idea editor.
//
// Routes:
//   /garden/ideas/new       → creates a new idea
//   /garden/ideas/[id]      → edits an existing idea
//
// This is a CLIENT component because it manages lots of interactive state
// (editor content, tags, links, save status).
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Editor } from "@/components/Editor";
import { TagInput, type TagData } from "@/components/TagInput";
import { LinkedIdeasPanel, type LinkedIdea } from "@/components/LinkedIdeasPanel";
import type { JSONContent } from "@tiptap/react";
import { IdeaStatus } from "@prisma/client";

type Status = keyof typeof IdeaStatus;

const statusOptions: { value: Status; label: string }[] = [
  { value: "SEED", label: "🌱 Seed" },
  { value: "GROWING", label: "🌿 Growing" },
  { value: "PUBLISHED", label: "📖 Published" },
];

export default function IdeaEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  // ── State ──────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [body, setBody] = useState<JSONContent | null>(null);
  const [status, setStatus] = useState<Status>("SEED");
  const [tags, setTags] = useState<TagData[]>([]);
  const [linkedIdeas, setLinkedIdeas] = useState<LinkedIdea[]>([]);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(!isNew);

  // ── Load existing idea ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isNew) return;

    fetch(`/api/ideas/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setIdeaId(data.id);
        setTitle(data.title ?? "");
        setBody(data.body ?? null);
        setStatus(data.status as Status);
        setTags(data.tags.map((it: { tag: TagData }) => it.tag));
        setLinkedIdeas(
          [
            ...data.linksFrom.map((l: { toIdea: LinkedIdea }) => l.toIdea),
            ...data.linksTo.map((l: { fromIdea: LinkedIdea }) => l.fromIdea),
          ]
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isNew, params.id]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    setSaveState("saving");

    try {
      let res;

      if (ideaId) {
        // Update existing idea
        res = await fetch(`/api/ideas/${ideaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body,
            status,
            tagIds: tags.map((t) => t.id),
            linkedIdeaIds: linkedIdeas.map((i) => i.id),
          }),
        });
      } else {
        // Create new idea
        res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body,
            status,
            tagIds: tags.map((t) => t.id),
          }),
        });
      }

      if (!res.ok) throw new Error("Save failed");

      const saved = await res.json();

      // If this was a new idea, update IDs and URL without full reload
      if (!ideaId) {
        setIdeaId(saved.id);
        router.replace(`/garden/ideas/${saved.id}`);
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [ideaId, title, body, status, tags, linkedIdeas, router]);

  // ── Keyboard shortcut: Ctrl/Cmd + S to save ───────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [save]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-prose">
        <div className="h-10 bg-parchment-dark rounded w-3/4" />
        <div className="h-4 bg-parchment-dark rounded w-full" />
        <div className="h-4 bg-parchment-dark rounded w-5/6" />
        <div className="h-4 bg-parchment-dark rounded w-4/6" />
      </div>
    );
  }

  // ── Editor layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex gap-8 items-start">

      {/* ── Main editing area ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Back link */}
        <Link
          href="/garden"
          className="text-sm text-ink-muted hover:text-ink transition-colors mb-6 inline-flex items-center gap-1"
        >
          ← Garden
        </Link>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full font-serif text-3xl text-ink bg-transparent border-none outline-none placeholder-ink-muted mt-4 mb-6"
        />

        {/* Editor */}
        <Editor
          initialContent={body}
          onChange={setBody}
          placeholder="A seed of thought…"
        />
      </div>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 space-y-6 sticky top-24">

        {/* Save button + status */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={save}
            disabled={saveState === "saving"}
            className="btn-primary w-full justify-center"
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
              ? "✓ Saved"
              : "Save"}
          </button>

          {saveState === "error" && (
            <p className="text-xs text-rust text-center">
              Save failed. Please try again.
            </p>
          )}

          <p className="text-xs text-ink-muted text-center">
            Ctrl + S to save
          </p>
        </div>

        {/* Divider */}
        <hr className="border-parchment-border" />

        {/* Status selector */}
        <div>
          <label className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="input text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <hr className="border-parchment-border" />

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
            Tags
          </label>
          <TagInput selectedTags={tags} onChange={setTags} />
        </div>

        {/* Divider */}
        <hr className="border-parchment-border" />

        {/* Linked Ideas */}
        <LinkedIdeasPanel
          currentIdeaId={ideaId}
          linkedIdeas={linkedIdeas}
          onChange={setLinkedIdeas}
        />
      </aside>
    </div>
  );
}
