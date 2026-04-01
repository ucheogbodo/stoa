// app/garden/settings/profile/page.tsx
// Private profile settings editor — accessible to the authenticated user only.
// Allows editing all 7 philosopher's profile fields.
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
interface LineageEntry { name: string; url: string }
interface Season { period: string; description: string }
interface EpistemicStance {
  reasonFrom: string;
  holdBeliefs: string;
  uncertainAbout: string;
}

interface ProfileData {
  name: string;
  inscription: string;
  epigraph: string;
  intellectualLineage: LineageEntry[];
  epistemicStance: EpistemicStance;
  intellectualSeasons: Season[];
  unresolvedQuestions: string[];
  profilePublic: boolean;
}

const EMPTY_PROFILE: ProfileData = {
  name: "",
  inscription: "",
  epigraph: "",
  intellectualLineage: [],
  epistemicStance: { reasonFrom: "", holdBeliefs: "", uncertainAbout: "" },
  intellectualSeasons: [],
  unresolvedQuestions: [],
  profilePublic: true,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-lg text-ink mb-1">{children}</h2>
  );
}

function SectionNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-ink-muted mb-4 leading-relaxed">{children}</p>;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          name: data.name ?? "",
          inscription: data.inscription ?? "",
          epigraph: data.epigraph ?? "",
          intellectualLineage: Array.isArray(data.intellectualLineage)
            ? data.intellectualLineage
            : [],
          epistemicStance: data.epistemicStance ?? { reasonFrom: "", holdBeliefs: "", uncertainAbout: "" },
          intellectualSeasons: Array.isArray(data.intellectualSeasons) ? data.intellectualSeasons : [],
          unresolvedQuestions: Array.isArray(data.unresolvedQuestions) ? data.unresolvedQuestions : [],
          profilePublic: data.profilePublic ?? true,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [profile]);

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  // ── Lineage helpers ─────────────────────────────────────────────────────────
  function addLineage() {
    set("intellectualLineage", [...profile.intellectualLineage, { name: "", url: "" }]);
  }
  function updateLineage(i: number, field: keyof LineageEntry, value: string) {
    const next = profile.intellectualLineage.map((e, idx) => idx === i ? { ...e, [field]: value } : e);
    set("intellectualLineage", next);
  }
  function removeLineage(i: number) {
    set("intellectualLineage", profile.intellectualLineage.filter((_, idx) => idx !== i));
  }
  function moveLineage(i: number, dir: -1 | 1) {
    const arr = [...profile.intellectualLineage];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set("intellectualLineage", arr);
  }

  // ── Season helpers ──────────────────────────────────────────────────────────
  function addSeason() {
    set("intellectualSeasons", [...profile.intellectualSeasons, { period: "", description: "" }]);
  }
  function updateSeason(i: number, field: keyof Season, value: string) {
    const next = profile.intellectualSeasons.map((e, idx) => idx === i ? { ...e, [field]: value } : e);
    set("intellectualSeasons", next);
  }
  function removeSeason(i: number) {
    set("intellectualSeasons", profile.intellectualSeasons.filter((_, idx) => idx !== i));
  }
  function moveSeason(i: number, dir: -1 | 1) {
    const arr = [...profile.intellectualSeasons];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set("intellectualSeasons", arr);
  }

  // ── Question helpers ────────────────────────────────────────────────────────
  function addQuestion() {
    set("unresolvedQuestions", [...profile.unresolvedQuestions, ""]);
  }
  function updateQuestion(i: number, value: string) {
    set("unresolvedQuestions", profile.unresolvedQuestions.map((q, idx) => idx === i ? value : q));
  }
  function removeQuestion(i: number) {
    set("unresolvedQuestions", profile.unresolvedQuestions.filter((_, idx) => idx !== i));
  }
  function moveQuestion(i: number, dir: -1 | 1) {
    const arr = [...profile.unresolvedQuestions];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    set("unresolvedQuestions", arr);
  }

  if (loading) return (
    <div className="animate-pulse max-w-2xl space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-parchment-dark rounded" />)}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <Link href="/garden" className="text-sm text-ink-muted hover:text-ink transition-colors">
          ← Garden
        </Link>
        <h1 className="font-serif text-3xl text-ink mt-4">Profile</h1>
        <p className="text-sm text-ink-muted mt-1">
          Your philosopher&apos;s profile. Public at{" "}
          <span className="font-mono text-xs">/profile/…</span>
        </p>
      </div>

      <div className="space-y-12">

        {/* Display name */}
        <section>
          <SectionLabel>Display Name</SectionLabel>
          <SectionNote>How your name appears on public published ideas.</SectionNote>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className="input"
          />
        </section>

        <hr className="border-parchment-border" />

        {/* Inscription */}
        <section>
          <SectionLabel>The Philosopher&apos;s Inscription</SectionLabel>
          <SectionNote>
            A single statement of intellectual intent — not a bio, but an orientation.
            E.g. &quot;I am pursuing the question of whether silence is a form of argument.&quot;
          </SectionNote>
          <textarea
            value={profile.inscription}
            onChange={(e) => set("inscription", e.target.value)}
            placeholder="I am pursuing the question of…"
            rows={3}
            maxLength={300}
            className="input resize-none"
          />
          <p className="text-xs text-ink-muted mt-1 text-right">
            {profile.inscription.length}/300
          </p>
        </section>

        <hr className="border-parchment-border" />

        {/* Epigraph */}
        <section>
          <SectionLabel>The Stoa (Epigraph)</SectionLabel>
          <SectionNote>
            A single line beneath your name — a quote, a fragment, or an open question.
            It orients the reader before they enter.
          </SectionNote>
          <input
            type="text"
            value={profile.epigraph}
            onChange={(e) => set("epigraph", e.target.value)}
            placeholder="A line that orients the reader…"
            maxLength={200}
            className="input"
          />
        </section>

        <hr className="border-parchment-border" />

        {/* Epistemic Stance */}
        <section>
          <SectionLabel>Epistemic Stance</SectionLabel>
          <SectionNote>Your intellectual posture — three optional declarations.</SectionNote>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-ink-muted mb-1">I tend to reason from…</label>
              <input
                type="text"
                value={profile.epistemicStance.reasonFrom}
                onChange={(e) => set("epistemicStance", { ...profile.epistemicStance, reasonFrom: e.target.value })}
                placeholder="first principles, lived experience, analogy…"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">I hold my beliefs…</label>
              <input
                type="text"
                value={profile.epistemicStance.holdBeliefs}
                onChange={(e) => set("epistemicStance", { ...profile.epistemicStance, holdBeliefs: e.target.value })}
                placeholder="provisionally, with conviction, as working hypotheses…"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">I am currently most uncertain about…</label>
              <textarea
                value={profile.epistemicStance.uncertainAbout}
                onChange={(e) => set("epistemicStance", { ...profile.epistemicStance, uncertainAbout: e.target.value })}
                placeholder="What you are actively grappling with…"
                rows={2}
                className="input resize-none"
              />
            </div>
          </div>
        </section>

        <hr className="border-parchment-border" />

        {/* Intellectual Lineage */}
        <section>
          <SectionLabel>Intellectual Lineage</SectionLabel>
          <SectionNote>
            Thinkers, books, or movements that have shaped your thinking. Set in plain text — not tags.
          </SectionNote>
          <div className="space-y-2">
            {profile.intellectualLineage.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveLineage(i, -1)} disabled={i === 0}
                    className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs leading-none">▲</button>
                  <button type="button" onClick={() => moveLineage(i, 1)} disabled={i === profile.intellectualLineage.length - 1}
                    className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => updateLineage(i, "name", e.target.value)}
                  placeholder="Name or title"
                  className="input flex-1"
                />
                <input
                  type="url"
                  value={entry.url}
                  onChange={(e) => updateLineage(i, "url", e.target.value)}
                  placeholder="Link (optional)"
                  className="input w-48"
                />
                <button type="button" onClick={() => removeLineage(i)}
                  className="text-ink-muted hover:text-rust text-sm shrink-0">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLineage}
            className="btn-ghost text-xs mt-3">+ Add influence</button>
        </section>

        <hr className="border-parchment-border" />

        {/* Intellectual Seasons */}
        <section>
          <SectionLabel>Intellectual Seasons</SectionLabel>
          <SectionNote>
            A timeline of self-declared phases of inquiry. Each season marks a period and its central preoccupation.
          </SectionNote>
          <div className="space-y-3">
            {profile.intellectualSeasons.map((season, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5 mt-2">
                  <button type="button" onClick={() => moveSeason(i, -1)} disabled={i === 0}
                    className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs leading-none">▲</button>
                  <button type="button" onClick={() => moveSeason(i, 1)} disabled={i === profile.intellectualSeasons.length - 1}
                    className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={season.period}
                    onChange={(e) => updateSeason(i, "period", e.target.value)}
                    placeholder="Time period (e.g. Spring 2023)"
                    className="input text-sm"
                  />
                  <textarea
                    value={season.description}
                    onChange={(e) => updateSeason(i, "description", e.target.value)}
                    placeholder="The central preoccupation of this season…"
                    rows={2}
                    className="input resize-none text-sm"
                  />
                </div>
                <button type="button" onClick={() => removeSeason(i)}
                  className="text-ink-muted hover:text-rust text-sm mt-2 shrink-0">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSeason}
            className="btn-ghost text-xs mt-3">+ Add season</button>
        </section>

        <hr className="border-parchment-border" />

        {/* The Unresolved */}
        <section>
          <SectionLabel>The Unresolved</SectionLabel>
          <SectionNote>
            Questions you are actively holding but have not yet answered. Open invitations to think alongside you.
          </SectionNote>
          <div className="space-y-2">
            {profile.unresolvedQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveQuestion(i, -1)} disabled={i === 0}
                    className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs leading-none">▲</button>
                  <button type="button" onClick={() => moveQuestion(i, 1)} disabled={i === profile.unresolvedQuestions.length - 1}
                    className="text-ink-muted hover:text-ink disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                  placeholder="A question you are living with…"
                  className="input flex-1"
                />
                <button type="button" onClick={() => removeQuestion(i)}
                  className="text-ink-muted hover:text-rust text-sm shrink-0">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addQuestion}
            className="btn-ghost text-xs mt-3">+ Add question</button>
        </section>

        <hr className="border-parchment-border" />

        {/* Visibility */}
        <section>
          <SectionLabel>Profile Visibility</SectionLabel>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set("profilePublic", !profile.profilePublic)}
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${profile.profilePublic ? "bg-sage" : "bg-parchment-border"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${profile.profilePublic ? "translate-x-5" : "translate-x-1"}`} />
            </div>
            <span className="text-sm text-ink">{profile.profilePublic ? "Public profile" : "Private profile"}</span>
          </label>
          <p className="text-xs text-ink-muted mt-2">
            When private, your profile page returns a private message to any visitor.
          </p>
        </section>

        {/* Save */}
        <div className="pt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === "saving"}
            className="btn-primary px-8"
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : "Save Profile"}
          </button>
          {saveState === "error" && (
            <p className="text-sm text-rust">Save failed. Please try again.</p>
          )}
        </div>

      </div>
    </div>
  );
}
