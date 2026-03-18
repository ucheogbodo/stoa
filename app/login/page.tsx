// app/login/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Login page — the gate to the garden.
// Uses NextAuth's `signIn` function with the "credentials" provider.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // `signIn` returns a result object — it does NOT throw on failure
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // we handle the redirect manually
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      // Successfully signed in — go to the garden
      router.push("/garden");
      router.refresh(); // force a server-side session refresh
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">

        {/* Logo / wordmark */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-ink tracking-tight">Stoa</h1>
          <p className="mt-2 text-ink-muted text-sm">
            A garden for your ideas
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-rust" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? "Entering…" : "Enter the Garden"}
          </button>
        </form>

        {/* Subtle footer note */}
        <p className="mt-8 text-center text-xs text-ink-muted">
          This is a private garden. Only invited minds may enter.
        </p>
      </div>
    </div>
  );
}
