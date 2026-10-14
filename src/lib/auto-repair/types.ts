import type { FidelityValidationResult } from "@/lib/fidelity-validation/types";
import type { ProductPreservationMode } from "@/lib/generation/types";

export const repairCategories = [
  "identity_reinforcement",
  "geometry_reinforcement",
  "body_interaction_repair",
  "composition_repair",
  "creative_requirement_repair",
  "color_material_repair",
  "branding_structure_repair",
  "human_anatomy_repair", "skin_texture_repair", "facial_realism_repair", "body_anatomy_repair", "hair_realism_repair",
  "face_realism_repair", "skin_realism_repair", "hand_anatomy_repair", "foot_anatomy_repair", "limb_anatomy_repair", "hair_realism_repair", "body_interaction_repair",
  "apparel_fit_repair", "apparel_structure_repair", "apparel_material_repair", "apparel_interaction_repair",
  "presentation_repair", "environment_repair", "interaction_repair",
  "watch_depth_repair", "watch_wrap_repair", "watch_contact_repair", "watch_perspective_repair",
  "jewelry_depth_repair", "jewelry_attachment_repair", "earring_attachment_repair", "jewelry_contact_repair", "jewelry_perspective_repair",
] as const;
export type RepairCategory = (typeof repairCategories)[number];

export type RepairPlan = {
  shouldRetry: boolean;
  categories: RepairCategory[];
  issueCodes: string[];
  repairableIssueCodes: string[];
  repairInstructions: string[];
  preserveExistingLayers: true;
  version: "auto-repair-v1";
};

export type GenerationAttempt = {
  attempt: 0 | 1;
  imageData: Buffer;
  mimeType: string;
  validation: FidelityValidationResult;
  providerRequestId: string | null;
  preservationMode: ProductPreservationMode;
};

export type RepairMetadata = {
  version: "auto-repair-v1";
  attempted: boolean;
  selectedAttempt: 0 | 1;
  repairCategories: RepairCategory[];
  originalValidationStatus: FidelityValidationResult["status"];
  repairValidationStatus: FidelityValidationResult["status"] | null;
};
