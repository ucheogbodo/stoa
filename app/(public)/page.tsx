// app/(public)/page.tsx
// Public landing page — introductory manifesto and CTA to the Agora.

import Link from "next/link";

export const metadata = {
  title: "Stoa — A Garden of Ideas",
  description: "Not a feed. Not an algorithm. Just ideas, encountered by chance.",
};

export default function PublicHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <h1 className="font-serif text-5xl md:text-6xl text-ink mb-6 leading-tight">
        The Agora
      </h1>
      <p className="text-ink-muted max-w-lg text-lg leading-relaxed mb-4">
        Not a feed. Not a trending list. Not an algorithm.
      </p>
      <p className="text-ink-muted max-w-lg text-base leading-relaxed mb-12">
        The Agora is a place of serendipitous encounter. Each visit surfaces a
        single idea from the garden — chosen not by popularity, but by chance.
        You might find something that changes your thinking. You might find
        something that confirms it. That&apos;s the point.
      </p>
      <Link
        href="/agora"
        className="inline-flex items-center gap-3 bg-ink text-parchment px-8 py-3 rounded-full font-medium hover:bg-sage transition-colors text-lg"
      >
        Encounter an Idea &rarr;
      </Link>
      <Link
        href="/agora/browse"
        className="mt-4 text-sm text-ink-muted hover:text-sage transition-colors"
      >
        or browse the archive
      </Link>
    </div>
  );
}
