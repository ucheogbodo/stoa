// app/garden/ideas/[id]/page.tsx — Phase 4 update
// Added: export dropdown (Markdown / HTML), reading time display, delete idea.
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Editor } from "@/components/Editor";
import { TagInput, type TagData } from "@/components/TagInput";
import { LinkedIdeasPanel, type LinkedIdea } from "@/components/LinkedIdeasPanel";
import { getReadingTime, getWordCount } from "@/lib/readingTime";
import type { JSONContent } from "@tiptap/react";

type Status = "SEED" | "GROWING" | "PUBLISHED";
type VerificationStatus = "UNVERIFIED" | "REVIEW" | "VERIFIED" | "FLAGGED";

const statusOptions: { value: Status; label: string }[] = [
  { value: "SEED", label: "🌱 Seed" },
  { value: "GROWING", label: "🌿 Growing" },
  { value: "PUBLISHED", label: "📖 Published" },
];

const verificationBadge: Record<VerificationStatus, { label: string; className: string }> = {
  UNVERIFIED: { label: "Unverified", className: "text-ink-muted bg-parchment-dark" },
  REVIEW: { label: "⚠ Under Review", className: "text-amber-800 bg-amber-100" },
  VERIFIED: { label: "✓ Verified", className: "text-green-800 bg-green-100" },
  FLAGGED: { label: "✕ Flagged", className: "text-red-800 bg-red-100" },
};

