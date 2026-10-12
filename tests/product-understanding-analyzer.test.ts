import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  getProductProfileFromStoredValue,
  PRODUCT_PROFILE_ANALYSIS_VERSION,
  PRODUCT_PROFILE_SCHEMA_VERSION,
  persistProductAnalysisResult,
} from "../src/lib/product-understanding/product-analysis-core";
import {
  mapProductAnalysisModelOutput,
  validateProductAnalysisModelOutput,
  createProductAnalysisInput,
  productAnalysisModelOutputSchema,
} from "../src/lib/product-understanding/product-analysis-model-output";
import type { ProductProfile } from "../src/lib/product-understanding/types";

const userId = "user-1";
const assetId = "asset-1";

function profile(verticalAttributes: ProductProfile["verticalAttributes"]): ProductProfile {
  return {
    productId: assetId, schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    vertical: verticalAttributes.vertical, subcategory: verticalAttributes.vertical, wearability: "non_wearable", rigidity: "rigid",
    materials: ["visible material"], dominantColors: ["blue"], productShape: "Visible product shape.",
    identityCriticalAttributes: [{ attribute: "visible identity detail", rationale: "product identity", regions: [] }],
    visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["none"], allowedTransformations: ["perspective_change"], forbiddenTransformations: ["recolor", "geometry_redesign"],
    sceneAffinities: { recommendedSceneTags: ["studio"], discouragedSceneTags: [] }, confidence: { overall: 0.9 },
    source: { model: "fake-vision", analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, analyzedAt: "2026-10-01T00:00:00.000Z" }, verticalAttributes,
  };
}

const profiles: Record<ProductProfile["vertical"], ProductProfile> = {
  jewelry: profile({ vertical: "jewelry", details: { jewelryType: "ring", metalColorOrMaterial: "silver-colored metal", centerStone: true, centerStoneShape: "oval", centerStoneColor: "blue", stoneCount: 9, stoneLayout: "blue center stone with halo stones", settingStyle: "prong setting", bandOrChainStructure: "thin band", bodyPlacementTarget: "finger" } }),
  watches: profile({ vertical: "watches", details: { caseShape: "round", caseMaterialOrColor: "steel-colored metal", dialColor: "green", bezel: "smooth", crownSide: "right", pushers: null, braceletOrStrap: "steel bracelet", indicesOrMarkers: "baton markers", dateWindow: "three o'clock", subdials: null, dialBrandingRegions: [] } }),
  apparel: profile({ vertical: "apparel", details: { garmentType: "hoodie", primaryColor: "black", artworkOrLogoLocations: [], closures: [], pocketStructure: ["kangaroo pocket"], hoodOrCollar: "drawstring hood", constructionDetails: [], identitySides: ["front", "back"] } }),
  cosmetics: profile({ vertical: "cosmetics", details: { packageType: "serum", packageGeometry: "rectangular bottle", containerForm: "bottle", closureOrDispenser: "cap", materialOpacity: "transparent", liquidVisibility: "visible", labelRegions: [], logoRegions: [] } }),
  footwear: profile({ vertical: "footwear", details: { shoeType: "sneaker", silhouette: "low-top", upperMaterial: ["mesh"], outsole: "rubber outsole", midsole: "foam", panelStructure: [], lacing: "white laces", tongue: "padded", heel: "structured", logoRegions: [{ location: "side", description: "side logo" }], colorBlocking: ["white", "blue"] } }),
  bags: profile({ vertical: "bags", details: { bagType: "handbag", silhouette: "structured top handle", proportions: "wide body", bodyStructure: "rigid", handleCount: 2, handleGeometry: "arched handles", handleAttachmentPoints: ["top corners"], strapCount: 1, strapPlacement: ["side rings"], strapWidth: "narrow", strapLengthClass: "shoulder", closureType: "zipper", flapOrOpeningShape: "open top", zipperLayout: ["top"], pocketLayout: [], panelConstruction: ["front panel"], stitchingPattern: "edge stitch", pipingOrEdgeTreatment: null, hardwareLayout: ["side rings"], hardwareColor: "gold", logoOrMonogramPlacement: [], material: "leather", materialTexture: "grained", colorBlocking: ["black"], patternOrPrint: null, baseShape: "flat base", baseFeetHardware: null, chainStrap: false, decorativeCharms: [], asymmetricDetails: [] } }),
};

