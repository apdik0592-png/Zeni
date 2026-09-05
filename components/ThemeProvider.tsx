"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const ThemeContext = createContext<{
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}>({
  mode: "system",
  theme: "light",
  setMode: () => {},
  toggle: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("zeni-theme-mode") as ThemeMode | null;
    setModeState(stored ?? "system");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const compute = () => {
      const resolved: ResolvedTheme = mode === "system" ? (mq.matches ? "dark" : "light") : mode;
      setTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    compute();
    if (mode === "system") {
      mq.addEventListener("change", compute);
      return () => mq.removeEventListener("change", compute);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    window.localStorage.setItem("zeni-theme-mode", m);
  };

  const toggle = () => setMode(theme === "dark" ? "light" : "dark");

  return <ThemeContext.Provider value={{ mode, theme, setMode, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
