import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const recent = read("src/components/dashboard/recent-work.tsx");
const gallery = read("src/components/projects/project-gallery-card.tsx");
const detail = read("src/components/projects/project-header.tsx");
const menu = read("src/components/projects/project-card-menu.tsx");
const modal = read("src/components/projects/delete-project-modal.tsx");

test("dashboard recent cards use the shared overflow menu and have no delete pill", () => {
  assert.match(recent, /<ProjectCardMenu/);
  assert.doesNotMatch(recent, /DeleteProjectButton|dashboard-project-delete-button/);
});

test("dashboard and projects surfaces share the card menu and delete modal", () => {
  assert.match(gallery, /<ProjectCardMenu/);
  assert.match(menu, /<DeleteProjectModal/);
  assert.match(menu, /event\.stopPropagation\(\)/);
  assert.match(menu, /role="menuitem"/);
});

test("project detail exposes shared project actions and redirects after success", () => {
  assert.match(detail, /<ProjectCardMenu/);
  assert.match(detail, /redirectOnSuccess/);
  assert.match(modal, /router\.replace\("\/dashboard\/projects"\)/);
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
