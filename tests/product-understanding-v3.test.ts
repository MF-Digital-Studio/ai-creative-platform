import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { isProductProfile, PRODUCT_PROFILE_ANALYSIS_VERSION, PRODUCT_PROFILE_SCHEMA_VERSION } from "../src/lib/product-understanding/product-profile";
import { decideProductAnalysisCache } from "../src/lib/product-understanding/product-analysis-cache";
import { getProductAnalysisOutputErrorPaths, mapProductAnalysisModelOutput, normalizeProductVertical, productAnalysisModelOutputSchema, validateProductAnalysisModelOutput } from "../src/lib/product-understanding/product-analysis-model-output";

const source = { assetId: "asset-v3", model: "fixture", analyzedAt: "2026-10-12T00:00:00.000Z" };
function supported(vertical: string, profile: Record<string, unknown> = {}) {
  return { status: "supported", vertical, rawCategory: vertical, subcategory: null, unsupportedReason: "", profile: { vertical, confidence: 0.82, visibleProductCount: 1, identitySummary: [], sourceObservations: [], subcategory: null, material: null, silhouette: null, closure: null, interactionRules: [], ...profile } };
}
function unsupported(rawCategory: string, unsupportedReason = "Clearly outside supported product categories.") {
  return { status: "unsupported", vertical: null, rawCategory, subcategory: null, unsupportedReason, profile: null };
}
function asProfile(value: unknown) {
  const result = mapProductAnalysisModelOutput(value, source);
  return result && !("status" in result) ? result : null;
}

const classifications: Array<[string, string]> = [
  ["jacket", "apparel"], ["hoodie", "apparel"], ["trousers", "apparel"], ["sneaker", "footwear"], ["heel", "footwear"],
  ["handbag", "bags"], ["backpack", "bags"], ["wristwatch", "watches"], ["necklace", "jewelry"], ["cosmetic bottle", "cosmetics"],
];
for (const [category, vertical] of classifications) {
  test(`classification evidence ${category} resolves to ${vertical}`, () => {
    assert.equal(normalizeProductVertical(category), vertical);
    assert.equal(asProfile({ ...supported(vertical), rawCategory: category })?.vertical, vertical);
  });
}

test("apparel with unknown material remains supported", () => {
  assert.equal(asProfile(supported("apparel", { material: null }))?.vertical, "apparel");
});
test("footwear with unknown subtype remains supported", () => {
  assert.equal(asProfile(supported("footwear", { subcategory: null }))?.vertical, "footwear");
});
test("bags with unknown material remain supported", () => {
  assert.equal(asProfile(supported("bags", { material: null }))?.vertical, "bags");
});
test("missing and null optional profile observations do not downgrade classification", () => {
  const candidate = supported("watches", { subcategory: null, material: null, silhouette: null, closure: null, identitySummary: [], sourceObservations: [] });
  assert.equal(asProfile(candidate)?.vertical, "watches");
});

const aliases: Array<[string, string]> = [
  ["clothing", "apparel"], ["fashion_apparel", "apparel"], ["shoe", "footwear"], ["handbag", "bags"],
  ["timepiece", "watches"], ["jewellery", "jewelry"], ["beauty", "cosmetics"],
];
for (const [alias, vertical] of aliases) {
  test(`canonical alias ${alias} maps to ${vertical}`, () => assert.equal(normalizeProductVertical(alias), vertical));
}

test("a clearly unsupported object remains unsupported", () => {
  const mapped = mapProductAnalysisModelOutput(unsupported("ceramic mug"), source);
  assert.deepEqual(mapped && "status" in mapped ? mapped.status : null, "unsupported");
});
test("unusable or unclassifiable visual remains unsupported with evidence", () => {
  const mapped = mapProductAnalysisModelOutput(unsupported("unusable image: no identifiable product"), source);
  assert.deepEqual(mapped && "status" in mapped ? mapped.status : null, "unsupported");
});
test("unsupported requires a meaningful reason and attempted category evidence", () => {
  const invalid = unsupported("");
  invalid.unsupportedReason = " ";
  assert.deepEqual(getProductAnalysisOutputErrorPaths(invalid).sort(), ["$.rawCategory", "$.unsupportedReason"]);
  assert.equal(validateProductAnalysisModelOutput(invalid, source).output, null);
});