class FakeRepository {
  saveCount = 0;
  requestedUsers: string[] = [];
  saved: ProductProfile | null = null;
  constructor(private asset: { productProfile: unknown } | null = { productProfile: null }) {}
  async findOwnedProductAsset(requestUserId: string, requestedAssetId: string) {
    this.requestedUsers.push(requestUserId);
    return requestUserId === userId && requestedAssetId === assetId && this.asset
      ? { id: assetId, bucketId: "product-assets", objectPath: "path", productProfile: this.asset.productProfile }
      : null;
  }
  async saveProfile(_requestUserId: string, _assetId: string, saved: ProductProfile) { this.saveCount += 1; this.saved = saved; return true; }
}

async function run(result: unknown | Error, repository = new FakeRepository(), force = false, requestedUser = userId) {
  if (result instanceof Error) return { repository, response: { status: "failed" as const, reason: "analysis_failed" as const }, callCount: 1 };
  const response = await persistProductAnalysisResult({ assetId, userId: requestedUser, force, model: "fake-vision", response: result, repository });
  return { repository, response, callCount: 1 };
}

for (const vertical of ["jewelry", "watches", "apparel", "cosmetics", "footwear", "bags"] as const) {
  test(`valid ${vertical} analysis persists a ProductProfile`, async () => {
    const { repository, response } = await run({ status: "supported", inferredCategory: null, profile: profiles[vertical] });
    assert.equal(response.status, "supported");
    assert.equal(repository.saveCount, 1);
    assert.equal(repository.saved?.vertical, vertical);
  });
}

test("unsupported products never write a fake profile", async () => {
  const { repository, response } = await run({ status: "unsupported", inferredCategory: "beverage", profile: null });
  assert.deepEqual(response, { status: "unsupported", inferredCategory: "beverage", unsupportedReason: "Provider classified the image as unsupported.", reason: "unsupported_product" });
  assert.equal(repository.saveCount, 0);
});

test("validated output wrapper is unwrapped, mapped profile persists, and unsupported wrapper remains safe", async () => {
  const repository = new FakeRepository();
  const result = await persistProductAnalysisResult({
    assetId, userId, model: "fake-vision", repository,
    response: { output: profiles.jewelry, errorPaths: [] },
  });
  assert.equal(result.status, "supported");
  assert.equal(repository.saved?.productId, assetId);
  assert.equal(repository.saveCount, 1);

  const unsupported = await persistProductAnalysisResult({
    assetId, userId, model: "fake-vision", repository: new FakeRepository(),
    response: { output: { status: "unsupported", inferredCategory: "beverage" }, errorPaths: [] },
  });
  assert.deepEqual(unsupported, { status: "unsupported", inferredCategory: "beverage", unsupportedReason: "No supported product category was detected.", reason: "unsupported_product" });
});

