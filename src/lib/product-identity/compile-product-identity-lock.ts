import type { ProductIdentityManifest } from "./types";

function section(label: string, values: string[]) { return values.length ? `${label}: ${values.join("; ")}.` : ""; }

export function compileProductIdentityLock(manifest: ProductIdentityManifest): string {
  return [
    "SOURCE PRODUCT IDENTITY — EXACT DESIGN AUTHORITY",
    "The uploaded product image is the authoritative identity source. Use the exact same visible product design, not a plausible similar product. Preserve visible component counts, relative proportions, colors, material behavior, branding regions, and identity-critical structures.",
    section("Immutable attributes", manifest.immutableAttributes),
    section("Geometry anchors", manifest.geometryAnchors),
    section("Color and material anchors", manifest.colorMaterialAnchors),
    section("Branding anchors", manifest.brandingAnchors),
    section("Interaction-sensitive attributes", manifest.interactionSensitiveAttributes),
    section("Allowed deformations only", manifest.allowedDeformations.map((item) => item.replaceAll("_", " "))),
    section("Forbidden changes", manifest.forbiddenChanges),
  ].filter(Boolean).join("\n");
}
