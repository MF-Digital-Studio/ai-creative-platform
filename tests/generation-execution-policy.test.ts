import assert from "node:assert/strict";
import test from "node:test";
import { resolveGenerationExecutionPolicy } from "../src/lib/generation/execution-policy/resolve-generation-execution-policy";
import { resolveRepairEligibility } from "../src/lib/generation/execution-policy/resolve-repair-eligibility";
import { estimateGenerationCostUsd } from "../src/lib/generation/cost/estimate-generation-cost";
import { createGenerationPerformanceRecorder } from "../src/lib/generation/performance";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";

function profile(vertical: ProductProfile["vertical"], artwork = false): ProductProfile {
  const details = vertical === "apparel"
    ? { garmentType: "shirt", primaryColor: "black", artworkOrLogoLocations: artwork ? [{ location: "chest", description: "graphic" }] : [], closures: [], pocketStructure: [], hoodOrCollar: "crew", constructionDetails: [], identitySides: ["front" as const] }
    : vertical === "jewelry"
      ? { jewelryType: "ring", metalColorOrMaterial: "silver", centerStone: true, centerStoneShape: "round", centerStoneColor: "clear", stoneCount: 1, stoneLayout: "center", settingStyle: "prong", bandOrChainStructure: "band", bodyPlacementTarget: "finger" as const }
      : { packageType: "bottle", packageGeometry: "cylinder", containerForm: "bottle" as const, closureOrDispenser: "cap" as const, materialOpacity: "opaque" as const, liquidVisibility: "not_visible" as const, labelRegions: [], logoRegions: [] };
  return { productId: "asset", schemaVersion: 1, analysisVersion: "product-understanding-v1", vertical, subcategory: null, wearability: vertical === "jewelry" ? "wearable" : "non_wearable", rigidity: "rigid", materials: [], dominantColors: [], productShape: "", identityCriticalAttributes: [], visibleBranding: { hasLogo: false, hasReadableText: artwork, hasArtwork: artwork, logoRegions: [], textRegions: [], artworkRegions: [] }, interactionTargets: [vertical === "jewelry" ? "finger" : "none"], allowedTransformations: ["none"], forbiddenTransformations: ["geometry_redesign"], sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 }, source: { model: "test", analysisVersion: "product-understanding-v1", analyzedAt: "2026-10-04" }, verticalAttributes: { vertical, details } as ProductProfile["verticalAttributes"] };
}

const defaults = { hasReference: false, referenceReplacement: false, exactProduct: false, artworkLocalized: false, presetConfidence: "high" as const, hasCustomNote: false, ambiguousNote: false };

test("low-risk still-life resolves high; visible artwork, jewelry, and watches resolve xhigh", () => {
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("cosmetics") }).quality, "high");
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("apparel", true) }).quality, "xhigh");
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("jewelry") }).quality, "xhigh");
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("watches") }).quality, "xhigh");
});

test("strong preset skips enhancement, custom ambiguous note enables it", () => {
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("cosmetics") }).promptEnhancement, false);
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("cosmetics"), hasCustomNote: true, ambiguousNote: true }).promptEnhancement, true);
});

test("minor and non-actionable findings do not trigger repair; critical targeted identity issue does", () => {
  const base = { checks: [], severity: "minor" as const, retryRecommended: true, commerciallyUsable: true, summary: "", version: "test" };
  const minor = { ...base, status: "fail" as const, issues: [{ code: "minor_cosmetic_imperfection", category: "realism" as const, severity: "minor" as const, finding: "minor", expected: "", sourceAuthoritative: false }] };
  const critical = { ...base, status: "fail" as const, severity: "critical" as const, issues: [{ code: "product_identity_drift", category: "product_identity" as const, severity: "critical" as const, finding: "drift", expected: "source", sourceAuthoritative: true }] };
  assert.equal(resolveRepairEligibility({ validation: minor, exactProduct: false, hybridProjectionApplied: false, maximumAttemptsRemaining: true }).eligible, false);
  assert.equal(resolveRepairEligibility({ validation: critical, exactProduct: true, hybridProjectionApplied: false, maximumAttemptsRemaining: true }).eligible, true);
  assert.equal(resolveRepairEligibility({ validation: critical, exactProduct: true, hybridProjectionApplied: false, maximumAttemptsRemaining: false }).eligible, false);
});

test("pass with warnings suppresses repair while high-confidence identity failure remains repairable", () => {
  const warning = { status: "pass_with_warnings" as const, checks: [], commerciallyUsable: true, severity: "minor" as const, retryRecommended: false, summary: "warning", version: "test", issues: [{ code: "apparel_artwork_placement_drift", category: "product_identity" as const, severity: "minor" as const, finding: "small shift", expected: "same placement class", sourceAuthoritative: true, confidence: .8, identityImpact: "minor" as const, likelyCause: "perspective" as const }] };
  assert.equal(resolveRepairEligibility({ validation: warning, exactProduct: true, hybridProjectionApplied: false, maximumAttemptsRemaining: true }).eligible, false);
  const wrongProduct = { status: "fail" as const, checks: [], commerciallyUsable: false, severity: "critical" as const, retryRecommended: true, summary: "wrong product", version: "test", issues: [{ code: "product_identity_drift", category: "product_identity" as const, severity: "critical" as const, finding: "different product", expected: "source SKU", sourceAuthoritative: true, confidence: .97, identityImpact: "critical" as const, likelyCause: "source_identity_drift" as const }] };
  assert.equal(resolveRepairEligibility({ validation: wrongProduct, exactProduct: true, hybridProjectionApplied: false, maximumAttemptsRemaining: true }).eligible, true);
});

