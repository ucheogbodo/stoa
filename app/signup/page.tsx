// app/signup/page.tsx
// Open registration — two-panel layout matching login.
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/garden";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordMismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }

    setSubmitting(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword: confirm }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Account created. Please sign in.");
      router.push("/login");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
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
            &ldquo;A garden is not made in a season. It is the result of
            a lifetime of patient tending.&rdquo;
          </p>
        </div>

        <div className="space-y-2.5 text-sm text-ink-muted/70">
          <p>✦ A private space to cultivate your ideas</p>
          <p>✦ A public agora of serendipitous encounter</p>
          <p>✦ No feeds, no algorithms, no noise</p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[360px]">

          <div className="md:hidden text-center mb-10">
            <h1 className="font-serif text-3xl text-ink">Stoa</h1>
          </div>

          <div className="mb-8">
            <p className="label-overline mb-2">New here</p>
            <h2 className="font-serif text-3xl text-ink">Begin your garden</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">Name</label>
              <input
                id="name" type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                className="input" placeholder="What shall we call you?"
                required autoFocus autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="you@example.com"
                required autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Password
                <span className="text-ink-muted/50 font-normal ml-2 text-xs">min. 8 characters</span>
              </label>
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••"
                required autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-ink mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm" type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`input ${passwordMismatch ? "border-rust/60 focus:ring-rust/30 focus:border-rust/50" : ""}`}
                placeholder="••••••••"
                required autoComplete="new-password"
              />
              {passwordMismatch && (
                <p className="text-xs text-rust mt-1.5">Passwords don&apos;t match</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-rust bg-rust-light/60 px-4 py-2.5 rounded-xl" role="alert">
                {error}
                {error.includes("already exists") && (
                  <> <Link href="/login" className="underline">Sign in →</Link></>
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || passwordMismatch}
              className="btn-primary w-full justify-center mt-2"
            >
              {submitting ? "Planting your garden…" : "Enter the Garden"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-sage hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