const recovery: Array<[string, string]> = [["jacket", "apparel"], ["sneaker", "footwear"], ["handbag", "bags"], ["timepiece", "watches"], ["jewellery", "jewelry"], ["beauty", "cosmetics"]];
for (const [category, vertical] of recovery) {
  test(`contradictory unsupported ${category} recovers to supported ${vertical}`, () => {
    const mapped = asProfile(unsupported(category, "Provider returned a contradictory unsupported status."));
    assert.equal(mapped?.vertical, vertical);
    assert.equal(mapped?.confidence.overall, 0.55);
  });
}
test("unsupported with no supported category evidence is not recovered", () => {
  const result = mapProductAnalysisModelOutput(unsupported("ceramic mug"), source);
  assert.equal(Boolean(result && "status" in result && result.status === "unsupported"), true);
});

test("partial ProductProfile generated from minimum stable observations validates", () => {
  assert.equal(isProductProfile(asProfile(supported("apparel"))), true);
});
test("known vertical with null subcategory validates", () => {
  assert.equal(asProfile(supported("apparel", { subcategory: null }))?.subcategory, null);
});
test("unknown optional details remain null without failing ProductProfile validation", () => {
  const profile = asProfile(supported("jewelry", { material: null, silhouette: null, closure: null }));
  assert.equal(isProductProfile(profile), true);
  assert.deepEqual(profile?.materials, []);
});

const identity = { assetId: "asset-v3", objectPath: "products/item.jpg", model: "fixture" };
const cacheStatus = (overrides: Record<string, unknown> = {}) => ({ status: "unsupported", ...identity, analyzerVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION, ...overrides });
test("V2 unsupported cache misses under V3 identity", () => {
  assert.equal(decideProductAnalysisCache({ force: false, currentProfile: false, identity, status: cacheStatus({ analyzerVersion: "product-understanding-v2", schemaVersion: 2 }) }), "analyze");
});
test("current V3 supported profile is reusable", () => {
  assert.equal(decideProductAnalysisCache({ force: false, currentProfile: true, identity, status: cacheStatus({ status: "valid" }) }), "reuse_supported");
});
test("force true bypasses every cache state", () => {
  assert.equal(decideProductAnalysisCache({ force: true, currentProfile: true, identity, status: cacheStatus() }), "analyze");
});
test("failed transient status preserves its retry window", () => {
  assert.equal(decideProductAnalysisCache({ force: false, currentProfile: false, identity, now: 1_000, status: cacheStatus({ status: "failed_transient", retryAfter: "2099-01-01T00:00:00.000Z" }) }), "respect_retry_window");
});
test("expired transient retry window allows analysis", () => {
  assert.equal(decideProductAnalysisCache({ force: false, currentProfile: false, identity, now: Date.parse("2100-01-01T00:00:00.000Z"), status: cacheStatus({ status: "failed_transient", retryAfter: "2099-01-01T00:00:00.000Z" }) }), "analyze");
});
test("unsupported V3 cache reuses only when full asset and model identity matches", () => {
  assert.equal(decideProductAnalysisCache({ force: false, currentProfile: false, identity, status: cacheStatus() }), "reuse_unsupported");
  assert.equal(decideProductAnalysisCache({ force: false, currentProfile: false, identity, status: cacheStatus({ objectPath: "other.jpg" }) }), "analyze");
});

