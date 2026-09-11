"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Theme = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolved: "dark",
  setTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("sheytoni-theme") as Theme | null;
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(getInitialTheme()));

  const apply = useCallback((next: Theme) => {
    const r = resolve(next);
    setResolved(r);
    document.documentElement.setAttribute("data-theme", r);
  }, []);

  useEffect(() => {
    apply(theme);
  }, [theme, apply]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, apply]);

  const setTheme = (next: Theme) => {
    localStorage.setItem("sheytoni-theme", next);
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
