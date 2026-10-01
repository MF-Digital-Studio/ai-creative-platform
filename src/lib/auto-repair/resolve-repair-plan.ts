import type { FidelityValidationIssue, FidelityValidationResult } from "@/lib/fidelity-validation/types";
import { AUTO_REPAIR_VERSION } from "./repair-version";
import type { RepairCategory, RepairPlan } from "./types";

type RepairMapping = { category: RepairCategory; instructions: string[] };

const mappings: Record<string, RepairMapping> = {
  floating_ring: { category: "body_interaction_repair", instructions: ["Make the ring wrap naturally around the correct finger with realistic skin contact and occlusion.", "Do not float, paste, overlay, or fuse the ring to the hand."] },
  body_interaction_failure: { category: "body_interaction_repair", instructions: ["Restore physically plausible contact, scale, attachment, and occlusion for the resolved body target."] },
  stone_layout_changed: { category: "identity_reinforcement", instructions: ["Preserve the exact source stone count, layout, center-stone shape, setting, and band geometry."] },
  identity_changed: { category: "identity_reinforcement", instructions: ["Preserve the exact source product identity, silhouette, proportions, and identity-critical regions; do not redesign it."] },
  different_product: { category: "identity_reinforcement", instructions: ["Use the supplied source product as the exact identity authority; do not replace or reinterpret it."] },
  changed_dial_layout: { category: "identity_reinforcement", instructions: ["Preserve the exact source dial layout, bezel, crown, pushers, indices, date window, and subdial structure."] },
  warped_sole: { category: "geometry_reinforcement", instructions: ["Preserve the source outsole and midsole silhouette, shoe geometry, panel structure, and realistic proportions without deformation."] },
  geometry_drift: { category: "geometry_reinforcement", instructions: ["Restore the source product geometry and proportions without introducing a redesign or extra structural details."] },
  package_geometry_changed: { category: "geometry_reinforcement", instructions: ["Preserve the exact source bottle or container geometry, cap/pump/dropper, and packaging structure."] },
  product_too_small: { category: "composition_repair", instructions: ["Use a tighter crop and larger hero product scale; reduce environmental dominance while keeping the required scene."] },
  critical_region_hidden: { category: "composition_repair", instructions: ["Keep identity-critical product regions clearly visible and inspectable; do not let props or the environment obscure them."] },
  product_not_primary: { category: "composition_repair", instructions: ["Restore product-first hero prominence and reduce distracting props without changing the scene family."] },
  required_creative_missing: { category: "creative_requirement_repair", instructions: ["Ensure the applied required creative detail is clearly visible exactly as requested, without modifying the product identity."] },
  black_nails_missing: { category: "creative_requirement_repair", instructions: ["Ensure clearly visible black nail polish exactly as requested; preserve the ring and all product identity details."] },
  color_material_drift: { category: "color_material_repair", instructions: ["Restore the source dominant colors and material appearance; do not recolor or redesign the product."] },
  branding_corrupted: { category: "branding_structure_repair", instructions: ["Preserve visible logo, artwork, label, and branding region placement without inventing or moving branding."] },
  structural_drift: { category: "branding_structure_repair", instructions: ["Restore the source structural and branding details without adding, removing, or relocating product elements."] },
};

function mappingsFor(issues: FidelityValidationIssue[]): RepairMapping[] {
  const selected = new Map<RepairCategory, RepairMapping>();
  for (const issue of issues) {
    const mapping = mappings[issue.code];
    if (mapping && !selected.has(mapping.category)) selected.set(mapping.category, mapping);
  }
  return [...selected.values()];
}

export function resolveRepairPlan(validation: FidelityValidationResult): RepairPlan {
  const mapped = mappingsFor(validation.issues);
  const shouldRetry = validation.status === "fail" && validation.retryRecommended && mapped.length > 0;
  return {
    shouldRetry,
    categories: shouldRetry ? mapped.map(({ category }) => category) : [],
    issueCodes: shouldRetry ? validation.issues.map(({ code }) => code) : [],
    repairInstructions: shouldRetry ? mapped.flatMap(({ instructions }) => instructions) : [],
    preserveExistingLayers: true,
    version: AUTO_REPAIR_VERSION,
  };
}
