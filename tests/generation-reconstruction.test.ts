import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveApparelArtworkCropEligibility, resolveHybridProjectionEligibility } from "../src/lib/generation/strategy/generation-strategy";
import { resolveHumanRealismPolicy } from "../src/lib/human-realism/human-realism-policy";
import { compileHumanRealismPrompt } from "../src/lib/human-realism/compile-human-realism-prompt";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";

test("creation persists Sunburst and xhigh defaults with environment override", async () => {
  const source = await readFile("src/app/[locale]/dashboard/projects/[projectId]/generation-actions.ts", "utf8");
  assert.match(source, /OPENAI_IMAGE_MODEL\?\.trim\(\) \|\| "gpt-image-2\.5-sunburst"/);
  assert.match(source, /quality: "xhigh"/);
});

test("server-side dispatch follows successful queue insert and runner has atomic queued guard", async () => {
  const source = await readFile("src/app/[locale]/dashboard/projects/[projectId]/generation-actions.ts", "utf8");
  const dispatch = await readFile("src/lib/generation/dispatch-queued-generation.ts", "utf8");
  assert.match(source, /dispatchQueuedGeneration\(generation\.id,[\s\S]{0,180}\(\) => runQueuedImageGeneration\(project\.id, generation\.id\)/);
  assert.match(source, /\.eq\("status", "queued"\)\s*\.select\("id"\)/);
  assert.match(dispatch, /await run\(generationId\)/);
  assert.match(dispatch, /\[generation-dispatch\] start/);
  assert.match(dispatch, /\[generation-dispatch\] pipeline_entered/);
  assert.match(source, /safeGenerationEvent\("provider", "request_start"/);
  assert.match(source, /eq\("id", generationId\)\.eq\("status", "queued"\)/);
});

test("human realism prompt is included for visible model strategies", () => {
  const policy = resolveHumanRealismPolicy({ strategy: "fashion_on_model", vertical: "apparel" });
  assert.equal(policy.applied, true);
  assert.match(compileHumanRealismPrompt(policy, "apparel"), /HUMAN REALISM/);
});

test("apparel artwork crops and hybrid projection require localized exact-product artwork", () => {
  assert.equal(resolveApparelArtworkCropEligibility({ vertical: "apparel", exactProductApparel: true, artworkPresent: true }), true);
  assert.equal(resolveApparelArtworkCropEligibility({ vertical: "jewelry", exactProductApparel: true, artworkPresent: true }), false);
  assert.equal(resolveHybridProjectionEligibility({ vertical: "apparel", artworkPresent: true, exactProductApparel: true, artworkSide: "front", localized: true }), true);
  assert.equal(resolveHybridProjectionEligibility({ vertical: "apparel", artworkPresent: true, exactProductApparel: true, artworkSide: "unknown", localized: true }), false);
  assert.equal(resolveHybridProjectionEligibility({ vertical: "watches", artworkPresent: true, exactProductApparel: true, artworkSide: "front", localized: true }), false);
});

test("at most one automatic repair attempt is selected", () => {
  const plan = resolveRepairPlan({ status: "fail", retryRecommended: true, commerciallyUsable: false, issues: [{ code: "product_identity_drift", category: "product_identity", severity: "major", finding: "drift", expected: "preserve identity", sourceAuthoritative: true }], checks: [], severity: "major", summary: "identity drift", version: "test" });
  assert.equal(plan.shouldRetry, true);
  assert.equal(plan.shouldRetry ? 1 : 0, 1);
  assert.equal(plan.categories.length, 1);
});

test("general dashboard actions and project actions do not import the generation graph", async () => {
  for (const path of ["src/app/[locale]/dashboard/actions.ts", "src/app/[locale]/dashboard/projects/[projectId]/actions.ts"]) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(source, /generation-actions|apparel-projection|apparel-artwork-localization|sharp/);
  }
});

test("hybrid projection and Sharp remain dynamically imported behind the eligible generation branch", async () => {
  const generation = await readFile("src/app/[locale]/dashboard/projects/[projectId]/generation-actions.ts", "utf8");
  const projection = await readFile("src/lib/apparel-projection/project-artwork.ts", "utf8");
  const localization = await readFile("src/lib/product-identity/apparel-artwork-localization.ts", "utf8");
  assert.match(generation, /await import\("@\/lib\/apparel-projection\/project-artwork"\)/);
  assert.doesNotMatch(generation, /^\s*import .*apparel-projection/m);
  assert.match(projection, /await import\("sharp"\)/);
  assert.doesNotMatch(projection, /^\s*import sharp/m);
  assert.match(localization, /await import\("sharp"\)/);
  assert.doesNotMatch(localization, /^\s*import sharp/m);
  assert.match(generation, /runtime_unavailable/);
});