test("hybrid projection suppresses redundant repair if identity issues were resolved", () => {
  const validation = { status: "fail" as const, checks: [], commerciallyUsable: true, severity: "minor" as const, retryRecommended: true, summary: "", version: "test", issues: [{ code: "minor_cosmetic_imperfection", category: "realism" as const, severity: "minor" as const, finding: "minor", expected: "", sourceAuthoritative: false }] };
  assert.equal(resolveRepairEligibility({ validation, exactProduct: true, hybridProjectionApplied: true, maximumAttemptsRemaining: true }).reason, "no_material_targeted_issue");
});

test("artwork-only drift with unavailable hybrid projection suppresses full generation repair", () => {
  const validation = { status: "fail" as const, checks: [], commerciallyUsable: false, severity: "critical" as const, retryRecommended: true, summary: "", version: "test", issues: [
    { code: "APPAREL_ARTWORK_TEXT_DRIFT", category: "product_identity" as const, severity: "critical" as const, finding: "text differs", expected: "source", sourceAuthoritative: true },
    { code: "APPAREL_ARTWORK_PLACEMENT_DRIFT", category: "product_identity" as const, severity: "major" as const, finding: "placement differs", expected: "source", sourceAuthoritative: true },
  ] };
  const result = resolveRepairEligibility({ validation, exactProduct: true, hybridProjectionEnabled: true, hybridProjectionApplied: false, hybridProjectionReady: false, maximumAttemptsRemaining: true });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "artwork_requires_projection_not_full_regeneration");
  assert.equal(result.repairExpectedValue, 0);
});

test("global identity and severe anatomy failures retain one repair opportunity", () => {
  for (const [code, category] of [["garment_type_changed", "product_identity"], ["hand_anatomy_error", "human_realism"]] as const) {
    const validation = { status: "fail" as const, checks: [], commerciallyUsable: false, severity: "critical" as const, retryRecommended: true, summary: "", version: "test", issues: [{ code, category, severity: "critical" as const, finding: "critical", expected: "source", sourceAuthoritative: true }] };
    assert.equal(resolveRepairEligibility({ validation, exactProduct: true, hybridProjectionApplied: false, maximumAttemptsRemaining: true }).eligible, true, code);
  }
});

test("small logo apparel can start high while on-model apparel and complex typography stay xhigh", () => {
  const apparel = profile("apparel", true);
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("apparel"), strategy: "fashion_on_model" }).quality, "xhigh");
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: apparel, artworkLocalized: true, artworkComplexity: "simple_logo" }).quality, "high");
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: apparel, exactProduct: true, artworkLocalized: true, artworkComplexity: "complex_artwork" }).quality, "xhigh");
});

test("artwork-only issue with enabled but unapplied projection never launches full repair", () => {
  const validation = { status: "fail" as const, checks: [], commerciallyUsable: false, severity: "major" as const, retryRecommended: true, summary: "", version: "test", issues: [{ code: "APPAREL_ARTWORK_PLACEMENT_DRIFT", category: "product_identity" as const, severity: "major" as const, finding: "placement", expected: "source", sourceAuthoritative: true }] };
  const result = resolveRepairEligibility({ validation, exactProduct: true, hybridProjectionEnabled: true, hybridProjectionApplied: false, maximumAttemptsRemaining: true });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "artwork_requires_projection_not_full_regeneration");
});

test("reference replacement and complex on-model footwear use xhigh", () => {
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("cosmetics"), referenceReplacement: true }).quality, "xhigh");
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("footwear"), strategy: "footwear_on_model" }).quality, "xhigh");
  assert.equal(resolveGenerationExecutionPolicy({ ...defaults, productProfile: profile("footwear"), strategy: "rigid_product" }).quality, "high");
});

test("pricing estimation requires configured model pricing and actual usage", () => {
  const old = process.env.GENERATION_MODEL_PRICING;
  process.env.GENERATION_MODEL_PRICING = JSON.stringify({ test: { inputPerMillionUsd: 2, outputPerMillionUsd: 4 } });
  assert.equal(estimateGenerationCostUsd("test", { inputTokens: 1000, outputTokens: 500 }), 0.004);
  assert.equal(estimateGenerationCostUsd("missing", { inputTokens: 1000 }), null);
  if (old === undefined) delete process.env.GENERATION_MODEL_PRICING;
  else process.env.GENERATION_MODEL_PRICING = old;
});

test("generation performance recorder records deterministic stage durations", () => {
  const recorder = createGenerationPerformanceRecorder("generation", 1000);
  assert.equal(typeof recorder.finish().total, "number");
  assert.ok(Number.isFinite(recorder.finish().total));
});
