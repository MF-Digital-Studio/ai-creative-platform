import assert from "node:assert/strict";
import test from "node:test";

import { resolveApparelArtworkRegion, compileApparelArtworkLock, buildApparelFidelityBenchmarkPrompts, runSourceProductFidelityBenchmark } from "../src/lib/product-identity/apparel-identity-manifest";
import { evaluateApparelProductFidelity, resolveApparelFidelityMode } from "../src/lib/product-identity/resolve-apparel-fidelity-mode";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";
import type { FidelityValidationResult } from "../src/lib/fidelity-validation/types";

const apparelProfile: ProductProfile = {
  productId: "tee", schemaVersion: 1, analysisVersion: "test", vertical: "apparel", subcategory: "t-shirt", wearability: "wearable", rigidity: "deformable",
  materials: ["cotton"], dominantColors: ["black"], productShape: "short sleeve t-shirt", identityCriticalAttributes: [],
  visibleBranding: { hasLogo: false, hasReadableText: true, hasArtwork: true, logoRegions: [], textRegions: [{ location: "upper back", description: "white slogan" }], artworkRegions: [{ location: "upper back", description: "large graphic with text" }] },
  interactionTargets: ["torso"], allowedTransformations: ["natural_fabric_deformation", "body_fitting"], forbiddenTransformations: ["geometry_redesign"],
  sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 },
  source: { model: "test", analysisVersion: "test", analyzedAt: "2026-01-01" },
  verticalAttributes: { vertical: "apparel", details: { garmentType: "t-shirt", primaryColor: "black", artworkOrLogoLocations: [{ location: "upper back", description: "large graphic with text" }], closures: [], pocketStructure: [], hoodOrCollar: "crew neck", constructionDetails: ["short sleeve", "relaxed fit"], identitySides: ["back"] } },
};

test("apparel artwork region estimates back print location and marks estimate confidence", () => {
  const manifest = resolveApparelArtworkRegion({ profile: apparelProfile });
  assert.equal(manifest?.artworkSide, "back");
  assert.equal(manifest?.artworkBoundingRegion?.confidence, "profile_estimate");
  assert.equal(manifest?.artworkBoundingRegion?.y, 0.2);
  assert.equal(manifest?.artworkPresent, true);
});

test("artwork, placement, scale, text, and garment structure have explicit source locks", () => {
  const prompt = compileApparelArtworkLock(resolveApparelArtworkRegion({ profile: apparelProfile })!);
  assert.match(prompt, /exact artwork composition/);
  assert.match(prompt, /back placement/);
  assert.match(prompt, /artwork size relative to the garment/);
  assert.match(prompt, /visible text/);
  assert.match(prompt, /do not.*reinterpret the print/i);
});

test("reference cannot override apparel source artwork identity or placement", () => {
  const prompt = compileApparelArtworkLock(resolveApparelArtworkRegion({ profile: apparelProfile })!);
  assert.match(prompt, /EXACT PRODUCT AUTHORITY/);
  assert.match(prompt, /Do not substitute a similar design/);
});

test("artwork drift is critical and placement drift fails the product quality gate", () => {
  const artwork = mapStructuredValidationOutput({ findings: [{ code: "APPAREL_ARTWORK_DRIFT", category: "realism", severity: "minor", finding: "print changed", expected: "source print" }] });
  const placement = mapStructuredValidationOutput({ findings: [{ code: "APPAREL_ARTWORK_PLACEMENT_DRIFT", category: "realism", severity: "minor", finding: "print moved", expected: "source placement" }] });
  assert.equal(artwork[0]?.severity, "critical");
  assert.equal(resolveQualityGate(artwork).status, "fail");
  assert.equal(placement[0]?.severity, "major");
  assert.equal(resolveQualityGate(placement).status, "fail");
  assert.equal(evaluateApparelProductFidelity({ validationStatus: "fail", issueCodes: ["apparel_artwork_placement_drift"], benchmarkStatus: "not_run" }).qualityGatePassed, false);
  assert.equal(evaluateApparelProductFidelity({ validationStatus: "pass", issueCodes: [], benchmarkStatus: "not_run" }).productFidelityReady, false);
  assert.equal(evaluateApparelProductFidelity({ validationStatus: "pass", issueCodes: [], benchmarkStatus: "passed" }).productFidelityReady, true);
});

test("artwork-bearing apparel routes to product-fidelity-first exact-product mode", () => {
  const route = resolveApparelFidelityMode({ vertical: "apparel", manifest: resolveApparelArtworkRegion({ profile: apparelProfile }), userPrompt: "Use the reference scene" });
  assert.equal(route.productFidelityFirst, true);
  assert.equal(route.mode, "product_fidelity_first");
  assert.equal(route.generationMode, "exact_product_apparel");
  assert.equal(route.exactProductApparel, true);
  assert.equal(resolveApparelFidelityMode({ vertical: "jewelry", manifest: null, userPrompt: "same exact product" }).exactProductApparel, false);
});

test("benchmark defines reference-free source product comparisons", () => {
  assert.deepEqual(buildApparelFidelityBenchmarkPrompts().map(({ key }) => key), ["clean_studio_on_model", "ghost_mannequin_or_flat_lay", "neutral_lifestyle_pose"]);
  assert.ok(buildApparelFidelityBenchmarkPrompts().every(({ prompt }) => /exact uploaded apparel/.test(prompt)));
});

test("benchmark runner gives the generator no reference images", async () => {
  const seen: number[] = [];
  const results = await runSourceProductFidelityBenchmark(async ({ referenceImages }) => {
    seen.push(referenceImages.length);
    return "generated";
  });
  assert.equal(results.length, 3);
  assert.deepEqual(seen, [0, 0, 0]);
});

test("repair instructions prioritize artwork and placement before scene issues", () => {
  const validation = {
    version: "test", status: "fail", retryRecommended: true, summary: "drift", checks: [], severity: "critical",
    issues: [
      { code: "reference_background_missed", category: "reference_match", severity: "major", finding: "background", expected: "reference", sourceAuthoritative: false },
      { code: "apparel_artwork_placement_drift", category: "product_identity", severity: "major", finding: "moved", expected: "source", sourceAuthoritative: true },
      { code: "apparel_artwork_drift", category: "product_identity", severity: "critical", finding: "changed", expected: "source", sourceAuthoritative: true },
    ],
  } as FidelityValidationResult;
  const plan = resolveRepairPlan(validation);
  assert.match(plan.repairInstructions[0] ?? "", /PRIORITY 1/);
  assert.match(plan.repairInstructions[1] ?? "", /PRIORITY 2/);
});
