// app/(public)/page.tsx
// Public landing page — a quiet invitation.

import Link from "next/link";

export const metadata = {
  title: "Stoa — A Garden of Ideas",
  description: "Not a feed. Not an algorithm. Just ideas, encountered by chance.",
};

export default function PublicHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">

      {/* Decorative overline */}
      <p className="label-overline mb-6 tracking-[0.25em]">The Agora</p>

      {/* Headline */}
      <h1 className="font-serif text-5xl md:text-6xl text-ink mb-6 leading-tight max-w-xl">
        Ideas, encountered<br className="hidden sm:block" /> by chance.
      </h1>

      {/* Subtext */}
      <p className="text-ink-muted max-w-md text-base leading-relaxed mb-3">
        Not a feed. Not a trending list. Not an algorithm.
      </p>
      <p className="text-ink-muted max-w-md text-sm leading-relaxed mb-12">
        The Agora surfaces one idea from the garden at a time — chosen not by
        popularity, but by chance. You might find something that changes your
        thinking.
      </p>

      {/* Primary CTA */}
      <Link
        href="/agora"
        className="btn-primary text-base px-8 py-3 mb-5"
      >
        Encounter an Idea →
      </Link>

      {/* Secondary CTAs */}
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/signup"
          className="text-sm text-ink-muted hover:text-ink transition-colors underline underline-offset-4 decoration-parchment-border"
        >
          Plant your own garden
        </Link>
        <Link
          href="/agora/browse"
          className="text-xs text-ink-muted/50 hover:text-ink-muted transition-colors"
        >
          or browse the archive
        </Link>
      </div>
    </div>
  );
}
