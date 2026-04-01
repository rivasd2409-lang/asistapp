'use client';

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "asistapp-theme";

const THEMES = [
  { value: "dark", label: "Oscuro" },
  { value: "light", label: "Claro" },
  { value: "calm", label: "Calmado" },
  { value: "soft", label: "Suave" },
] as const;

type ThemeValue = (typeof THEMES)[number]["value"];

function applyTheme(theme: ThemeValue) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeValue>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return (
      (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeValue | null) ??
      "light"
    );
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
      <span>Tema</span>
      <select
        value={theme}
        onChange={(event) => {
          const nextTheme = event.target.value as ThemeValue;
          setTheme(nextTheme);
          window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
          applyTheme(nextTheme);
        }}
        className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)]"
      >
        {THEMES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
