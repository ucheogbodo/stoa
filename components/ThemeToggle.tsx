// components/ThemeToggle.tsx
// Sun/moon toggle that switches between dark and light mode.
// Persists the preference in localStorage and applies it via a data-theme
// attribute on <html>. Works in tandem with the anti-FOUC script in app/layout.tsx
// and the [data-theme="light"] variable overrides in globals.css.
"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // On mount, read the current data-theme attribute (set by anti-FOUC script)
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("stoa-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="text-ink-muted hover:text-ink transition-colors text-base leading-none"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
