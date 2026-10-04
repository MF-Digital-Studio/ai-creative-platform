"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { isThemePreference, resolveTheme, type ThemePreference } from "./theme-state";

export type { ThemePreference } from "./theme-state";
type ThemeContextValue = { preference: ThemePreference; setPreference: (value: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "klay-theme-preference";
const preferenceEvent = "klay-theme-preference-change";

function getPreference(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return isThemePreference(saved) ? saved : "system";
  } catch { return "system"; }
}

function subscribePreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(preferenceEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(preferenceEvent, onChange);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore(subscribePreference, getPreference, (): ThemePreference => "system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const selected = getPreference();
      document.documentElement.dataset.theme = resolveTheme(selected, media.matches);
      document.documentElement.dataset.themePreference = selected;
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    try { window.localStorage.setItem(storageKey, value); } catch { /* Keep the in-memory selection. */ }
    window.dispatchEvent(new Event(preferenceEvent));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    document.documentElement.dataset.theme = resolveTheme(value, media.matches);
    document.documentElement.dataset.themePreference = value;
  }, []);
  const context = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
