import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isThemePreference, resolveTheme } from "../src/components/theme/theme-state";

const source = (path: string) => readFileSync(path, "utf8");

test("theme preference defaults to system and follows a light or dark OS", () => {
  const saved: string | null = null;
  const preference = isThemePreference(saved) ? saved : "system";
  assert.equal(preference, "system");
  assert.equal(resolveTheme(preference, true), "dark");
  assert.equal(resolveTheme(preference, false), "light");
});

test("explicit preferences override the OS and remain valid persisted values", () => {
  for (const preference of ["dark", "light"] as const) {
    assert.equal(isThemePreference(preference), true);
    assert.equal(resolveTheme(preference, preference === "light"), preference);
    assert.equal(resolveTheme(preference, preference === "dark"), preference);
  }
  assert.equal(isThemePreference("invalid"), false);
});

test("system can respond to later OS preference changes without changing preference", () => {
  const preference = "system" as const;
  assert.equal(resolveTheme(preference, false), "light");
  assert.equal(resolveTheme(preference, true), "dark");
  assert.equal(preference, "system");
});

test("preference persists in local storage", () => {
  assert.match(source("src/components/theme/theme-provider.tsx"), /localStorage\.setItem\(storageKey, value\)/);
});

test("refresh initialization restores preference before paint", () => {
  const initializer = source("src/components/theme/theme-init-script.tsx");
  assert.match(initializer, /localStorage\.getItem\(k\)/);
  assert.match(initializer, /dataset\.theme=d/);
  assert.match(initializer, /dangerouslySetInnerHTML/);
  assert.match(initializer, /themePreferenceSource/);
  assert.match(source("src/app/[locale]/layout.tsx"), /<ThemeInitScript \/>/);
});

test("dashboard defaults dark while stored light and system preferences remain supported", () => {
  const css = source("src/app/globals.css");
  assert.match(css, /\.dashboard-shell \{[\s\S]*?--dashboard-background: #09090b;/);
  assert.match(css, /data-theme-preference="light"[\s\S]*?--dashboard-background: #f2f1f5;/);
  assert.match(css, /data-theme-preference-source="stored"/);
});

test("system mode subscribes to live OS preference changes", () => {
  assert.match(source("src/components/theme/theme-provider.tsx"), /media\.addEventListener\("change", applyTheme\)/);
});

test("settings appearance options apply selection immediately and are keyboard operable", () => {
  const control = source("src/app/[locale]/dashboard/account/appearance-control.tsx");
  assert.match(control, /role="radiogroup"/);
  assert.match(control, /role="radio"/);
  assert.match(control, /onClick=\{\(\) => setPreference\(value\)\}/);
  assert.match(control, /ArrowRight/);
});

test("modal and dropdown surfaces use semantic theme tokens", () => {
  const css = source("src/app/globals.css");
  assert.match(css, /\.generation-progress-modal[^\n]*background: var\(--dashboard-surface\)/);
  const language = source("src/components/layout/language-switcher.tsx");
  assert.match(language, /bg-\[var\(--surface\)\]/);
});

test("mobile drawer and backdrop adapt to dashboard theme tokens", () => {
  const css = source("src/app/globals.css");
  assert.match(css, /\.dashboard-drawer \{[^\n]*background: var\(--dashboard-sidebar\)/);
  assert.match(css, /\.dashboard-drawer-backdrop \{[^\n]*background: rgba\(0, 0, 0/);
});

test("root theme initialization suppresses the expected hydration attribute mismatch", () => {
  const layout = source("src/app/[locale]/layout.tsx");
  assert.match(layout, /data-theme="light"/);
  assert.match(layout, /data-theme-preference-source="default"/);
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(source("src/components/theme/theme-init-script.tsx"), /matchMedia\("\(prefers-color-scheme: dark\)"\)/);
});