test("upload analyzer consumes the validated output wrapper and records validation/persistence", async () => {
  const source = await readFile("src/lib/product-understanding/analyze-product-asset.ts", "utf8");
  assert.match(source, /let normalizedEnvelope = response as ProductAnalysisOutputValidation/);
  assert.match(source, /const candidate = normalizedEnvelope\.output/);
  assert.match(source, /validatedOutputVertical/);
  assert.match(source, /validatedProfilePresent: isProductProfile\(validatedOutput\)/);
  assert.match(source, /logAnalysis\("validated"/);
  assert.match(source, /logAnalysis\("persisted"/);
});

test("invalid structured output and API failure preserve the asset", async () => {
  const invalid = await run({ status: "supported", inferredCategory: null, profile: { vertical: "jewelry" } });
  assert.equal(invalid.response.status, "failed");
  assert.equal(invalid.repository.saveCount, 0);
  const failed = await run(new Error("offline"));
  assert.equal(failed.response.status, "failed");
  assert.equal(failed.repository.saveCount, 0);
});

test("current profiles are retained without another persistence write", async () => {
  const repository = new FakeRepository({ productProfile: profiles.jewelry });
  const { response } = await run({ status: "supported", inferredCategory: null, profile: profiles.watches }, repository);
  assert.equal(response.status, "supported");
  assert.equal(response.status === "supported" && response.reused, true);
  assert.equal(repository.saveCount, 0);
});

test("outdated profiles and force re-analysis call the analyzer", async () => {
  const outdated = { ...profiles.jewelry, analysisVersion: "old" };
  const oldResult = await run({ status: "supported", inferredCategory: null, profile: profiles.jewelry }, new FakeRepository({ productProfile: outdated }));
  assert.equal(oldResult.callCount, 1);
  const forced = await run({ status: "supported", inferredCategory: null, profile: profiles.watches }, new FakeRepository({ productProfile: profiles.jewelry }), true);
  assert.equal(forced.callCount, 1);
});

test("failed forced re-analysis preserves the previous valid profile", async () => {
  const repository = new FakeRepository({ productProfile: profiles.jewelry });
  const { response } = await run(new Error("offline"), repository, true);
  assert.equal(response.status, "failed");
  assert.equal(repository.saveCount, 0);
});

test("invalid stored JSON is safely rejected and ownership blocks analysis", async () => {
  assert.equal(getProductProfileFromStoredValue({ productId: assetId }), null);
  const { repository, response } = await run({ status: "supported", inferredCategory: null, profile: profiles.jewelry }, new FakeRepository(), false, "other-user");
  assert.deepEqual(response, { status: "failed", reason: "asset_not_found" });
  assert.deepEqual(repository.requestedUsers, ["other-user"]);
});

test("persisted source metadata is server-populated", async () => {
  const { repository } = await run({ status: "supported", inferredCategory: null, profile: profiles.jewelry });
  assert.equal(repository.saved?.source.analysisVersion, PRODUCT_PROFILE_ANALYSIS_VERSION);
  assert.ok(repository.saved?.source.model);
  assert.ok(repository.saved?.source.analyzedAt);
});

test("a persistence failure remains observable and does not replace a valid profile", async () => {
  const repository = new FakeRepository({ productProfile: profiles.jewelry });
  repository.saveProfile = async () => false;
  const { response } = await run(
    { status: "supported", inferredCategory: null, profile: profiles.watches },
    repository,
    true,
  );

  assert.deepEqual(response, { status: "failed", reason: "persistence_failed" });
  assert.equal(repository.saved, null);
});

function assertStrictSchemaObjects(schema: unknown) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return;
  const record = schema as Record<string, unknown>;
  if (record.type === "object" || (Array.isArray(record.type) && record.type.includes("object"))) {
    assert.equal(record.additionalProperties, false);
    const properties = record.properties as Record<string, unknown>;
    assert.deepEqual([...((record.required as string[]) ?? [])].sort(), Object.keys(properties ?? {}).sort());
  }
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) value.forEach(assertStrictSchemaObjects);
    else assertStrictSchemaObjects(value);
  }
}

test("classification-first schema uses strict required object fields for each status", () => {
  assertStrictSchemaObjects(productAnalysisModelOutputSchema);
  assert.equal(productAnalysisModelOutputSchema.type, "object");
  assert.equal("anyOf" in productAnalysisModelOutputSchema, false);
  assert.equal("oneOf" in productAnalysisModelOutputSchema, false);
});

