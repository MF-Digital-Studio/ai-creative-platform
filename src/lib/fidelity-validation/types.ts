import type { CompositionProfile } from "@/lib/composition-intelligence/types";
import type { CreativeComplianceResolution } from "@/lib/creative-direction-compliance/types";
import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import type { SceneSuitabilityResolution } from "@/lib/scene-suitability/types";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";
import type { ReferenceMatchResolution } from "@/lib/generation/references/resolve-reference-match";
import type { ProductIdentityManifest } from "@/lib/product-identity/types";
import type { HumanRealismPolicy } from "@/lib/human-realism/types";

export const fidelityValidationCategories = [
  "product_identity", "geometry", "color_material", "branding_text", "body_interaction",
  "composition_visibility", "creative_requirement", "realism", "human_realism", "duplication", "structural_integrity", "reference_match",
] as const;
export type FidelityValidationCategory = (typeof fidelityValidationCategories)[number];
export type FidelityIssueSeverity = "critical" | "major" | "minor";
export type FidelityValidationStatus = "pass" | "pass_with_warnings" | "fail" | "validation_unavailable";
export type FidelityIdentityImpact = "none" | "minor" | "major" | "critical";
export type FidelityLikelyCause = "source_identity_drift" | "perspective" | "fabric_deformation" | "lighting" | "body_interaction" | "typography_change" | "geometry_change" | "unknown";

export type FidelityValidationIssue = {
  code: string;
  issueCode?: string;
  category: FidelityValidationCategory;
  severity: FidelityIssueSeverity;
  confidence?: number;
  identityImpact?: FidelityIdentityImpact;
  likelyCause?: FidelityLikelyCause;
  finding: string;
  expected: string;
  sourceAuthoritative: boolean;
};

export type FidelityValidationCheck = {
  category: FidelityValidationCategory;
  passed: boolean;
  finding: string;
  issueCodes: string[];
};

export type FidelityValidationResult = {
  status: FidelityValidationStatus;
  checks: FidelityValidationCheck[];
  issues: FidelityValidationIssue[];
  severity: FidelityIssueSeverity | null;
  retryRecommended: boolean;
  commerciallyUsable: boolean;
  summary: string;
  version: string;
};

export type FidelityValidationBrief = {
  vertical: SupportedVertical | "product";
  strategy: GenerationStrategy;
  humanRealism?: HumanRealismPolicy;
  sourceAuthority: string;
  referencePreservation: boolean;
  productProfile: ProductProfile | null;
  sceneSuitability: SceneSuitabilityResolution | null;
  composition: CompositionProfile | null;
  appliedRequirements: CreativeComplianceResolution["applied"];
  allowedTransformations: string[];
  verticalChecks: string[];
  referenceMatch?: ReferenceMatchResolution | null;
  identityManifest?: ProductIdentityManifest | null;
  apparelArtworkIdentity?: { available: boolean; containsText: boolean; side: "front" | "back" | "unknown"; confidence: number } | null;
  preset?: { familyId: string; variantId: string | null } | null;
};

export type FidelityValidationInput = {
  originalProduct: Buffer;
  generatedImage: Buffer;
  originalMimeType: string;
  referenceBaseScene?: Buffer;
  referenceBaseSceneMimeType?: string;
  generatedMimeType: string;
  productProfile: ProductProfile | null;
  vertical: SupportedVertical | "product";
  strategy: GenerationStrategy;
  humanRealism?: HumanRealismPolicy;
  sceneSuitability: SceneSuitabilityResolution | null;
  composition: CompositionProfile | null;
  creativeCompliance: CreativeComplianceResolution | null;
  referenceStyleContext?: string | null;
  referenceMatch?: ReferenceMatchResolution | null;
  identityManifest?: ProductIdentityManifest | null;
  apparelArtworkIdentity?: { data: Buffer; mimeType: string; containsText: boolean; side: "front" | "back" | "unknown"; confidence: number } | null;
  exactProductApparel?: boolean;
  preset?: { familyId: string; variantId: string | null } | null;
};

export type FidelityValidationClient = {
  validate(input: FidelityValidationInput, brief: FidelityValidationBrief): Promise<unknown>;
};
