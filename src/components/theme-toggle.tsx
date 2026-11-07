"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");

    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // Ignore storage failures (private mode, etc.).
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="切换深色模式"
      title="切换深色模式"
      className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md transition-colors"
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  );
}
