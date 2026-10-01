import type { CompositionProfile } from "@/lib/composition-intelligence/types";
import type { CreativeComplianceResolution } from "@/lib/creative-direction-compliance/types";
import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import type { SceneSuitabilityResolution } from "@/lib/scene-suitability/types";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export const fidelityValidationCategories = [
  "product_identity", "geometry", "color_material", "branding_text", "body_interaction",
  "composition_visibility", "creative_requirement", "realism", "duplication", "structural_integrity",
] as const;
export type FidelityValidationCategory = (typeof fidelityValidationCategories)[number];
export type FidelityIssueSeverity = "critical" | "major" | "minor";
export type FidelityValidationStatus = "pass" | "pass_with_warnings" | "fail" | "validation_unavailable";

export type FidelityValidationIssue = {
  code: string;
  category: FidelityValidationCategory;
  severity: FidelityIssueSeverity;
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
  summary: string;
  version: string;
};

export type FidelityValidationBrief = {
  vertical: SupportedVertical | "product";
  strategy: GenerationStrategy;
  sourceAuthority: string;
  productProfile: ProductProfile | null;
  sceneSuitability: SceneSuitabilityResolution | null;
  composition: CompositionProfile | null;
  appliedRequirements: CreativeComplianceResolution["applied"];
  allowedTransformations: string[];
  verticalChecks: string[];
};

export type FidelityValidationInput = {
  originalProduct: Buffer;
  generatedImage: Buffer;
  originalMimeType: string;
  generatedMimeType: string;
  productProfile: ProductProfile | null;
  vertical: SupportedVertical | "product";
  strategy: GenerationStrategy;
  sceneSuitability: SceneSuitabilityResolution | null;
  composition: CompositionProfile | null;
  creativeCompliance: CreativeComplianceResolution | null;
  referenceStyleContext?: string | null;
};

export type FidelityValidationClient = {
  validate(input: FidelityValidationInput, brief: FidelityValidationBrief): Promise<unknown>;
};
