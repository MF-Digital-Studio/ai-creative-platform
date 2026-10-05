import type { FidelityValidationIssue, FidelityValidationResult } from "@/lib/fidelity-validation/types";
import { AUTO_REPAIR_VERSION } from "./repair-version";
import type { RepairCategory, RepairPlan } from "./types";

type RepairMapping = { category: RepairCategory; instructions: string[] };

const mappings: Record<string, RepairMapping> = {
  bag_product_substitution: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Keep the current generated image unchanged except for the bag. Restore the exact source bag silhouette, proportions, handles, straps, closure, pockets, hardware, logo/monogram, material, and color. Preserve the existing model, pose, camera, scene, environment, and lighting."] },
  bag_silhouette_drift: { category: "geometry_reinforcement", instructions: ["BAG ONLY REPAIR: Restore only the exact source bag silhouette and body proportions; preserve the existing scene, model, pose, camera, and lighting."] },
  bag_handle_count_drift: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Restore the exact source handle count, handle geometry, and attachment points; preserve the existing scene unchanged."] },
  bag_handle_geometry_drift: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Restore source handle geometry, count, and attachment points; preserve the existing scene unchanged."] },
  bag_strap_drift: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Restore the source strap count, type, placement, width, and chain presence while keeping physically natural contact; preserve the existing scene unchanged."] },
  bag_closure_drift: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Restore the exact source closure type and geometry; preserve the existing scene unchanged."] },
  bag_flap_geometry_drift: { category: "geometry_reinforcement", instructions: ["BAG ONLY REPAIR: Restore the exact source flap and opening geometry; preserve the existing scene unchanged."] },
  bag_hardware_drift: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Restore distinctive source hardware positions, shapes, and color; preserve the existing scene unchanged."] },
  bag_logo_monogram_drift: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Restore the exact source logo/monogram design, pattern, and placement; preserve the existing scene unchanged."] },
  bag_reference_product_contamination: { category: "identity_reinforcement", instructions: ["BAG ONLY REPAIR: Remove all design cues copied from the reference bag and restore the exact uploaded source bag; preserve pose, framing, model, environment, and lighting."] },
  bag_contact_implausible: { category: "body_interaction_repair", instructions: ["Correct only the bag contact: natural hand grip or shoulder/crossbody placement, realistic weight, gravity, and strap tension. Remove floating straps or finger/torso intersections while preserving bag identity and scene."] },
  hand_anatomy_error: { category: "human_anatomy_repair", instructions: ["Correct only visible hand anatomy: five fingers per hand, natural joints, plausible proportions and realistic nail placement. Preserve the product, identity and scene."] },
  finger_count_error: { category: "human_anatomy_repair", instructions: ["Restore exactly five fingers per visible hand, including the correctly placed thumb. Preserve the product and composition."] },
  finger_geometry_error: { category: "human_anatomy_repair", instructions: ["Correct finger lengths, joints and separation without changing product identity or pose intent."] },
  nail_anatomy_error: { category: "human_anatomy_repair", instructions: ["Align natural nails with each finger; retain requested polish color and the source product."] },
  plastic_skin: { category: "skin_texture_repair", instructions: ["Reduce beauty retouching; restore subtle pores, natural skin texture and tonal variation without exaggerating imperfections. Preserve facial identity, product and composition."] },
  over_retouched_skin: { category: "skin_texture_repair", instructions: ["Restore restrained editorial skin texture and realistic highlights; preserve face, product and scene."] },
  facial_realism_drift: { category: "facial_realism_repair", instructions: ["Correct only uncanny facial surfaces, eyes, expression and asymmetry while preserving facial identity, product and framing."] },
  body_proportion_error: { category: "body_anatomy_repair", instructions: ["Restore natural body proportions and joint locations without changing product identity, styling or scene."] },
  pose_implausible: { category: "body_anatomy_repair", instructions: ["Correct posture, balance and weight distribution while preserving the product and intended pose."] },
  hair_realism_drift: { category: "hair_realism_repair", instructions: ["Restore natural hairline, varied strands and lighting interaction without changing identity or product."] },
  human_product_contact_error: { category: "body_interaction_repair", instructions: ["Correct only product-to-body fit, occlusion, pressure and contact shadows; preserve the exact source product."] },
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
  product_identity_drift: { category: "identity_reinforcement", instructions: ["REPAIR PRIORITY — SOURCE PRODUCT IDENTITY DRIFT: The previous attempt changed the uploaded product. Recreate the scene using the exact source product design; do not invent or substitute a similar product."] },
  center_stone_shape_changed: { category: "identity_reinforcement", instructions: ["Restore the exact source center-stone shape, orientation, relative scale, and setting; preserve all visible side and shoulder stones."] },
  stone_count_changed: { category: "identity_reinforcement", instructions: ["Restore the exact visible source stone count and positions; do not remove, add, simplify, or duplicate stones."] },
  setting_changed: { category: "identity_reinforcement", instructions: ["Restore the exact visible source prong and setting architecture without substituting a similar ring design."] },
  jewelry_product_substitution: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Keep the current generated scene, hand, pose, framing, lighting, and background unchanged. Replace only the jewelry with the exact source product identity."] },
  jewelry_center_stone_shape_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the exact source center-stone shape and orientation; preserve the generated scene unchanged."] },
  jewelry_center_stone_count_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the exact source center-stone count; preserve the generated scene unchanged."] },
  jewelry_prong_count_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the source prong count, placement, and geometry; preserve the generated scene unchanged."] },
  jewelry_setting_geometry_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the source setting type and geometry; preserve the generated scene unchanged."] },
  jewelry_halo_structure_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the source halo presence and structure; preserve the generated scene unchanged."] },
  jewelry_side_stone_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the source side-stone presence, count, and arrangement; preserve the generated scene unchanged."] },
  jewelry_band_geometry_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the source band silhouette, profile, and thickness class; preserve the generated scene unchanged."] },
  jewelry_metal_color_drift: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Restore the source metal color while preserving natural scene lighting and reflections; leave the rest unchanged."] },
  jewelry_reference_product_contamination: { category: "identity_reinforcement", instructions: ["JEWELRY ONLY: Remove design features influenced by reference jewelry and restore the exact source jewelry; preserve current scene, hand, pose, and framing."] },
  band_geometry_changed: { category: "identity_reinforcement", instructions: ["Restore the exact source band width, profile, shoulders, symmetry, and complete ring geometry while preserving natural finger occlusion."] },
  watch_dial_structure_changed: { category: "identity_reinforcement", instructions: ["Restore the exact source dial layout, indices, crown side, date window, subdials, bezel, and bracelet/strap structure."] },
  footwear_panel_structure_changed: { category: "identity_reinforcement", instructions: ["Restore the exact source footwear panel boundaries, toe box, sole geometry, lacing, tongue, heel, and logo placement."] },
  garment_artwork_changed: { category: "identity_reinforcement", instructions: ["Restore the exact source garment artwork, placement, closures, pockets, and construction while allowing only natural folds and drape."] },
  wrong_artwork: { category: "identity_reinforcement", instructions: ["Restore the exact source artwork identity and composition. Do not substitute, redraw, omit, simplify, or reinterpret the artwork."] },
  missing_artwork: { category: "identity_reinforcement", instructions: ["Restore all visible source artwork in its original region, scale class, side, and orientation without changing the garment."] },
  wrong_logo: { category: "identity_reinforcement", instructions: ["Restore the exact source logo design and approximate source placement class. Do not invent or substitute branding."] },
  garment_type_changed: { category: "identity_reinforcement", instructions: ["Restore the exact source garment type, silhouette, color, and defining construction."] },
  garment_color_changed: { category: "color_material_repair", instructions: ["Restore the source garment color and color blocking while preserving natural lighting and fabric folds."] },
  text_unreadable: { category: "identity_reinforcement", instructions: ["Restore the exact source wording and recognizable typography. Do not add, remove, reorder, or approximate letters."] },
  wording_changed: { category: "identity_reinforcement", instructions: ["Restore the exact source wording and letter sequence without changing the product or scene."] },
  pendant_geometry_changed: { category: "geometry_reinforcement", instructions: ["Restore the exact pendant silhouette, proportions, and visible construction from the source."] },
  footwear_silhouette_changed: { category: "geometry_reinforcement", instructions: ["Restore the source footwear silhouette and sole proportions while allowing natural foot angle and flex."] },
  metal_color_changed: { category: "color_material_repair", instructions: ["Restore the source metal color while retaining realistic lighting and reflections."] },
  bezel_geometry_changed: { category: "geometry_reinforcement", instructions: ["Restore the exact source bezel geometry and watch case proportions."] },
  apparel_artwork_drift: { category: "identity_reinforcement", instructions: ["PRIORITY 1 — Restore the exact source apparel artwork composition and major graphic shapes. Do not substitute, simplify, redraw, or reinterpret the print."] },
  apparel_artwork_identity_drift: { category: "identity_reinforcement", instructions: ["PRIORITY 1 — Use the supplied apparel_artwork_identity_source as exact design authority. Restore its exact composition and structure; do not replace, redraw, simplify, restyle, or reinterpret it."] },
  apparel_artwork_text_drift: { category: "identity_reinforcement", instructions: ["PRIORITY 2 — Use apparel_artwork_identity_source to restore every letter, exact text, letter shape and text layout. Do not approximate, invent, omit, or reorder typography."] },
  apparel_artwork_structure_drift: { category: "identity_reinforcement", instructions: ["PRIORITY 2 — Restore all major illustration shapes and linework from apparel_artwork_identity_source."] },
  apparel_artwork_placement_drift: { category: "identity_reinforcement", instructions: ["PRIORITY 2 — Restore placement class and proportions from the source garment relative to collar, side edges, and hem."] },
  apparel_artwork_scale_drift: { category: "identity_reinforcement", instructions: ["PRIORITY 4 — Restore artwork width and height relative to garment torso from apparel_artwork_identity_source and source garment."] },
  apparel_artwork_color_drift: { category: "color_material_repair", instructions: ["PRIORITY 1 — Restore graphic colors and relationships exactly as shown in apparel_artwork_identity_source."] },
  apparel_text_drift: { category: "identity_reinforcement", instructions: ["PRIORITY 3 — Preserve every visible source text region, typography presence, content, and location; do not invent or remove text."] },
  apparel_color_drift: { category: "color_material_repair", instructions: ["PRIORITY 4 — Restore the source garment color and material appearance."] },
  apparel_silhouette_drift: { category: "geometry_reinforcement", instructions: ["PRIORITY 5 — Restore garment silhouette, sleeve, collar, fit, and construction; allow only natural drape and body curvature."] },
  apparel_scale_drift: { category: "identity_reinforcement", instructions: ["Restore the source artwork scale relative to the full garment; do not shrink or enlarge the print."] },
  reference_composition_missed: { category: "composition_repair", instructions: ["Restore the compatible reference framing, camera angle, and subject placement while keeping the uploaded product large and fully visible."] },
  primary_reference_composition_drift: { category: "composition_repair", instructions: ["Restore Reference 1 scene layout and visual balance while keeping the source product clearly visible."] },
  primary_reference_pose_drift: { category: "body_interaction_repair", instructions: ["Restore Reference 1 pose structure and orientation while preserving the exact source product."] },
  primary_reference_framing_drift: { category: "composition_repair", instructions: ["Restore Reference 1 framing and crop intent, adapting to the requested canvas without cropping the source product unsafely."] },
  primary_reference_camera_drift: { category: "composition_repair", instructions: ["Restore Reference 1 camera angle and perspective intent while preserving the product identity."] },
  reference_hand_direction_missed: { category: "body_interaction_repair", instructions: ["Restore the compatible reference hand-entry direction and pose structure without copying person identity or changing product identity."] },
  reference_background_missed: { category: "creative_requirement_repair", instructions: ["Restore the compatible reference background and lighting structure without copying reference branding or product identity."] },
};

function mappingsFor(issues: FidelityValidationIssue[]): RepairMapping[] {
  const selected = new Map<RepairCategory, RepairMapping>();
  const apparelPriority = ["apparel_artwork_drift", "apparel_artwork_identity_drift", "apparel_artwork_text_drift", "apparel_artwork_structure_drift", "apparel_artwork_color_drift", "apparel_artwork_placement_drift", "apparel_artwork_scale_drift", "apparel_text_drift", "apparel_color_drift", "apparel_silhouette_drift", "apparel_scale_drift"];
  const orderedIssues = [...issues].sort((left, right) => {
    const leftIndex = apparelPriority.indexOf(left.code.toLowerCase());
    const rightIndex = apparelPriority.indexOf(right.code.toLowerCase());
    return (leftIndex < 0 ? apparelPriority.length : leftIndex) - (rightIndex < 0 ? apparelPriority.length : rightIndex);
  });
  for (const issue of orderedIssues) {
    const mapping = mappings[issue.code.toLowerCase()];
    if (mapping) {
      const existing = selected.get(mapping.category);
      if (existing) existing.instructions.push(...mapping.instructions);
      else selected.set(mapping.category, { ...mapping, instructions: [...mapping.instructions] });
    }
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
