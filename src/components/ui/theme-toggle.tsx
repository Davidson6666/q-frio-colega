"use client";

import { Moon, Sun } from "@phosphor-icons/react";

const STORAGE_KEY = "theme";

function setColorSchemeMeta(content: string) {
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute("content", content);
}

/**
 * Two-state control: "follow the system" or "the opposite of the system".
 * The pinned choice is stored in localStorage and applied before first paint
 * by the inline script in the root layout (see theme-script.ts).
 */
function toggleTheme() {
  const root = document.documentElement;
  const pinned = root.dataset.theme;

  try {
    if (pinned) {
      delete root.dataset.theme;
      localStorage.removeItem(STORAGE_KEY);
      setColorSchemeMeta("light dark");
      return;
    }

    const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = systemIsDark ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    setColorSchemeMeta(next);
  } catch {
    // Storage can be unavailable (private mode). The attribute change above
    // may already have been applied for this session, which is fine.
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar entre tema claro e escuro"
      className={
        className ??
        "grid size-10 place-items-center rounded-full text-muted transition-colors duration-300 hover:bg-surface-2 hover:text-foreground"
      }
    >
      <Moon size={20} weight="light" className="theme-icon-moon" aria-hidden />
      <Sun size={20} weight="light" className="theme-icon-sun" aria-hidden />
    </button>
  );
}
