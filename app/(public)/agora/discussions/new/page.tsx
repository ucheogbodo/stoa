// app/(public)/agora/discussions/new/page.tsx
// Start a new Agora discussion thread. Auth-gated: only logged-in users can create.
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NewDiscussionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefill = searchParams.get("prompt") ?? "";
  const [prompt, setPrompt] = useState(prefill);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync prefill if searchParams changes (e.g. navigating from profile)
  useEffect(() => {
    if (prefill) setPrompt(prefill);
  }, [prefill]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || prompt.trim().length < 5) {
      setError("Please enter a question or proposition (at least 5 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    const discussion = await res.json();
    router.push(`/agora/discussions/${discussion.id}`);
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center text-ink-muted">
        Loading…
      </div>
    );
  }

  // Unauthenticated state
  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="font-serif text-2xl text-ink mb-4">Sign in to open a thread</p>
        <p className="text-ink-muted text-sm mb-8 leading-relaxed">
          The Discourse is open to all readers, but starting a thread requires an account.
          This keeps the conversation rooted in the Garden.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent("/agora/discussions/new" + (prefill ? `?prompt=${encodeURIComponent(prefill)}` : ""))}`}
          className="btn-primary"
        >
          Sign in to continue
        </Link>
        <div className="mt-6">
          <Link href="/agora/discussions" className="text-sm text-ink-muted hover:text-ink transition-colors">
            ← Back to The Discourse
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated state
  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <Link
        href="/agora/discussions"
        className="text-sm text-ink-muted hover:text-ink transition-colors mb-8 inline-block"
      >
        ← The Discourse
      </Link>

      <h1 className="font-serif text-3xl text-ink mb-2">Open a Thread</h1>
      <p className="text-ink-muted text-sm mb-10">
        Pose a question or proposition to the Agora. Once opened, others may respond.
        There are no votes, no rankings — only thought.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="prompt"
            className="block text-xs font-medium text-ink-muted uppercase tracking-wide mb-3"
          >
            Your question or proposition
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What remains unresolved for you?"
            rows={5}
            maxLength={1000}
            className="w-full input font-serif text-base resize-none leading-relaxed"
            autoFocus
          />
          <p className="text-xs text-ink-muted mt-1 text-right">
            {prompt.length} / 1000
          </p>
        </div>

        {error && (
          <p className="text-sm text-rust">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || prompt.trim().length < 5}
          className="btn-primary w-full justify-center"
        >
          {submitting ? "Opening thread…" : "Open this thread"}
        </button>
      </form>
    </div>
  );
}
