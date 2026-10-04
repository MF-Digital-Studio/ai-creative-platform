"use client";

import { ThemeProvider } from "./theme-provider";

export function ThemeProviderBoundary({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
