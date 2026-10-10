import assert from "node:assert/strict";
import test from "node:test";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";
import { resolveApparelFitPreservation, resolveApparelFitProfile } from "../src/lib/apparel-fit-preservation/resolve-apparel-fit-profile";
import { compileApparelFitPreservationPrompt } from "../src/lib/apparel-fit-preservation/compile-apparel-fit-prompt";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";

const profile: ProductProfile = {
  productId: "jacket", schemaVersion: 1, analysisVersion: "test", vertical: "apparel", subcategory: "leather jacket", wearability: "wearable", rigidity: "semi_rigid",
  materials: ["matte grained leather"], dominantColors: ["black"], productShape: "oversized boxy jacket", identityCriticalAttributes: [],
  visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] }, interactionTargets: ["torso"],
  allowedTransformations: ["natural_fabric_deformation", "body_fitting"], forbiddenTransformations: ["geometry_redesign"], sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 }, source: { model: "test", analysisVersion: "test", analyzedAt: "2026-01-01" },
  verticalAttributes: { vertical: "apparel", details: { garmentType: "leather jacket", primaryColor: "black", artworkOrLogoLocations: [], closures: ["center front zipper with metal puller"], pocketStructure: ["two angled waist welt pockets"], hoodOrCollar: "structured stand collar", constructionDetails: ["oversized boxy fit", "dropped shoulder", "wide long sleeve", "ribbed cuff", "deep ribbed hem at hip", "structured stiff drape", "front and back panel seams"], identitySides: ["front", "back"] } },
};

function issue(code: string, severity: "minor" | "major" | "critical" = "major") {
  return resolveQualityGate(mapStructuredValidationOutput({ findings: [{ code, category: "apparel_fit", severity, confidence: .95, identityImpact: "major", likelyCause: "geometry_change", region: "garment", repairable: true, commercialImpact: "high", finding: code, expected: "source garment" }] }));
}

test("oversized leather jacket remains oversized on model", () => { const policy = resolveApparelFitPreservation({ profile, strategy: "fashion_on_model", humanExpected: true, productOnly: false, sourceViewCount: 3 }); const prompt = compileApparelFitPreservationPrompt(policy, false); assert.match(prompt, /oversized boxy fit/); assert.match(prompt, /never turn oversized\/boxy\/relaxed into fitted/); assert.equal(policy.profile?.authoritySource, "source_product_multiview"); });
test("pocket placement is preserved", () => assert.match(compileApparelFitPreservationPrompt(resolveApparelFitPreservation({ profile, strategy: "fashion_on_model", humanExpected: true, productOnly: false }), false), /two angled waist welt pockets/));
test("ribbed hem and cuff are preserved", () => { const p = resolveApparelFitProfile(profile)!; assert.match(p.hemStructure, /ribbed hem/); assert.match(p.cuffStructure, /ribbed cuff/); });
test("zipper and placket structure are preserved", () => assert.match(resolveApparelFitProfile(profile)!.closureType, /zipper.*puller/));
test("cropped and non-cropped length authority remains explicit", () => { const p = compileApparelFitPreservationPrompt(resolveApparelFitPreservation({ profile, strategy: "fashion_on_model", humanExpected: true, productOnly: false }), false); assert.match(p, /bodyLength=/); assert.match(p, /crop\/waist endpoint/); assert.match(p, /trouser leg length/); });
test("material behavior mismatch is detected as rejecting major", () => { const r = issue("APPAREL_MATERIAL_BEHAVIOR_MISMATCH", "minor"); assert.equal(r.issues[0]?.severity, "major"); assert.equal(r.status, "fail"); });
test("drape mismatch is detected as rejecting major", () => assert.equal(issue("APPAREL_DRAPE_MISMATCH", "major").status, "fail"));
test("high-confidence fit mismatch fails quality gate", () => { const r = issue("APPAREL_FIT_MISMATCH", "minor"); assert.equal(r.issues[0]?.severity, "critical"); assert.equal(r.status, "fail"); });
test("apparel fit issues are eligible for targeted repair", () => assert.deepEqual(resolveRepairPlan(issue("APPAREL_FIT_MISMATCH", "critical")).categories, ["apparel_fit_repair"]));
test("repair preserves identity and scene and only fixes garment fit", () => { const p = compileRepairInstructions("base", resolveRepairPlan(issue("APPAREL_STRUCTURE_MISMATCH", "critical"))); assert.match(p, /Preserve model identity/); assert.match(p, /Preserve scene, camera, environment, lighting and composition/); assert.match(p, /Only correct the validated garment/); });
test("reference authority cannot override source garment fit", () => assert.match(compileApparelFitPreservationPrompt(resolveApparelFitPreservation({ profile, strategy: "fashion_on_model", humanExpected: true, productOnly: false }), true), /must not transfer the reference garment fit/));
test("product-only modes do not trigger human apparel-fit logic", () => { const policy = resolveApparelFitPreservation({ profile, strategy: "rigid_product", humanExpected: false, productOnly: true }); assert.equal(policy.active, false); assert.equal(compileApparelFitPreservationPrompt(policy, true), ""); assert.ok(policy.profile); });
