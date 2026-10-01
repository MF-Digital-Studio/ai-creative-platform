import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { CompositionProfile } from "@/lib/composition-intelligence/types";

import { CREATIVE_DIRECTION_COMPLIANCE_VERSION } from "./compliance-version";

export type CreativeRequirementCategory =
  | "subject_appearance" | "color" | "environment" | "lighting" | "camera"
  | "styling" | "pose" | "interaction" | "surface" | "mood"
  | "material_treatment" | "composition" | "prohibited_change";

export type CreativeRequirementImportance = "required" | "preferred" | "decorative";
export type CreativeRequirementStatus =
  | "applied" | "rejected_identity_conflict" | "rejected_physical_conflict"
  | "adjusted_for_composition" | "decorative";
export type CreativeRequirementSource = "explicit_user";

export type CreativeRequirement = {
  category: CreativeRequirementCategory;
  value: string;
  importance: CreativeRequirementImportance;
  status: CreativeRequirementStatus;
  source: CreativeRequirementSource;
};

export type CreativeComplianceResolution = {
  version: typeof CREATIVE_DIRECTION_COMPLIANCE_VERSION;
  requirements: CreativeRequirement[];
  applied: CreativeRequirement[];
  rejected: CreativeRequirement[];
  adjustedForComposition: CreativeRequirement[];
};

export type ResolveComplianceInput = {
  userPrompt: string;
  productProfile?: ProductProfile | null;
  composition?: CompositionProfile | null;
};

export type CreativeComplianceContext = Pick<ResolveComplianceInput, "productProfile" | "composition">;