test("flat jewelry model output maps into the discriminated ProductProfile", () => {
  const output = {
    status: "supported", inferredCategory: null, vertical: "jewelry", subcategory: "ring", wearability: "wearable", rigidity: "rigid",
    materials: ["silver-colored metal", "blue stone"], dominantColors: ["silver", "blue"], productShape: "thin ring band",
    identityCriticalAttributes: [{ attribute: "blue oval center stone", rationale: "central visual identity", regions: [] }],
    visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["finger"], allowedTransformations: ["perspective_change"], forbiddenTransformations: ["gemstone_count_change", "geometry_redesign"],
    recommendedSceneTags: ["jewelry_macro"], discouragedSceneTags: ["wide_full_body"],
    confidence: { overall: 0.9, vertical: 0.98, subcategory: 0.95, materials: 0.7, wearability: 0.98, rigidity: 0.98, visibleBranding: 0.9, verticalAttributes: 0.9 },
    apparel: null, watch: null, cosmetics: null, footwear: null,
    jewelry: { jewelryType: "ring", metalColorOrMaterial: "silver-colored metal", centerStone: true, centerStoneShape: "oval", centerStoneColor: "blue", stoneCount: null, stoneLayout: "halo stones", settingStyle: "prong", bandOrChainStructure: "thin band", bodyPlacementTarget: "finger" },
  };
  const mapped = mapProductAnalysisModelOutput(output, { assetId, model: "gpt-4o-mini", analyzedAt: "2026-10-01T00:00:00.000Z" });
  assert.ok(mapped && !("status" in mapped));
  assert.equal(mapped && !("status" in mapped) ? mapped.vertical : null, "jewelry");
  assert.equal(mapped && !("status" in mapped) ? mapped.interactionTargets.includes("finger") : false, true);
});

test("current Responses API output_text flat JSON maps and associates the asset ID server-side", () => {
  const bagOutput = {
    status: "supported", inferredCategory: null, vertical: "bags", subcategory: "tote", wearability: "wearable", rigidity: "semi_rigid",
    materials: ["grained leather"], dominantColors: ["black"], productShape: "structured tote with two handles",
    identityCriticalAttributes: [], visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["hand"], allowedTransformations: ["perspective_change"], forbiddenTransformations: ["recolor", "geometry_redesign"],
    recommendedSceneTags: ["bags_studio"], discouragedSceneTags: [], confidence: { overall: 0.9, vertical: 0.95, subcategory: 0.8, materials: 0.7, wearability: 0.9, rigidity: 0.8, visibleBranding: 0.9, verticalAttributes: 0.85 },
    apparel: null, jewelry: null, watch: null, cosmetics: null, footwear: null,
    bags: { bagType: "tote", silhouette: "structured rectangular body", proportions: "wide", bodyStructure: "semi-rigid", handleCount: 2, handleGeometry: "arched", handleAttachmentPoints: ["top corners"], strapCount: null, strapPlacement: [], strapWidth: null, strapLengthClass: null, closureType: null, flapOrOpeningShape: "open top", zipperLayout: [], pocketLayout: [], panelConstruction: ["front panel"], stitchingPattern: "edge stitch", pipingOrEdgeTreatment: null, hardwareLayout: [], hardwareColor: null, logoOrMonogramPlacement: [], material: "leather", materialTexture: "grained", colorBlocking: ["black"], patternOrPrint: null, baseShape: "flat", baseFeetHardware: null, chainStrap: null, decorativeCharms: [], asymmetricDetails: [] },
  };
  const validated = validateProductAnalysisModelOutput(bagOutput, { assetId, model: "gpt-4o-mini", analyzedAt: "2026-10-01T00:00:00.000Z" });
  assert.equal(validated.errorPaths.length, 0);
  assert.ok(validated.output && !("status" in validated.output));
  if (validated.output && !("status" in validated.output)) {
    assert.equal(validated.output.vertical, "bags");
    assert.equal(validated.output.productId, assetId);
    assert.equal(validated.output.schemaVersion, PRODUCT_PROFILE_SCHEMA_VERSION);
  }
});

test("malformed JSON and schema mismatch produce safe diagnostic paths", () => {
  const validation = validateProductAnalysisModelOutput({ status: "supported", vertical: "bags" }, { assetId, model: "test", analyzedAt: "now" });
  assert.ok(validation.errorPaths.includes("$.profile"));
  assert.throws(() => JSON.parse("{\"status\":"));
});

test("product analysis image input uses a JPEG data URL at high detail", () => {
  const input = createProductAnalysisInput({ assetId, image: { data: Buffer.from("jpeg-source"), mimeType: "image/jpeg" } });
  const image = input[0].content[1];
  assert.equal(image?.type, "input_image");
  assert.equal(image?.image_url, `data:image/jpeg;base64,${Buffer.from("jpeg-source").toString("base64")}`);
  assert.equal(image?.detail, "high");
});
