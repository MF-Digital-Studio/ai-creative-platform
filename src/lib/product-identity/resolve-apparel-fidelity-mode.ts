import type { ApparelIdentityManifest } from "./apparel-identity-manifest";

export type ApparelFidelityMode = {
  mode: "product_fidelity_first" | "standard";
  generationMode: "exact_product_apparel" | "standard";
  productFidelityFirst: boolean;
  exactProductApparel: boolean;
  reason: "visible_apparel_artwork" | "explicit_exact_product" | null;
};

const exactProductIntent = /(?:exact|same|preserve|identical|do not change).{0,50}(?:product|garment|design|artwork|print|shirt|t-?shirt)|(?:ayn(?:ı|i)|birebir|tam olarak).{0,50}(?:ürün|baskı|tasarım|tişört)/i;

export function resolveApparelFidelityMode(input: { vertical: string | null; manifest: ApparelIdentityManifest | null; userPrompt: string }): ApparelFidelityMode {
  if (input.vertical !== "apparel") return { mode: "standard", generationMode: "standard", productFidelityFirst: false, exactProductApparel: false, reason: null };
  const artwork = Boolean(input.manifest?.artworkPresent);
  const exactIntent = exactProductIntent.test(input.userPrompt);
  const enabled = artwork || exactIntent;
  return { mode: enabled ? "product_fidelity_first" : "standard", generationMode: enabled ? "exact_product_apparel" : "standard", productFidelityFirst: enabled, exactProductApparel: enabled, reason: artwork ? "visible_apparel_artwork" : exactIntent ? "explicit_exact_product" : null };
}

export function evaluateApparelProductFidelity(input: {
  validationStatus: "pass" | "pass_with_warnings" | "fail" | "validation_unavailable";
  issueCodes: string[];
  benchmarkStatus: "passed" | "failed" | "not_run";
}): { qualityGatePassed: boolean; productFidelityReady: boolean; failedCodes: string[] } {
  const failedCodes = input.issueCodes.filter((code) => ["apparel_artwork_identity_drift", "apparel_artwork_text_drift", "wrong_artwork", "missing_artwork", "wrong_logo", "product_identity_drift", "different_product", "identity_changed", "garment_type_changed", "garment_color_changed"].includes(code.toLowerCase()));
  const qualityGatePassed = input.validationStatus !== "validation_unavailable" && input.validationStatus !== "fail" && failedCodes.length === 0;
  return { qualityGatePassed, productFidelityReady: qualityGatePassed && input.benchmarkStatus === "passed", failedCodes };
}
