import type { FidelityValidationIssue, FidelityValidationResult } from "@/lib/fidelity-validation/types";
import { AUTO_REPAIR_VERSION } from "./repair-version";
import type { RepairCategory, RepairPlan } from "./types";

type RepairMapping = { category: RepairCategory; instructions: string[] };

const mappings: Record<string, RepairMapping> = {
  watch_case_rotation_mismatch: { category: "watch_perspective_repair", instructions: ["Correct only the case rotation so it follows the wrist plane and longitudinal wrist axis."] },
  watch_wrist_axis_mismatch: { category: "watch_perspective_repair", instructions: ["Align only the watch case axis and foreshortening to the existing wrist axis."] },
  watch_dial_orientation_mismatch: { category: "watch_perspective_repair", instructions: ["Rotate only the dial with the existing wrist pose and camera; in a raised-arm side view, shift the 12 marker toward the left or upper-left instead of keeping it at the image top."] },
  watch_flat_overlay_appearance: { category: "watch_depth_repair", instructions: ["Rebuild only the existing source watch as a volumetric worn object; remove its pasted flat-overlay appearance."] },
  watch_strap_not_wrapped: { category: "watch_wrap_repair", instructions: ["Wrap the existing strap or bracelet naturally around the wrist and preserve far-side occlusion."] },
  watch_contact_failure: { category: "watch_contact_repair", instructions: ["Seat the existing case and strap against skin with believable local contact shadow and occlusion."] },
  apparel_silhouette_mismatch: { category: "apparel_fit_repair", instructions: ["Correct only the source garment silhouette and fit category; restore exact body width, shoulder drop and volume without changing the model."] },
  apparel_fit_mismatch: { category: "apparel_fit_repair", instructions: ["Restore the source fit exactly—boxy, slim, straight, oversized, cropped, relaxed or fitted as shown—without fashionizing it."] },
  apparel_proportion_mismatch: { category: "apparel_fit_repair", instructions: ["Restore source garment proportions, body width, shoulder width, sleeve volume and relative lengths only."] },
  apparel_length_mismatch: { category: "apparel_fit_repair", instructions: ["Correct only body, crop, sleeve or trouser-leg endpoint to match the source garment."] },
  apparel_structure_mismatch: { category: "apparel_structure_repair", instructions: ["Restore only the source shoulder, sleeve cut, hem, rib, cuff, waistband, collar, seam and panel construction."] },
  apparel_pocket_placement_error: { category: "apparel_structure_repair", instructions: ["Restore source pocket count, position, size, shape and angle without changing the model or pose."] },
  apparel_closure_structure_error: { category: "apparel_structure_repair", instructions: ["Restore source zipper, puller, button or placket position and construction only."] },
  apparel_material_behavior_mismatch: { category: "apparel_material_repair", instructions: ["Restore only the source material class, surface finish, sheen, stiffness, wrinkle and texture behavior."] },
  apparel_drape_mismatch: { category: "apparel_material_repair", instructions: ["Restore source drape and fall while allowing only gravity- and pose-consistent folds."] },
  apparel_product_body_interaction_error: { category: "apparel_interaction_repair", instructions: ["Correct only garment/body contact, pressure, openings, occlusion and clipping while retaining source fit and structure."] },
  human_face_anatomy_error: { category: "face_realism_repair", instructions: ["Correct only the concrete facial anatomy defect; preserve person identity, expression intent, product, outfit, pose, camera, framing, environment, lighting, and composition."] },
  human_face_uncanny: { category: "face_realism_repair", instructions: ["Correct only the uncanny facial region into believable photographed anatomy and texture; do not beautify, symmetrize, or change identity."] },
  human_expression_unnatural: { category: "face_realism_repair", instructions: ["Correct only the validated unnatural expression while preserving identity and pose."] },
  human_eye_realism_error: { category: "face_realism_repair", instructions: ["Correct only the malformed or artificial eye region while preserving person identity and all unaffected features."] },
  human_skin_plastic: { category: "skin_realism_repair", instructions: ["Restore natural photographic microtexture, tonal variation and highlights only in the affected skin region; preserve identity and do not add exaggerated blemishes."] },
  human_skin_overretouched: { category: "skin_realism_repair", instructions: ["Remove only excessive beauty smoothing in the affected region and restore restrained commercial skin texture."] },
  human_texture_unrealistic: { category: "skin_realism_repair", instructions: ["Restore believable photographic human texture only in the affected region."] },
  human_hair_synthetic: { category: "hair_realism_repair", instructions: ["Correct only synthetic hairline, roots, strand breakup, density, gravity or clumping; preserve hairstyle and identity."] },
  human_hand_anatomy_error: { category: "hand_anatomy_repair", instructions: ["Correct only the validated visible hand anatomy, joints, thumb, fingers, nails, grip or clipping. Respect natural occlusion and preserve product contact intent."] },
  human_limb_anatomy_error: { category: "limb_anatomy_repair", instructions: ["Correct only the affected limb continuity or major joint with the smallest local pose adjustment necessary."] },
  human_posture_unnatural: { category: "limb_anatomy_repair", instructions: ["Correct only the validated posture, balance or weight-distribution defect; retain pose intent."] },
  preset_scene_mismatch: { category: "composition_repair", instructions: ["PRESET SCENE CORRECTION ONLY: Recreate the current candidate within the selected preset family and allowed scene types. Correct the environment and scene identity only; preserve the exact source product, product scale, identity details, and any reference-authorized elements. Do not perform product identity repair."] },
  preset_interaction_mismatch: { category: "composition_repair", instructions: ["PRESET INTERACTION CORRECTION ONLY: Correct only the visible human/product interaction to match the selected preset family. Preserve the exact source product and all identity details; do not invoke product identity repair."] },
  preset_presentation_mode_mismatch: { category: "presentation_repair", instructions: ["PRESENTATION MODE CORRECTION ONLY: Rebuild only the camera, framing, support, gravity, orientation, interaction, or environment dimensions required by the selected mode contract. Preserve exact product identity and every already-compliant layer."] },
  preset_macro_framing_mismatch: { category: "composition_repair", instructions: ["Tighten camera distance and framing to a true macro or close detail. Make the contract target detail visually dominant while preserving product identity and scene style."] },
  preset_top_down_camera_mismatch: { category: "composition_repair", instructions: ["Correct only the camera to overhead or near-overhead and preserve product identity, support, lighting, and styling."] },
  preset_front_orientation_mismatch: { category: "composition_repair", instructions: ["Correct only product orientation and camera to a front or near-front hero view. Preserve product identity, scene, and lighting."] },
  preset_pair_composition_mismatch: { category: "presentation_repair", instructions: ["Restore the required coherent pair composition using the same source-product semantics. Do not invent a different SKU or blend product views."] },
  preset_pedestal_support_mismatch: { category: "presentation_repair", instructions: ["Place the unchanged product on one clearly visible, physically plausible plinth or pedestal. Preserve camera, scene style, and product identity."] },
  preset_floating_support_mismatch: { category: "presentation_repair", instructions: ["Remove table, floor, pedestal, or other resting contact and create a believable unsupported or suspended presentation with coherent gravity and shadow logic."] },
  ghost_mannequin_phantom_body_artifact: { category: "presentation_repair", instructions: ["Remove all visible or implied skin, limbs, torso artifacts, mannequin hardware, and phantom anatomy while retaining believable invisible garment volume."] },
  preset_reflection_mismatch: { category: "presentation_repair", instructions: ["Introduce one controlled, physically plausible reflection beneath or beside the unchanged product without obscuring identity details."] },
  preset_clinical_scene_mismatch: { category: "environment_repair", instructions: ["Correct only the scene styling to a clean clinical beauty environment with precise controlled light and minimal clinical props."] },
  preset_botanical_scene_mismatch: { category: "environment_repair", instructions: ["Introduce restrained but materially recognizable botanical context while preserving the product, framing, camera, and all identity details."] },
  preset_liquid_interaction_mismatch: { category: "presentation_repair", instructions: ["Add the required controlled, physically plausible liquid interaction without wetting, obscuring, duplicating, or deforming the source package."] },
  bag_carry_mode_mismatch: { category: "interaction_repair", instructions: ["Correct only the bag carry path to the selected hand, shoulder, or crossbody contract using existing source handles and straps. Preserve person, product identity, camera, and scene."] },
  jewelry_body_target_mismatch: { category: "interaction_repair", instructions: ["Move only the unchanged jewelry to its selected anatomically correct body target with realistic attachment, contact, scale, and occlusion."] },
  bag_preset_scene_mismatch: { category: "composition_repair", instructions: ["BAG STUDIO COMPLIANCE: Recreate this as a product-only studio still life. Remove the model, hands, carry pose, body contact, fashion portrait, and lifestyle setting; retain the exact source bag identity." ] },
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
  hand_anatomy_error: { category: "hand_anatomy_repair", instructions: ["Correct only visible hand anatomy: five fingers per fully visible hand, natural joints, plausible proportions and realistic nail placement. Respect occlusion and preserve the product, identity and scene."] },
  human_anatomy_error: { category: "human_anatomy_repair", instructions: ["Repair only the affected anatomical region and limb continuity. Preserve the person identity, product, pose intent, camera, environment, lighting, and composition."] },
  visible_finger_count_error: { category: "hand_anatomy_repair", instructions: ["Restore exactly five fingers on the affected fully visible hand, including the correctly placed thumb. Change no other region."] },
  finger_count_error: { category: "human_anatomy_repair", instructions: ["Restore exactly five fingers per visible hand, including the correctly placed thumb. Preserve the product and composition."] },
  finger_geometry_error: { category: "human_anatomy_repair", instructions: ["Correct finger lengths, joints and separation without changing product identity or pose intent."] },
  foot_anatomy_error: { category: "foot_anatomy_repair", instructions: ["Correct only the visible foot anatomy. Preserve the exact shoe identity, straps, heel shape, outfit, pose, lighting, background, and scene type."] },
  visible_toe_count_error: { category: "foot_anatomy_repair", instructions: ["Restore five anatomically correct toes only where the complete foot is clearly visible, with natural spacing. Do not change the footwear or composition."] },
  footwear_fit_mismatch: { category: "body_interaction_repair", instructions: ["Correct only toe and foot alignment with the sandal straps, sole, and footbed. Preserve shoe geometry and every other scene element."] },
  nail_anatomy_error: { category: "human_anatomy_repair", instructions: ["Align natural nails with each finger; retain requested polish color and the source product."] },
  plastic_skin: { category: "skin_texture_repair", instructions: ["Reduce beauty retouching; restore subtle pores, natural skin texture and tonal variation without exaggerating imperfections. Preserve facial identity, product and composition."] },
  plastic_skin_appearance: { category: "skin_texture_repair", instructions: ["Restore natural photographic skin texture only in the affected skin region, with subtle pores and tonal variation. Preserve the person's identity, product, pose, camera, environment, lighting, and composition."] },
  unrealistic_human_texture: { category: "skin_texture_repair", instructions: ["Restore believable photographic skin and hair texture only where synthetic; preserve identity and every unaffected region."] },
  over_retouched_skin: { category: "skin_texture_repair", instructions: ["Restore restrained editorial skin texture and realistic highlights; preserve face, product and scene."] },
  facial_realism_drift: { category: "facial_realism_repair", instructions: ["Correct only uncanny facial surfaces, eyes, expression and asymmetry while preserving facial identity, product and framing."] },
  face_realism_error: { category: "facial_realism_repair", instructions: ["Correct only the affected facial realism defect while preserving face identity, expression, product, pose, camera, environment, lighting, and composition."] },
  body_proportion_error: { category: "limb_anatomy_repair", instructions: ["Restore natural body proportions and joint locations without changing product identity, styling or scene."] },
  pose_implausible: { category: "body_anatomy_repair", instructions: ["Correct posture, balance and weight distribution while preserving the product and intended pose."] },
  hair_realism_drift: { category: "hair_realism_repair", instructions: ["Restore natural hairline, varied strands and lighting interaction without changing identity or product."] },
  human_product_contact_error: { category: "body_interaction_repair", instructions: ["Correct only product-to-body fit, occlusion, pressure and contact shadows; preserve the exact source product."] },
  body_product_interaction_error: { category: "body_interaction_repair", instructions: ["Correct only the affected product-to-body contact, pressure, occlusion or strap path. Preserve the exact product and the complete creative direction."] },
  floating_ring: { category: "body_interaction_repair", instructions: ["Make the ring wrap naturally around the correct finger with realistic skin contact and occlusion.", "Do not float, paste, overlay, or fuse the ring to the hand."] },
  body_interaction_failure: { category: "body_interaction_repair", instructions: ["Restore physically plausible contact, scale, attachment, and occlusion for the resolved body target."] },
  watch_flat_product_appearance: { category: "watch_depth_repair", instructions: ["Render the same source watch as a physically integrated, volumetric worn object; preserve dial identity, bezel, crown/pushers, bracelet or strap, material, color, branding, scene, pose, framing, and lighting."] },
  watch_front_face_only_render: { category: "watch_depth_repair", instructions: ["Restore visible case thickness, bezel depth, sidewalls, lugs, crown depth, and bracelet or strap attachment depth; do not alter watch identity or the scene."] },
  watch_case_depth_missing: { category: "watch_depth_repair", instructions: ["Correct only watch case, bezel, side-profile, lug, and crown three-dimensional depth."] },
  watch_side_geometry_missing: { category: "watch_depth_repair", instructions: ["Restore the watch sidewalls, lugs, crown or pushers, and attachment geometry as physically believable three-dimensional forms."] },
  watch_bracelet_wrap_error: { category: "watch_wrap_repair", instructions: ["Make the existing bracelet or strap curve and wrap naturally around the wrist with correct tension and attachment; preserve its exact design."] },
  watch_case_floating: { category: "watch_contact_repair", instructions: ["Seat the existing watch case flush to the wrist with believable local skin contact and shadow; do not change the wrist pose or watch identity."] },
  watch_contact_shadow_missing: { category: "watch_contact_repair", instructions: ["Restore only the local contact shadow and seating realism where the watch case and strap meet the wrist."] },
  watch_perspective_mismatch: { category: "watch_perspective_repair", instructions: ["Align the existing watch perspective and scale to the wrist angle and camera without changing dial, bezel, crown/pushers, bracelet or strap, scene, pose, framing, or lighting."] },
  watch_reflection_integration_error: { category: "watch_contact_repair", instructions: ["Match existing watch metal, glass, bezel, bracelet, and dial reflections to the scene lighting while preserving material, color, and all identity details."] },
  watch_scale_to_wrist_error: { category: "watch_perspective_repair", instructions: ["Correct only the watch-to-wrist scale so it is anatomically plausible while preserving every other scene element."] },
  jewelry_flat_product_appearance: { category: "jewelry_depth_repair", instructions: ["Render the same source jewelry as a physically integrated three-dimensional worn object; preserve jewelry identity, stone arrangement, metal color, setting style, proportions, body pose, framing, scene, and lighting."] },
  jewelry_front_face_only_render: { category: "jewelry_depth_repair", instructions: ["Restore believable jewelry thickness, side profile, and volumetric setting depth without changing identity or composition."] },
  jewelry_depth_missing: { category: "jewelry_depth_repair", instructions: ["Correct only material thickness, setting depth, and three-dimensional jewelry form."] },
  jewelry_side_profile_missing: { category: "jewelry_depth_repair", instructions: ["Restore the jewelry's visible side geometry and dimensional profile while preserving source proportions."] },
  jewelry_body_attachment_error: { category: "jewelry_attachment_repair", instructions: ["Make the existing jewelry attach and sit naturally on the resolved body target with physically plausible contact and occlusion."] },
  jewelry_contact_shadow_missing: { category: "jewelry_contact_repair", instructions: ["Restore only the realistic local contact shadow where jewelry meets the body."] },
  earring_ear_attachment_error: { category: "earring_attachment_repair", instructions: ["Attach the existing earring naturally to the ear or lobe, following ear angle and camera perspective; preserve setting, stones, metal, and scene."] },
  earring_setting_depth_missing: { category: "jewelry_depth_repair", instructions: ["Restore dimensional gemstone cuts and physically believable prongs, bezel, mount, post, clip, or hoop structure without redesigning the earring."] },
  earring_floating: { category: "earring_attachment_repair", instructions: ["Eliminate the floating earring appearance with natural ear attachment, local seating, and contact shadow only."] },
  jewelry_perspective_mismatch: { category: "jewelry_perspective_repair", instructions: ["Align the existing jewelry orientation and scale with anatomy and camera perspective without changing body pose, framing, scene, or lighting."] },
  jewelry_reflection_integration_error: { category: "jewelry_contact_repair", instructions: ["Match jewelry highlights and reflections to the body and environment lighting while preserving metal color and stone identity."] },
  jewelry_scale_to_body_error: { category: "jewelry_perspective_repair", instructions: ["Correct only jewelry scale relative to the anatomy while preserving product proportions and the full composition."] },
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
  const humanIssues = validation.issues.filter((issue) => issue.category === "human_realism");
  const hasBlockingNonHumanIssue = validation.issues.some((issue) => issue.category !== "human_realism" && issue.severity === "critical" && (issue.confidence ?? 0.9) >= 0.75);
  const hasUnrecoverableIdentityIssue = validation.issues.some((issue) =>
    issue.category === "product_identity" && issue.code.toLowerCase().startsWith("apparel_artwork_") &&
    ((issue.confidence ?? 0.9) < 0.9 || issue.repairable !== true),
  );
  const eligibleHumanCodes = new Set(humanIssues.filter((issue) => (issue.confidence ?? 0.9) >= 0.75 && issue.repairable !== false).map((issue) => issue.code.toLowerCase()));
  const repairCandidates = validation.issues.filter((issue) => {
    if (issue.code.toLowerCase().startsWith("apparel_artwork_") && ((issue.confidence ?? 0.9) < 0.9 || issue.repairable !== true)) return false;
    return issue.category !== "human_realism" || (!hasBlockingNonHumanIssue && !hasUnrecoverableIdentityIssue && eligibleHumanCodes.has(issue.code.toLowerCase()));
  });
  const mapped = mappingsFor(repairCandidates);
  const shouldRetry = validation.status === "fail" && validation.retryRecommended && mapped.length > 0 && !hasUnrecoverableIdentityIssue;
  return {
    shouldRetry,
    categories: shouldRetry ? mapped.map(({ category }) => category) : [],
    issueCodes: validation.issues.map(({ code }) => code),
    repairableIssueCodes: repairCandidates.filter((issue) => mappings[issue.code.toLowerCase()]).map(({ code }) => code),
    repairInstructions: shouldRetry ? mapped.flatMap(({ instructions }) => instructions) : [],
    preserveExistingLayers: true,
    version: AUTO_REPAIR_VERSION,
  };
}
