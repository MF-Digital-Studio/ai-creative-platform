import type { RepairPlan } from "./types";

export function compileRepairInstructions(originalPrompt: string, plan: RepairPlan): string {
  if (!plan.shouldRetry) return originalPrompt;
  return [
    originalPrompt,
    "",
    "REPAIR PRIORITY — FIX THESE VALIDATED ISSUES",
    ...(plan.issueCodes.some((code) => code.toLowerCase().startsWith("bag_")) ? ["Keep the current image unchanged except for the bag or validated bag contact. Restore source bag identity and preserve model, pose, camera, environment, framing, and lighting. This is the only allowed targeted bag repair."] : []),
    ...(plan.issueCodes.some((code) => code.toLowerCase().startsWith("apparel_artwork_")) ? ["The separate apparel_artwork_identity_source remains available as exact print authority during this repair. Do not improve scene aesthetics at the expense of artwork correctness."] : []),
    ...(plan.issueCodes.some((code) => ["foot_anatomy_error", "visible_toe_count_error", "footwear_fit_mismatch"].includes(code.toLowerCase())) ? ["COMPOSITION-SAFE FOOTWEAR ANATOMY REPAIR: Keep shoe identity, straps, heel shape, outfit, pose, lighting, background, framing, and scene type unchanged. Repair only visible foot anatomy, toe count, toe spacing, and toe alignment with the sandal."] : []),
    ...(plan.issueCodes.some((code) => ["human_anatomy_error", "hand_anatomy_error", "visible_finger_count_error", "finger_count_error", "foot_anatomy_error", "visible_toe_count_error", "body_proportion_error", "face_realism_error", "plastic_skin_appearance", "unrealistic_human_texture", "body_product_interaction_error"].includes(code.toLowerCase())) ? ["TARGETED HUMAN-REALISM REPAIR: Edit only the affected anatomical, contact, face, or texture region. Preserve source product identity, Reference 1 person identity when applicable, pose, camera, environment, lighting, framing, and composition. Do not regenerate the creative direction."] : []),
    ...plan.repairInstructions.map((instruction) => `- ${instruction}`),
    "Preserve all existing ProductProfile, scene suitability, composition, creative compliance, and preservation-mode rules. Change only the failed dimensions.",
  ].join("\n");
}
