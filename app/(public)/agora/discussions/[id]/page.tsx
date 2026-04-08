// app/(public)/agora/discussions/[id]/page.tsx
// Thread view — shows the full discussion with all replies.
// Auth-gated reply form: only logged-in users can respond.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

interface Post {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null };
}

interface Discussion {
  id: string;
  prompt: string;
  sourceUrl: string | null;
  createdAt: string;
  posts: Post[];
}

export default function DiscussionThreadPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const { data: session, status: authStatus } = useSession();

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const fetchDiscussion = useCallback(async () => {
    const res = await fetch(`/api/discussions/${id}`);
    if (!res.ok) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setDiscussion(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchDiscussion(); }, [fetchDiscussion]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || reply.trim().length < 2) return;
    setSubmitting(true);
    setReplyError(null);

    const res = await fetch(`/api/discussions/${id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReplyError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setReply("");
    setSubmitting(false);
    fetchDiscussion(); // Refresh posts
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-parchment-dark rounded w-3/4" />
          <div className="h-4 bg-parchment-dark rounded w-full" />
          <div className="h-4 bg-parchment-dark rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (notFound || !discussion) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="font-serif text-xl text-ink-muted">Thread not found.</p>
        <Link href="/agora/discussions" className="text-sm text-sage mt-4 inline-block hover:underline">
          ← Back to The Discourse
        </Link>
      </div>
    );
  }

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Back nav */}
      <Link
        href="/agora/discussions"
        className="text-sm text-ink-muted hover:text-ink transition-colors mb-10 inline-block"
      >
        ← The Discourse
      </Link>

      {/* Prompt */}
      <header className="mb-12">
        <p className="text-ink-muted text-xs uppercase tracking-widest mb-3">Open Question</p>
        <h1 className="font-serif text-3xl text-ink leading-snug">{discussion.prompt}</h1>
        {discussion.sourceUrl && (
          <p className="mt-4 text-sm text-ink-muted">
            Seeded from{" "}
            <Link href={discussion.sourceUrl} className="underline underline-offset-4 decoration-parchment-border hover:text-ink transition-colors">
              a philosopher's unresolved question
            </Link>
          </p>
        )}
        <p className="mt-2 text-xs text-ink-muted">
          Opened{" "}
          {new Date(discussion.createdAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })}
          {" · "}
          {discussion.posts.length} {discussion.posts.length === 1 ? "response" : "responses"}
        </p>
      </header>

      {/* Posts */}
      {discussion.posts.length === 0 ? (
        <p className="text-ink-muted text-sm italic mb-12">
          No responses yet. Be the first to think aloud.
        </p>
      ) : (
        <ol className="space-y-8 mb-14">
          {discussion.posts.map((post, i) => (
            <li key={post.id} className="flex gap-4">
              <span className="text-xs text-ink-muted/50 font-mono mt-1 w-5 shrink-0 select-none">
                {i + 1}.
              </span>
              <div className="flex-1">
                <p className="text-ink leading-relaxed whitespace-pre-wrap text-[15px]">
                  {post.body}
                </p>
                <p className="mt-2 text-xs text-ink-muted">
                  <Link
                    href={`/profile/${post.user.id}`}
                    className="hover:text-ink transition-colors underline decoration-parchment-border underline-offset-4"
                  >
                    {post.user.name ?? "Anonymous"}
                  </Link>
                  {" · "}
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Reply section */}
      <div className="border-t border-parchment-border pt-10">
        {authStatus === "loading" ? null : session ? (
          <form onSubmit={handleReply} className="space-y-4">
            <label
              htmlFor="reply"
              className="block text-xs font-medium text-ink-muted uppercase tracking-wide"
            >
              Add to the conversation
            </label>
            <textarea
              id="reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Your response…"
              rows={5}
              maxLength={2000}
              className="w-full input font-serif text-[15px] resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">{reply.length} / 2000</p>
              <button
                type="submit"
                disabled={submitting || reply.trim().length < 2}
                className="btn-primary"
              >
                {submitting ? "Posting…" : "Post response"}
              </button>
            </div>
            {replyError && <p className="text-sm text-rust">{replyError}</p>}
          </form>
        ) : (
          <p className="text-sm text-ink-muted">
            <Link href={loginUrl} className="underline underline-offset-4 decoration-parchment-border hover:text-ink transition-colors">
              Sign in
            </Link>
            {" "}to join the conversation.
          </p>
        )}
      </div>
    </div>
  );
}