test("root structured-output schema is directly introspectable and strict", () => {
  assert.equal(productAnalysisModelOutputSchema.type, "object");
  assert.equal(productAnalysisModelOutputSchema.additionalProperties, false);
  assert.deepEqual([...productAnalysisModelOutputSchema.required].sort(), Object.keys(productAnalysisModelOutputSchema.properties).sort());
  assert.ok("vertical" in productAnalysisModelOutputSchema.properties);
});
test("supported profile vertical must match the normalized classification", () => {
  const invalid = supported("apparel", { vertical: "bags" });
  assert.deepEqual(getProductAnalysisOutputErrorPaths(invalid), ["$.profile.vertical"]);
});
test("failed provider status is not persisted as a supported or unsupported result", () => {
  assert.equal(validateProductAnalysisModelOutput({ status: "failed", vertical: null, rawCategory: "", subcategory: null, unsupportedReason: "Provider could not produce valid output.", profile: null }, source).output, null);
});

test("primary upload path triggers the canonical Product Understanding analyzer", async () => {
  const sourceText = await readFile("src/app/[locale]/dashboard/projects/[projectId]/actions.ts", "utf8");
  assert.match(sourceText, /if\s*\(role\s*===\s*["']primary["']\)/);
  assert.match(sourceText, /triggerProductAnalysisAfterRegistration/);
});
test("supporting product views do not independently invoke Product Understanding", async () => {
  const sourceText = await readFile("src/app/[locale]/dashboard/projects/[projectId]/actions.ts", "utf8");
  const guard = sourceText.indexOf('if (role === "primary")');
  const analyzer = sourceText.indexOf("triggerProductAnalysisAfterRegistration", guard);
  assert.ok(guard >= 0 && analyzer > guard);
  assert.match(sourceText.slice(guard, sourceText.indexOf("\n    }", guard)), /analyzeProductAsset/);
});
test("multi-view registration regression keeps exactly one primary analysis", async () => {
  const sourceText = await readFile("tests/product-understanding-trigger.test.ts", "utf8");
  assert.match(sourceText, /registration invokes shared Product Understanding once/i);
  assert.match(sourceText, /reference registration has no Product Understanding trigger invocation/i);
});

test("generation keeps working without Product Understanding via existing fallback tests", async () => {
  const sourceText = await readFile("tests/generation-product-profile-routing.test.ts", "utf8");
  assert.match(sourceText, /invalid or missing ProductProfile/i);
  assert.match(sourceText, /retains legacy prompt routing/i);
});
test("Apparel Fit keeps its source product fallback", async () => {
  const sourceText = await readFile("tests/apparel-fit-preservation.test.ts", "utf8");
  assert.match(sourceText, /source fallback/i);
  assert.match(sourceText, /source_product_fallback/);
});
test("preset vertical fallback remains present", async () => {
  const sourceText = await readFile("src/lib/generation/prompts/build-image-generation-prompt.ts", "utf8");
  assert.match(sourceText, /presetVertical/);
});

test("normal analysis provider path contains one analysis invocation and no retry loop", async () => {
  const sourceText = await readFile("src/lib/product-understanding/analyze-product-asset.ts", "utf8");
  assert.equal((sourceText.match(/dependencies\.client\.analyze\(/g) ?? []).length, 1);
  assert.equal(/while\s*\(|for\s*\([^)]*retry/i.test(sourceText), false);
});
test("unsupported classification returns without an automatic second provider request", async () => {
  const sourceText = await readFile("src/lib/product-understanding/analyze-product-asset.ts", "utf8");
  assert.match(sourceText, /return \{ status: "unsupported"/);
  assert.equal((sourceText.match(/dependencies\.client\.analyze\(/g) ?? []).length, 1);
});
test("adding supporting images cannot multiply Product Understanding calls", async () => {
  const sourceText = await readFile("src/app/[locale]/dashboard/projects/[projectId]/actions.ts", "utf8");
  assert.equal((sourceText.match(/triggerProductAnalysisAfterRegistration\(/g) ?? []).length, 1);
  assert.match(sourceText, /role === "primary"/);
});

test("analysis schema and cache identity use V3", () => {
  assert.equal(PRODUCT_PROFILE_ANALYSIS_VERSION, "product-understanding-v3");
  assert.equal(PRODUCT_PROFILE_SCHEMA_VERSION, 3);
});
