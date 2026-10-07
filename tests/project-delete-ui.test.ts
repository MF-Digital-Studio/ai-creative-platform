import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const dashboardHome = read("src/app/[locale]/dashboard/page.tsx");
const gallery = read("src/components/projects/project-gallery-card.tsx");
const detail = read("src/components/projects/project-header.tsx");
const menu = read("src/components/projects/project-card-menu.tsx");
const modal = read("src/components/projects/delete-project-modal.tsx");
const popover = read("src/hooks/use-dismissible-popover.ts");
const accountMenu = read("src/components/dashboard/dashboard-account-menu.tsx");
const languageSwitcher = read("src/components/layout/language-switcher.tsx");
const workspaceSelector = read("src/components/sections/workspace-project-selector.tsx");
const messages = {
  tr: JSON.parse(read("src/messages/tr.json")) as { Dashboard: { project: { composer: { invalidAspectRatio: string; aspectRatio: { label: string; names: Record<string, string> } } } } },
  en: JSON.parse(read("src/messages/en.json")) as { Dashboard: { project: { composer: { invalidAspectRatio: string; aspectRatio: { label: string; names: Record<string, string> } } } } },
};

test("dashboard home omits recent projects while the projects area retains the shared menu", () => {
  assert.doesNotMatch(dashboardHome, /RecentWork|recent-work/);
  assert.match(gallery, /<ProjectCardMenu/);
});

test("dashboard and projects surfaces share the card menu and delete modal", () => {
  assert.match(gallery, /<ProjectCardMenu/);
  assert.match(menu, /<DeleteProjectModal/);
  assert.match(menu, /event\.stopPropagation\(\)/);
  assert.match(menu, /role="menuitem"/);
  assert.match(menu, /useDismissiblePopover/);
  assert.match(menu, /close\(\); setModalOpen\(true\)/);
});

test("custom popovers dismiss on outside pointer, Escape, and when another opens", () => {
  assert.match(popover, /addEventListener\("pointerdown"/);
  assert.match(popover, /event\.key !== "Escape"/);
  assert.match(popover, /triggerRef\.current\?\.focus\(\)/);
  assert.match(popover, /OPEN_POPOVER_EVENT/);
  for (const source of [menu, accountMenu, languageSwitcher, workspaceSelector]) {
    assert.match(source, /useDismissiblePopover/);
  }
});

test("account menu actions close before navigation or sign out", () => {
  assert.match(accountMenu, /aria-expanded=\{isOpen\}/);
  assert.match(accountMenu, /onClick=\{\(\) => close\(\)\}/);
});

test("project detail exposes shared project actions and redirects after success", () => {
  assert.match(detail, /<ProjectCardMenu/);
  assert.match(detail, /redirectOnSuccess/);
  assert.match(modal, /router\.replace\("\/dashboard\/projects"\)/);
  assert.match(modal, /if \(redirectOnSuccess\) \{\s*router\.replace\("\/dashboard\/projects"\);\s*return;\s*\}\s*router\.refresh\(\)/);
});

test("shared delete modal has pending-safe dismissal, cancel-first focus, and retry error", () => {
  assert.match(modal, /if \(pending\) event\.preventDefault\(\)/);
  assert.match(modal, /if \(pending\) return/);
  assert.match(modal, /delete-project-dialog-actions button/);
  assert.match(modal, /disabled=\{pending\}/);
  assert.match(modal, /messages\.error/);
});

test("both locales provide consistent delete copy", () => {
  for (const locale of ["en", "tr"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`)) as Record<string, unknown>;
    const dashboard = messages.Dashboard as {recentWork: Record<string, string>; project: Record<string, string>};
    for (const section of [dashboard.recentWork, dashboard.project]) {
      assert.ok(section.deleteHeading);
      assert.ok(section.deleteDescription);
      assert.ok(section.deleteProject);
      assert.ok(section.deleteError);
    }
  }
});

test("project composer aspect-ratio messages exist in both locales", () => {
  for (const locale of ["tr", "en"] as const) {
    const composer = messages[locale].Dashboard.project.composer;
    assert.equal(typeof composer.invalidAspectRatio, "string");
    assert.equal(typeof composer.aspectRatio.label, "string");
    for (const format of ["widescreen", "vertical", "square", "classic", "tall", "cinemascope"]) {
      assert.equal(typeof composer.aspectRatio.names[format], "string");
    }
  }
});
