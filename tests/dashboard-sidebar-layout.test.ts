import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("plan card sits in the desktop sidebar footer above the website link", () => {
  const sidebar = read("src/components/dashboard/dashboard-sidebar.tsx");
  assert.match(sidebar, /dashboard-sidebar-spacer[\s\S]*dashboard-sidebar-footer[\s\S]*dashboard-sidebar-plan-slot[\s\S]*dashboard-site-link/);
});

test("plan card follows the mobile spacer inside the drawer footer", () => {
  const mobileNav = read("src/components/dashboard/dashboard-mobile-nav.tsx");
  assert.match(mobileNav, /dashboard-drawer-spacer[\s\S]*dashboard-drawer-footer[\s\S]*dashboard-drawer-plan-slot[\s\S]*dashboard-drawer-nav-secondary/);
});

test("dashboard topbar greets the signed-in user in both locales", () => {
  const topbar = read("src/components/dashboard/dashboard-topbar.tsx");
  assert.match(topbar, /dashboard-topbar-welcome/);
  assert.match(topbar, /t\("welcome", \{ name \}\)/);

  for (const locale of ["tr", "en"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`)) as { Dashboard: { topbar: Record<string, string> } };
    assert.match(messages.Dashboard.topbar.welcome, /\{name\}/);
    assert.ok(messages.Dashboard.topbar.welcomeWithoutName);
  }
});

test("dashboard home keeps the creation workflow while adding editorial discovery", () => {
  const page = read("src/app/[locale]/dashboard/page.tsx");
  const composer = read("src/components/dashboard/creative-composer.tsx");
  const hero = read("src/components/dashboard/dashboard-home-hero.tsx");

  assert.match(page, /DashboardHomeHero[\s\S]*CreativeComposer[\s\S]*TemplateRail[\s\S]*RecentGenerations[\s\S]*WorkspaceOverview/);
  assert.match(hero, /next\/image/);
  assert.match(hero, /href="#composer"/);
  assert.match(composer, /DASHBOARD_PRESET_EVENT/);
  assert.match(composer, /current === "type" \? "name" : current/);

  for (const locale of ["tr", "en"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`)) as { Dashboard: { home: Record<string, string>; generations: Record<string, string>; overview: Record<string, string> } };
    assert.ok(messages.Dashboard.home.title);
    assert.ok(messages.Dashboard.home.description);
    assert.ok(messages.Dashboard.generations.viewAll);
    assert.ok(messages.Dashboard.overview.openProjects);
  }
});
