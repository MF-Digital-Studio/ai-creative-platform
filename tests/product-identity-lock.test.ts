import assert from "node:assert/strict";
import test from "node:test";

import { selectFinalAttempt } from "../src/lib/auto-repair/select-final-attempt";
import { compileProductIdentityLock } from "../src/lib/product-identity/compile-product-identity-lock";
import { buildProductIdentityManifest } from "../src/lib/product-identity/build-product-identity-manifest";
import { orderGenerationImages } from "../src/lib/generation/image-roles";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import type { GenerationAttempt } from "../src/lib/auto-repair/types";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";

function profile(vertical: ProductProfile["vertical"], details: ProductProfile["verticalAttributes"]["details"], subcategory: string | null = null): ProductProfile {
  return {
    productId: "product", schemaVersion: 1, analysisVersion: "test", vertical, subcategory, wearability: "wearable", rigidity: vertical === "apparel" ? "deformable" : "rigid",
    materials: ["metal"], dominantColors: ["silver"], productShape: subcategory ?? "product", identityCriticalAttributes: [{ attribute: "visible source design", rationale: "source", regions: [] }],
    visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] }, interactionTargets: ["finger"], allowedTransformations: vertical === "apparel" ? ["natural_fabric_deformation", "body_fitting"] : ["perspective_change"], forbiddenTransformations: ["geometry_redesign"],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 }, source: { model: "test", analysisVersion: "test", analyzedAt: "2026-01-01" }, verticalAttributes: { vertical, details } as ProductProfile["verticalAttributes"],
  };
}

const asset = (id: string) => ({ id, bucketId: "assets", objectPath: `${id}.png`, data: Buffer.from(id), mimeType: "image/png" as const });

test("product identity source always remains first for one to three references", () => {
  for (const count of [1, 2, 3]) {
    const images = orderGenerationImages(asset("product"), Array.from({ length: count }, (_, index) => asset(`reference-${index + 1}`)));
    assert.equal(images[0]?.role, "product_identity_source");
    assert.deepEqual(images.map(({ order }) => order), Array.from({ length: count + 1 }, (_, index) => index));
    assert.equal(images[1]?.role, "scene_reference");
  }
});

test("jewelry manifest locks exact center/side stone and band structure", () => {
  const manifest = buildProductIdentityManifest(profile("jewelry", { jewelryType: "ring", metalColorOrMaterial: "silver", centerStone: true, centerStoneShape: "oval", centerStoneColor: "white", stoneCount: 9, stoneLayout: "side and shoulder stones", settingStyle: "four-prong", bandOrChainStructure: "tapered band", bodyPlacementTarget: "finger" }, "ring"));
  const prompt = compileProductIdentityLock(manifest);
  assert.match(manifest.geometryAnchors.join(" "), /center stone shape: oval.*stone count: 9.*setting\/prong structure: four-prong.*band\/chain geometry: tapered band/i);
  assert.match(prompt, /exact same visible product design.*not a plausible similar product/i);
});

test("watch, footwear, apparel, and cosmetics manifests retain their identity anchors", () => {
  const watch = buildProductIdentityManifest(profile("watches", { caseShape: "round", caseMaterialOrColor: "steel", dialColor: "green", bezel: "fixed", crownSide: "right", pushers: "two", braceletOrStrap: "link", indicesOrMarkers: "baton", dateWindow: "three", subdials: "two", dialBrandingRegions: [] }));
  const shoe = buildProductIdentityManifest(profile("footwear", { shoeType: "sneaker", silhouette: "low", upperMaterial: ["leather"], outsole: "rubber", midsole: "foam", panelStructure: ["lateral panel"], lacing: "flat", tongue: "padded", heel: "reinforced", logoRegions: [], colorBlocking: ["white blue"] }));
  const apparel = buildProductIdentityManifest(profile("apparel", { garmentType: "hoodie", primaryColor: "black", artworkOrLogoLocations: [{ location: "chest", description: "print" }], closures: ["zip"], pocketStructure: ["kangaroo"], hoodOrCollar: "hood", constructionDetails: ["side seam"], identitySides: ["front"] }));
  const cosmetics = buildProductIdentityManifest(profile("cosmetics", { packageType: "serum", packageGeometry: "cylindrical", containerForm: "bottle", closureOrDispenser: "dropper", materialOpacity: "transparent", liquidVisibility: "visible", labelRegions: [{ location: "front", description: "label" }], logoRegions: [] }));
  assert.match(`${watch.geometryAnchors.join(" ")} ${watch.colorMaterialAnchors.join(" ")}`, /dial color|crown side|subdial/i);
  assert.match(shoe.geometryAnchors.join(" "), /outsole|panel boundary|lacing/i);
  assert.match(apparel.brandingAnchors.join(" "), /chest/i); assert.ok(apparel.allowedDeformations.includes("natural_fabric_deformation"));
  assert.match(cosmetics.geometryAnchors.join(" "), /outer package geometry/i);
});

function attempt(attempt: 0 | 1, issues: GenerationAttempt["validation"]["issues"]): GenerationAttempt {
  return { attempt, imageData: Buffer.from(String(attempt)), mimeType: "image/png", providerRequestId: null, preservationMode: "reference_edit", validation: { status: issues.length ? "fail" : "pass", issues, retryRecommended: false, checks: [], severity: issues[0]?.severity ?? null, summary: "test", version: "test" } };
}

test("correct product repair beats a better reference match with identity drift", () => {
  const wrongProduct = attempt(0, [{ code: "product_identity_drift", category: "product_identity", severity: "critical", finding: "different ring", expected: "source ring", sourceAuthoritative: true }]);
  const correctProduct = attempt(1, [{ code: "reference_composition_missed", category: "reference_match", severity: "major", finding: "angle adjusted", expected: "reference angle", sourceAuthoritative: false }]);
  assert.equal(selectFinalAttempt(wrongProduct, correctProduct).attempt, 1);
});

test("missing product profile retains a deterministic source-authority baseline", () => {
  assert.deepEqual(buildProductIdentityManifest(null), buildProductIdentityManifest({ vertical: "jewelry" }));
});

test("identity drift is critical while harmless perspective is not an identity failure", () => {
  const issues = mapStructuredValidationOutput({ findings: [{ code: "PRODUCT_IDENTITY_DRIFT", category: "realism", severity: "minor", finding: "different ring design", expected: "source ring" }] });
  assert.equal(issues[0]?.category, "product_identity");
  assert.equal(issues[0]?.severity, "critical");
  assert.equal(resolveQualityGate(issues).status, "fail");
  assert.equal(resolveQualityGate([]).issues.length, 0);
});
