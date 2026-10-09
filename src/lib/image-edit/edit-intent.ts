export const imageEditScopes = [
  "background", "lighting", "color_tone", "crop_framing", "remove_object", "add_simple_object",
  "product_position_minor", "human_pose_minor", "environment_detail", "general_local_edit",
] as const;

export type ImageEditScope = (typeof imageEditScopes)[number];
export type ImageEditIntent = { allowedChanges: ImageEditScope[]; preservedElements: string[] };

const labels: Record<ImageEditScope, RegExp> = {
  background: /background|backdrop|arka\s*plan|fon/i,
  lighting: /light|lighting|shadow|[ıi]şı[kğ]|[ıi]şığı|isik|isigi|aydınlık|aydinlik|gölge|golge/i,
  color_tone: /color tone|colour|tone|renk tonu|renkleri|daha sıcak|daha soguk|daha soğuk/i,
  crop_framing: /crop|frame|framing|kadraj|kırp|kirp|yaklaştır|yaklastir/i,
  remove_object: /remove|delete|kaldır|kaldir|sil\b/i,
  add_simple_object: /add|ekle|ilave et/i,
  product_position_minor: /move the product|product position|ürünü.*(taşı|kaydır)|urunu.*(tasi|kaydir)/i,
  human_pose_minor: /pose|pozisyon|pozu|kolunu|elini|duruş|durus/i,
  environment_detail: /environment|surroundings|çevre|cevre|ortam/i,
  general_local_edit: /[\s\S]+/,
};

export function parseImageEditIntent(instruction: string): ImageEditIntent {
  const allowedChanges = imageEditScopes.filter((scope) => scope !== "general_local_edit" && labels[scope].test(instruction));
  return {
    allowedChanges: allowedChanges.length ? allowedChanges : ["general_local_edit"],
    preservedElements: ["product identity, geometry, color, branding and artwork", "person identity and appearance", "pose", "composition and camera", "all unrequested regions"],
  };
}

export function buildImageEditPrompt(instruction: string, intent: ImageEditIntent, humanRealismDirection = ""): string {
  return [
    "Edit the provided base image. Preserve all elements not explicitly requested to change. Do not redesign or regenerate the entire scene.",
    "BASE IMAGE PRESERVATION: preserve composition, camera angle, framing, subject identity and appearance, pose, environment unless requested, and product placement.",
    "PRODUCT IDENTITY: preserve the exact source product, geometry, color, branding, artwork, and materials. Product Identity Lock remains active. For bags, preserve bag type and silhouette, proportions, handle count/geometry, strap presence/placement, closure and flap, zipper and pockets, panel seams, hardware, logo/monogram, print, material, color, and base. Do not redesign, recolor, replace logos/artwork, or alter identity-critical details unless the instruction explicitly names a product change.",
    `ALLOWED CHANGES: ${intent.allowedChanges.join(", ")}.`,
    `PROTECTED ELEMENTS: ${intent.preservedElements.join("; ")}.`,
    humanRealismDirection,
    `USER REQUEST: ${instruction}`,
  ].filter(Boolean).join("\n\n");
}

export type EditIssueCode = "EDIT_REQUEST_NOT_APPLIED" | "EDIT_SCOPE_OVERREACH" | "EDIT_BASE_SCENE_DRIFT" | "EDIT_PRODUCT_IDENTITY_DRIFT" | "EDIT_SUBJECT_IDENTITY_DRIFT" | "EDIT_POSE_DRIFT" | "EDIT_COMPOSITION_DRIFT" | "EDIT_LIGHTING_OVERREACH" | "EDIT_BACKGROUND_OVERREACH" | "EDIT_HUMAN_REALISM_ERROR";
export type EditFidelityAssessment = { requestedChangeApplied: boolean; baseScenePreserved: boolean; productIdentityPreserved: boolean; subjectIdentityPreserved: boolean; posePreserved: boolean; compositionPreserved: boolean; unrelatedChanges: boolean; humanRealismPreserved?: boolean };

export function validateEditFidelity(assessment: EditFidelityAssessment): { status: "pass" | "pass_with_warnings" | "fail"; issueCodes: EditIssueCode[] } {
  const issueCodes: EditIssueCode[] = [];
  if (!assessment.requestedChangeApplied) issueCodes.push("EDIT_REQUEST_NOT_APPLIED");
  if (assessment.unrelatedChanges) issueCodes.push("EDIT_SCOPE_OVERREACH");
  if (!assessment.baseScenePreserved) issueCodes.push("EDIT_BASE_SCENE_DRIFT");
  if (!assessment.productIdentityPreserved) issueCodes.push("EDIT_PRODUCT_IDENTITY_DRIFT");
  if (!assessment.subjectIdentityPreserved) issueCodes.push("EDIT_SUBJECT_IDENTITY_DRIFT");
  if (!assessment.posePreserved) issueCodes.push("EDIT_POSE_DRIFT");
  if (!assessment.compositionPreserved) issueCodes.push("EDIT_COMPOSITION_DRIFT");
  if (assessment.humanRealismPreserved === false) issueCodes.push("EDIT_HUMAN_REALISM_ERROR");
  return { status: issueCodes.length ? "fail" : "pass", issueCodes };
}


