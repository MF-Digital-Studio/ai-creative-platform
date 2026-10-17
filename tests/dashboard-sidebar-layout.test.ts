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

test("sidebar defaults respect explicit preferences before the tablet fallback", () => {
  const frame = read("src/components/dashboard/dashboard-frame.tsx");
  const styles = read("src/app/globals.css");

  assert.match(frame, /if \(saved === "true"\) return true;[\s\S]*if \(saved === "false"\) return false;[\s\S]*matchMedia/);
  assert.match(styles, /--dashboard-rail-width: 13\.5rem;/);
  assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1199px\) \{\s*\.dashboard-shell\[data-collapsed\]/);
  assert.doesNotMatch(styles, /\.dashboard-shell,\s*\.dashboard-shell\[data-collapsed\] \{ --dashboard-rail-width: 4\.25rem; \}/);
});

test("sidebar marks the Create hash destination active", () => {
  const sidebar = read("src/components/dashboard/dashboard-sidebar.tsx");

  assert.match(sidebar, /useSyncExternalStore\(subscribeToHash, getHash/);
  assert.match(sidebar, /item\.key === "create"[\s\S]*hash === "#composer"/);
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

test("dashboard home keeps the composer before preset discovery", () => {
  const page = read("src/app/[locale]/dashboard/page.tsx");
  const composer = read("src/components/dashboard/creative-composer.tsx");
  const hero = read("src/components/dashboard/dashboard-home-hero.tsx");

  assert.match(page, /DashboardHomeHero[\s\S]*CreativeComposer[\s\S]*TemplateRail[\s\S]*RecentGenerations[\s\S]*WorkspaceOverview/);
  assert.doesNotMatch(hero, /next\/image/);
  assert.match(hero, /dashboard-home-hero-copy/);
  assert.match(composer, /DASHBOARD_PRESET_EVENT/);
  assert.match(composer, /creation-flow/);

  for (const locale of ["tr", "en"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`)) as { Dashboard: { home: Record<string, string>; generations: Record<string, string>; overview: Record<string, string> } };
    assert.ok(messages.Dashboard.home.title);
    assert.ok(messages.Dashboard.home.description);
    assert.ok(messages.Dashboard.generations.viewAll);
    assert.ok(messages.Dashboard.overview.openProjects);
  }
});

test("creative composer presents exactly one step from the guided sequence", () => {
  const composer = read("src/components/dashboard/creative-composer.tsx");

  assert.match(
    composer,
    /const steps: readonly FlowStep\[\] = \[\s*"type",\s*"name",\s*"product",\s*"format",\s*"direction",\s*"reference",\s*"details",\s*"review",\s*\]/,
  );
  for (const step of ["type", "name", "product", "format", "direction", "reference", "details", "review"]) {
    assert.match(composer, new RegExp(`\\{step === "${step}" \\? \\(`));
  }
});

test("creative composer preserves guarded navigation and submission", () => {
  const composer = read("src/components/dashboard/creative-composer.tsx");

  assert.match(composer, /step === "name" && !projectName\.trim\(\)/);
  assert.match(composer, /step === "product" && !products\.length/);
  assert.match(composer, /step === "direction" && !selectedPreset && !direction\.trim\(\)/);
  assert.match(composer, /const furthestReachable =[\s\S]*!projectName\.trim\(\)[\s\S]*!products\.length[\s\S]*!selectedPreset && !direction\.trim\(\)/);
  assert.match(composer, /disabled=\{!enabled\}/);
  assert.match(composer, /if \(index > 0\) setStep\(steps\[index - 1\]!\)/);
  assert.match(composer, /<Button onClick=\{proceed\}>/);
  assert.match(composer, /locked\.current/);
  assert.match(
    composer,
    /createWorkspaceProject[\s\S]*registerProductAsset[\s\S]*registerReferenceAsset[\s\S]*updateCreativeDirection[\s\S]*createQueuedImageGeneration/,
  );
  assert.match(composer, /registration\.status === "invalid_image"/);
});

test("creative composer exposes input authority and accessible selection states", () => {
  const composer = read("src/components/dashboard/creative-composer.tsx");

  assert.match(composer, /flow\.productAuthority/);
  assert.match(composer, /flow\.referenceAuthority/);
  assert.match(composer, /role="radiogroup"/);
  assert.match(composer, /role="radio"/);
  assert.match(composer, /aria-checked=/);
  assert.match(composer, /aria-busy="true"/);
  assert.match(composer, /disabled=\{!userId\}/);
});

test("creative composer owns preview URLs until removal or unmount", () => {
  const composer = read("src/components/dashboard/creative-composer.tsx");

  assert.match(composer, /const productPreviews = useRef<FilePreview\[\]>\(\[\]\)/);
  assert.match(composer, /const referencePreviews = useRef<FilePreview\[\]>\(\[\]\)/);
  assert.match(
    composer,
    /useEffect\(\s*\(\) => \(\) => \{[\s\S]*productPreviews\.current\.forEach[\s\S]*referencePreviews\.current\.forEach[\s\S]*\},\s*\[\],\s*\)/,
  );
  assert.match(composer, /function removeProduct[\s\S]*URL\.revokeObjectURL/);
  assert.match(composer, /function removeReference[\s\S]*URL\.revokeObjectURL/);
  assert.match(composer, /MAX_PROJECT_REFERENCE_IMAGES/);
});

test("creative composer production copy is complete in both locales", () => {
  for (const locale of ["tr", "en"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`)) as {
      Dashboard: { composer: { flow: Record<string, string> } };
    };
    const flow = messages.Dashboard.composer.flow;

    assert.match(flow.stepLabel, /\{current\}/);
    assert.match(flow.stepLabel, /\{total\}/);
    assert.ok(flow.productAuthority);
    assert.ok(flow.referenceAuthority);
    assert.ok(flow.presentationLabel);
    assert.ok(flow.reviewDescription);
    assert.ok(flow.generatingDescription);
  }
});