interface Project {
  id: string;
  name: string;
}

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
  // `loaded` guards auto-save: for existing ideas, we must wait for the fetch
  // to complete before auto-save is allowed. Without this, the debounce fires
  // ~1.5s after mount with empty state, creating a phantom blank idea.
  const [loaded, setLoaded] = useState(isNew);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("UNVERIFIED");
  const [verifying, setVerifying] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideaProjectIds, setIdeaProjectIds] = useState<string[]>([]);

  // Ref to hold the latest save function for the debouncer
  const saveRef = useRef<() => Promise<void>>();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

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
        setVerificationStatus((data.verificationStatus as VerificationStatus) ?? "UNVERIFIED");
        setTags(data.tags.map((it: { tag: TagData }) => it.tag));
        setLinkedIdeas([
          ...data.linksFrom.map((l: { toIdea: LinkedIdea }) => l.toIdea),
          ...data.linksTo.map((l: { fromIdea: LinkedIdea }) => l.fromIdea),
        ]);
        setIdeaProjectIds(data.projects?.map((p: { projectId: string }) => p.projectId) ?? []);
        setLoading(false);
        setLoaded(true);
      })
      .catch(() => { setLoading(false); setLoaded(true); });
  }, [isNew, params.id]);

  // ── Load projects (for the sidebar panel) ──────────────────────────────────
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    setSaveState("saving");
    try {
      let res;
      if (ideaId) {
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
        res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, status, tagIds: tags.map((t) => t.id) }),
        });
      }

      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();

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

  // Keep saveRef in sync so debouncer always calls latest version
  useEffect(() => { saveRef.current = save; }, [save]);

  // ── Debounced auto-save (1.5s after last change) ───────────────────────────
  useEffect(() => {
    if (!loaded) return; // Don't fire before existing idea state has been fetched
    if (isNew && !ideaId) return; // Don't auto-save new ideas before first manual save
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { saveRef.current?.(); }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [title, body, status, tags, linkedIdeas, isNew, ideaId, loaded]);

  // ── Verification: run when status changes to PUBLISHED ────────────────────
  useEffect(() => {
    if (status !== "PUBLISHED" || !ideaId) return;
    setVerifying(true);
    fetch(`/api/ideas/${ideaId}/verify`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => setVerificationStatus(data.verificationStatus ?? "UNVERIFIED"))
      .catch(() => {})
      .finally(() => setVerifying(false));
  }, [status, ideaId]);

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [save]);

  // ── Export helper ─────────────────────────────────────────────────────────
  function exportIdea(format: "md" | "pdf") {
    if (!ideaId) return;
    window.open(`/api/ideas/${ideaId}/export?format=${format}`, "_blank");
  }

  // ── Delete idea ───────────────────────────────────────────────────────────
  async function deleteIdea() {
    if (!ideaId) return;
    const confirmed = window.confirm(
      "Delete this idea permanently? This cannot be undone."
    );
    if (!confirmed) return;
    await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
    router.push("/garden");
  }

  // ── Project linking helpers ───────────────────────────────────────────────
  async function toggleProjectLink(projectId: string) {
    if (!ideaId) return;
    const isLinked = ideaProjectIds.includes(projectId);

    if (isLinked) {
      await fetch(`/api/projects/${projectId}/ideas/${ideaId}`, { method: "DELETE" });
      setIdeaProjectIds((ids) => ids.filter((id) => id !== projectId));
    } else {
      await fetch(`/api/projects/${projectId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      setIdeaProjectIds((ids) => [...ids, projectId]);
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
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

  const badge = verificationBadge[verificationStatus];

  // ── Editor layout ─────────────────────────────────────────────────────────
  return (
    <div className="flex gap-8 items-start">

      {/* ── Main editing area ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <Link
          href="/garden"
          className="text-sm text-ink-muted hover:text-ink transition-colors mb-6 inline-flex items-center gap-1"
        >
          ← Garden
        </Link>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full font-serif text-3xl text-ink bg-transparent border-none outline-none placeholder-ink-muted mt-4 mb-6"
        />

        <Editor initialContent={body} onChange={setBody} placeholder="A seed of thought…" />
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 space-y-6 sticky top-24">

        {/* Save button */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={save}
            disabled={saveState === "saving"}
            className="btn-primary w-full justify-center"
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : "Save"}
          </button>
          {saveState === "error" && (
            <p className="text-xs text-rust text-center">Save failed. Try again.</p>
          )}
          <p className="text-xs text-ink-muted text-center">Auto-saves after typing</p>
        </div>

        {/* Reading time + word count */}
        {body && getWordCount(body) > 0 && (
          <p className="text-xs text-ink-muted text-center">
            {getWordCount(body)} words · {getReadingTime(body)}
          </p>
        )}

        {/* Export */}
        {ideaId && (
          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Export
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportIdea("md")}
                className="btn-ghost text-xs flex-1 justify-center"
              >
                Markdown
              </button>
              <button
                type="button"
                onClick={() => exportIdea("pdf")}
                className="btn-ghost text-xs flex-1 justify-center"
              >
                HTML/PDF
              </button>
            </div>
          </div>
        )}

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
            {statusOptions.map((opt: { value: Status; label: string }) => (
              <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
            ))}
          </select>

          {/* Verification badge */}
          {(status === "PUBLISHED" || verificationStatus !== "UNVERIFIED") && (
            <div className="mt-2">
              {verifying ? (
                <p className="text-xs text-ink-muted">Checking originality…</p>
              ) : (
                <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              )}
              {verificationStatus === "REVIEW" && (
                <p className="text-xs text-amber-700 mt-1">
                  Similar content detected. An admin will review before this publishes to the Agora.
                </p>
              )}
              {verificationStatus === "FLAGGED" && (
                <p className="text-xs text-red-700 mt-1">
                  This idea has been blocked from the Agora due to a copyright concern.
                </p>
              )}
            </div>
          )}
        </div>

        <hr className="border-parchment-border" />

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
            Tags
          </label>
          <TagInput selectedTags={tags} onChange={setTags} />
        </div>

        <hr className="border-parchment-border" />

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <div>
              <label className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                Projects
              </label>
              {!ideaId && (
                <p className="text-xs text-ink-muted">Save the idea first to add it to a project.</p>
              )}
              {ideaId && (
                <ul className="space-y-1">
                  {projects.map((project) => {
                    const linked = ideaProjectIds.includes(project.id);
                    return (
                      <li key={project.id}>
                        <button
                          type="button"
                          onClick={() => toggleProjectLink(project.id)}
                          className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                            linked
                              ? "bg-sage/20 text-sage font-medium"
                              : "text-ink-muted hover:bg-parchment-dark hover:text-ink"
                          }`}
                        >
                          {linked ? "✓ " : "+ "}{project.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <hr className="border-parchment-border" />
          </>
        )}

        {/* Linked Ideas */}
        <LinkedIdeasPanel
          currentIdeaId={ideaId}
          linkedIdeas={linkedIdeas}
          onChange={setLinkedIdeas}
        />

        {/* Delete */}
        {ideaId && (
          <>
            <hr className="border-parchment-border" />
            <button
              type="button"
              onClick={deleteIdea}
              className="w-full text-xs text-rust hover:text-red-700 hover:bg-red-50 transition-colors py-1.5 px-3 rounded border border-transparent hover:border-red-200"
            >
              🗑 Delete this idea
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
