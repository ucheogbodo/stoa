export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-24">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-foreground/50">
        Stoa
      </p>
      <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
        A garden for thinking, not a feed for content.
      </h1>
      <p className="max-w-prose text-lg leading-8 text-foreground/70">
        Plant raw thoughts, connect them, and let them grow into ideas that are
        unmistakably your own. Publish only what has ripened.
      </p>
      <p className="text-sm text-foreground/40">
        Being rebuilt. The garden opens soon.
      </p>
    </main>
  );
}
