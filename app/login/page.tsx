// app/login/page.tsx
// The gate to the garden — two-panel layout, manifesto + credentials.
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/garden";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex bg-parchment">

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex md:w-[45%] flex-col items-start justify-between
                      px-16 py-20 border-r border-parchment-border bg-parchment-dark/30">
        <Link href="/" className="font-serif text-2xl text-ink hover:text-sage transition-colors">
          Stoa
        </Link>

        <div>
          <p className="font-serif text-3xl text-ink leading-relaxed mb-6 max-w-xs">
            &ldquo;Waste no more time arguing what a good man should be.
            Be one.&rdquo;
          </p>
          <p className="text-xs text-ink-muted/60 tracking-widest uppercase">Marcus Aurelius</p>
        </div>

        <div className="space-y-2.5 text-sm text-ink-muted/70">
          <p>✦ Your private garden of ideas</p>
          <p>✦ No feeds. No rankings. No noise.</p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[360px]">

          {/* Mobile wordmark */}
          <div className="md:hidden text-center mb-10">
            <h1 className="font-serif text-3xl text-ink">Stoa</h1>
          </div>

          <div className="mb-8">
            <p className="label-overline mb-2">Welcome back</p>
            <h2 className="font-serif text-3xl text-ink">Enter the Garden</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                Email
              </label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="you@example.com"
                required autoFocus autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••"
                required autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-rust bg-rust-light/60 px-4 py-2.5 rounded-xl" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? "Entering…" : "Enter the Garden"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted">
            New to Stoa?{" "}
            <Link href="/signup" className="text-sage hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
