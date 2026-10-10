import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type PresentationHumanPresence = "none" | "partial" | "full";
export type PresentationModeContract = {
  id: string;
  familyId: string;
  vertical: SupportedVertical;
  variantIds: readonly string[];
  sceneTypes: readonly string[];
  environmentGrammar: string;
  cameraDistance: string;
  cameraAngle: string;
  framing: string;
  subjectScale: "extreme_close" | "large" | "medium";
  subjectPlacement: string;
  productOrientation: string;
  physicalSupport: string;
  gravityBehavior: string;
  humanPresence: PresentationHumanPresence;
  interactionMode: string;
  surface: string;
  propLanguage: string;
  lighting: string;
  captureProfile: string;
  productCount: "single" | "pair" | "source_defined";
  targetDetail: string | null;
  required: readonly string[];
  forbidden: readonly string[];
  referenceProtectedFields: readonly PresentationContractField[];
};

export type PresentationContractField =
  | "scene" | "sceneType" | "environment" | "cameraDistance" | "cameraAngle" | "framing" | "subjectScale"
  | "subjectPlacement" | "productOrientation" | "physicalSupport" | "gravityBehavior"
  | "humanPresence" | "interactionMode" | "surface" | "propLanguage" | "lighting"
  | "captureProfile" | "productCount" | "targetDetail";

type ModeSeed = Omit<PresentationModeContract, "id" | "familyId" | "vertical" | "variantIds">;
type FamilySeed = { vertical: SupportedVertical; sceneTypes: readonly string[]; modes: Record<string, { variants: readonly string[]; contract: ModeSeed }> };

const human = (overrides: Partial<ModeSeed> = {}): ModeSeed => ({
  sceneTypes: ["human_interaction", "editorial_lifestyle"], environmentGrammar: "A product-led editorial environment appropriate to the selected family.",
  cameraDistance: "medium", cameraAngle: "eye_level", framing: "medium", subjectScale: "large", subjectPlacement: "centered",
  productOrientation: "natural", physicalSupport: "anatomically_plausible_body_contact", gravityBehavior: "natural_body_load_and_contact",
  humanPresence: "full", interactionMode: "natural_product_body_interaction", surface: "body_contact", propLanguage: "restrained_context",
  lighting: "natural_directional", captureProfile: "natural_lifestyle", productCount: "source_defined", targetDetail: null,
  required: ["A visible person or body region meaningfully interacts with the product."], forbidden: ["Product-only still life."],
  referenceProtectedFields: ["humanPresence", "interactionMode", "physicalSupport", "gravityBehavior"], ...overrides,
});

const product = (overrides: Partial<ModeSeed> = {}): ModeSeed => ({
  sceneTypes: ["controlled_product_studio"], environmentGrammar: "A human-free controlled product environment.",
  cameraDistance: "close", cameraAngle: "three_quarter", framing: "full_product", subjectScale: "large", subjectPlacement: "centered",
  productOrientation: "three_quarter", physicalSupport: "surface", gravityBehavior: "grounded_with_realistic_weight",
  humanPresence: "none", interactionMode: "product_only", surface: "matte_surface", propLanguage: "none",
  lighting: "controlled_commercial", captureProfile: "clean_commercial", productCount: "single", targetDetail: null,
  required: ["The product is the clear commercial hero."], forbidden: ["People, hands, wearing, or carrying."],
  referenceProtectedFields: ["humanPresence", "interactionMode", "productCount"], ...overrides,
});

const macro = (overrides: Partial<ModeSeed> = {}): ModeSeed => product({
  cameraDistance: "macro", cameraAngle: "product_level", framing: "macro", subjectScale: "extreme_close", subjectPlacement: "detail_fills_frame",
  targetDetail: "material_or_construction_detail", required: ["A product detail fills a significant part of the frame."],
  forbidden: ["Environmental wide, full-body, or distant hero framing."], referenceProtectedFields: ["cameraDistance", "framing", "targetDetail", "humanPresence"], ...overrides,
});

const floating = (overrides: Partial<ModeSeed> = {}): ModeSeed => product({
  physicalSupport: "unsupported_suspension", gravityBehavior: "believable_suspended_gravity", surface: "none",
  required: ["The product is visibly unsupported or suspended with no resting contact."], forbidden: ["Table, pedestal, floor, or visible support contact."],
  referenceProtectedFields: ["physicalSupport", "gravityBehavior", "humanPresence", "interactionMode"], ...overrides,
});

const topDown = (overrides: Partial<ModeSeed> = {}): ModeSeed => product({
  cameraAngle: "overhead", framing: "full_product", productOrientation: "top_down", physicalSupport: "flat_surface", surface: "studio_surface",
  required: ["Camera is overhead or near-overhead."], forbidden: ["Eye-level, low-angle, or ground-level camera."],
  referenceProtectedFields: ["cameraAngle", "framing", "productOrientation", "physicalSupport"], ...overrides,
});

const pedestal = (overrides: Partial<ModeSeed> = {}): ModeSeed => product({
  physicalSupport: "visible_pedestal", surface: "pedestal", propLanguage: "single_plinth",
  required: ["A visible block, plinth, or pedestal physically supports the product."], forbidden: ["Unsupported floating."],
  referenceProtectedFields: ["physicalSupport", "surface", "gravityBehavior"], ...overrides,
});

const reflection = (overrides: Partial<ModeSeed> = {}): ModeSeed => product({
  physicalSupport: "reflective_surface", surface: "controlled_reflective_plane", propLanguage: "reflection_only",
  required: ["A visible controlled reflection supports the product."], forbidden: ["No reflection or reflections that obscure product identity."],
  referenceProtectedFields: ["surface", "physicalSupport"], ...overrides,
});

const mode = (variants: readonly string[], contract: ModeSeed) => ({ variants, contract });
const ids = (family: string, ...names: string[]) => names.map((name) => `${family}-${name}`);

const families = {
  "apparel-street": { vertical: "apparel", sceneTypes: ["urban_street", "human_interaction"], modes: {
    walking: mode(ids("apparel-street", "modern-boulevard", "glass-facade"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Recognizable city street or boulevard.", framing:"full_body", interactionMode:"garment_worn_walking", forbidden:["Studio or location without recognizable urban context."] })),
    curb: mode(ids("apparel-street", "overcast-sidewalk"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"City sidewalk and curb.", cameraAngle:"low", interactionMode:"garment_worn_at_curb" })),
    crosswalk: mode(ids("apparel-street", "hard-sun-crossing"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Recognizable street crossing or crosswalk.", framing:"full_body", interactionMode:"garment_worn_crossing" })),
    metro_stairs: mode(ids("apparel-street", "metro-exit"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Metro entrance or transit stairs.", framing:"full_body", interactionMode:"garment_worn_on_stairs" })),
    storefront: mode(ids("apparel-street", "storefront-day", "golden-hour-street"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Visible storefront and pedestrian street.", framing:"medium", interactionMode:"garment_worn_storefront" })),
    concrete_district: mode(ids("apparel-street", "parking-structure", "stone-architecture"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Concrete or stone urban architecture.", framing:"three_quarter" })),
    low_angle_street: mode(ids("apparel-street", "dry-neon-district"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Recognizable street-level city context.", cameraAngle:"low", framing:"full_body" })),
    movement_detail: mode(ids("apparel-street", "industrial-alley"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Recognizable city street.", cameraDistance:"close", framing:"medium_close", interactionMode:"garment_motion_detail" })),
    seated_urban_moment: mode(ids("apparel-street", "residential-european"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Urban architecture with a credible seat or ledge.", framing:"full_body", interactionMode:"garment_worn_seated" })),
    night_editorial: mode(ids("apparel-street", "rainy-city"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Recognizable night city street.", lighting:"direct_flash_and_city_ambience", captureProfile:"urban_night_flash" })),
  }},
  "apparel-studio": { vertical:"apparel", sceneTypes:["controlled_human_studio","controlled_product_studio"], modes: {
    model_studio: mode(ids("apparel-studio","soft-gray","warm-beige"), human({ sceneTypes:["controlled_human_studio"], environmentGrammar:"Controlled seamless fashion studio.", framing:"full_body", interactionMode:"garment_worn_in_studio", captureProfile:"soft_studio_fashion" })),
    ghost_mannequin: mode(ids("apparel-studio","high-key-white"), product({ environmentGrammar:"Clean e-commerce studio with invisible internal shaping.", physicalSupport:"invisible_garment_shaping", gravityBehavior:"worn_shape_without_body", productOrientation:"front", required:["Garment holds a believable worn volume without any visible or implied body artifact."], forbidden:["Skin, limbs, torso silhouette, mannequin hardware, or phantom anatomy."], referenceProtectedFields:["humanPresence","interactionMode","physicalSupport","gravityBehavior"] })),
    floating: mode(ids("apparel-studio","dark-charcoal","hard-light"), floating({ environmentGrammar:"Controlled apparel studio.", productOrientation:"three_quarter" })),
    hanger: mode(ids("apparel-studio","window-light"), product({ physicalSupport:"visible_hanger", gravityBehavior:"natural_hanger_drape", surface:"none", propLanguage:"single_hanger", required:["A visible hanger supports the garment with natural drape."], forbidden:["Pedestal, folded placement, or invisible mannequin."] })),
    flat_lay: mode(ids("apparel-studio","shadow-play"), topDown({ physicalSupport:"flat_surface", gravityBehavior:"flat_natural_fabric_weight" })),
    folded: mode(ids("apparel-studio","folded-catalogue"), topDown({ framing:"full_product", productOrientation:"folded", physicalSupport:"flat_surface", targetDetail:"folded_product_construction" })),
    sculptural_stage: mode(ids("apparel-studio","monochrome"), pedestal({ environmentGrammar:"Controlled sculptural studio set.", propLanguage:"minimal_sculptural_blocks" })),
    fabric_motion: mode(ids("apparel-studio","fabric-motion"), floating({ framing:"full_product", targetDetail:"fabric_motion", required:["Human-free suspended garment with subtle believable fabric movement."], forbidden:["Visible body, extreme wind distortion, or resting support."] })),
    detail: mode(ids("apparel-studio","color-field"), macro({ targetDetail:"stitching_texture_or_construction" })),
    catalogue_product: mode(ids("apparel-studio","floor-seated"), product({ environmentGrammar:"Neutral catalogue studio.", cameraAngle:"front_on", framing:"full_product", productOrientation:"front", physicalSupport:"invisible_or_flat_support", propLanguage:"none" })),
  }},
  "apparel-scenic": { vertical:"apparel", sceneTypes:["human_interaction","editorial_lifestyle"], modes: {
    model_landscape: mode(ids("apparel-scenic","rocky-coast","mountain","dry-landscape"), human({ environmentGrammar:"Open natural landscape with visible depth.", framing:"full_body", interactionMode:"garment_worn_in_landscape" })),
    architectural_model: mode(ids("apparel-scenic","modern-terrace","stone-courtyard"), human({ environmentGrammar:"Refined outdoor architecture, terrace, or courtyard.", framing:"full_body", interactionMode:"garment_worn_in_architecture" })),
    walking_location: mode(ids("apparel-scenic","open-field","minimal-dune"), human({ environmentGrammar:"Natural outdoor location.", framing:"full_body", interactionMode:"garment_worn_walking" })),
    seated_location: mode(ids("apparel-scenic","cliff-stone"), human({ environmentGrammar:"Natural location with credible seating support.", framing:"full_body", interactionMode:"garment_worn_seated" })),
    environmental_portrait: mode(ids("apparel-scenic","lakeside","forest-edge"), human({ environmentGrammar:"Refined natural environment.", framing:"environmental", subjectScale:"medium", interactionMode:"garment_worn_portrait" })),
  }},
  "jewelry-on-model": { vertical:"jewelry", sceneTypes:["human_interaction","editorial_lifestyle"], modes: {
    on_neck: mode(ids("jewelry-on-model","luxury-skin","profile-window"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"jewelry_on_neck", targetDetail:"necklace_or_pendant" })),
    on_ear: mode(ids("jewelry-on-model","dark-dramatic"), human({ cameraDistance:"macro", framing:"macro", humanPresence:"partial", interactionMode:"jewelry_on_ear", targetDetail:"earring_attachment" })),
    on_hand: mode(ids("jewelry-on-model","soft-daylight","direct-flash-beauty"), human({ cameraDistance:"macro", framing:"macro", humanPresence:"partial", interactionMode:"jewelry_on_hand", targetDetail:"ring_or_hand_jewelry" })),
    on_wrist: mode(ids("jewelry-on-model","warm-natural"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"jewelry_on_wrist", targetDetail:"bracelet_contact" })),
    beauty_macro: mode(ids("jewelry-on-model","minimal-beauty"), human({ cameraDistance:"macro", cameraAngle:"product_level", framing:"macro", subjectScale:"extreme_close", humanPresence:"partial", interactionMode:"jewelry_beauty_macro", targetDetail:"jewelry_and_skin_contact", forbidden:["Wide or full-body portrait."] })),
    editorial_closeup: mode(ids("jewelry-on-model","evening-editorial","soft-fabric","architectural-closeup"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"jewelry_editorial_closeup", forbidden:["Wide environmental or full-body framing."] })),
  }},
  "jewelry-lifestyle": { vertical:"jewelry", sceneTypes:["human_free_editorial_environment"], modes: {
    stone: mode(ids("jewelry-lifestyle","natural-stone"), product({ environmentGrammar:"Tactile natural stone surface.", surface:"natural_stone" })),
    textile: mode(ids("jewelry-lifestyle","soft-fabric"), product({ environmentGrammar:"Tasteful textile still life.", physicalSupport:"soft_textile_support", surface:"textile" })),
    mirror: mode(ids("jewelry-lifestyle","mirror-plane"), reflection({ environmentGrammar:"Human-free mirror-plane still life.", propLanguage:"single_mirror_plane" })),
    gallery: mode(ids("jewelry-lifestyle","architecture","plaster-gallery"), product({ environmentGrammar:"Human-free gallery ledge or architectural surface.", surface:"gallery_ledge", propLanguage:"architecture_only" })),
    reflective_surface: mode(ids("jewelry-lifestyle","reflective-glass"), reflection({ environmentGrammar:"Controlled reflective glass surface.", surface:"reflective_glass" })),
    editorial_still_life: mode(ids("jewelry-lifestyle","vanity","sun-shadow","warm-wood","botanical"), product({ environmentGrammar:"Styled human-free editorial still life.", propLanguage:"one_contextual_accent" })),
  }},
  "jewelry-studio": { vertical:"jewelry", sceneTypes:["controlled_product_studio"], modes: {
    macro: mode(ids("jewelry-studio","clean-white"), macro({ targetDetail:"jewelry_craftsmanship" })),
    pedestal: mode(ids("jewelry-studio","pedestal"), pedestal()),
    reflection: mode(ids("jewelry-studio","reflective-acrylic"), reflection()),
    stone: mode(ids("jewelry-studio","warm-beige"), product({ surface:"stone_plinth", physicalSupport:"stone_support" })),
    textile: mode(ids("jewelry-studio","soft-gray"), product({ surface:"textile", physicalSupport:"soft_textile_support" })),
    shadow: mode(ids("jewelry-studio","hard-shadow"), product({ lighting:"graphic_hard_shadow", targetDetail:"shadow_composition" })),
    clean_packshot: mode(ids("jewelry-studio","black-luxury","soft-gradient"), product({ environmentGrammar:"Clean luxury studio backdrop.", propLanguage:"none", framing:"full_product" })),
  }},
  "watches-on-wrist": { vertical:"watches", sceneTypes:["human_interaction","editorial_lifestyle"], modes: {
    wrist_hero: mode(ids("watches-on-wrist","casual-knit"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"watch_on_wrist", targetDetail:"dial_and_wrist_fit" })),
    executive: mode(ids("watches-on-wrist","suit-cuff","dark-clothing"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"watch_with_tailored_cuff", environmentGrammar:"Restrained executive context." })),
    travel: mode(ids("watches-on-wrist","car-interior","travel-lounge"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"watch_on_wrist_travel", environmentGrammar:"Refined travel context." })),
    outdoor: mode(ids("watches-on-wrist","outdoor","stone-terrace"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"watch_on_wrist_outdoor", environmentGrammar:"Outdoor daylight context." })),
    architecture: mode(ids("watches-on-wrist","architectural-daylight"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"watch_on_wrist_architecture", environmentGrammar:"Clean architectural context." })),
    lifestyle_closeup: mode(ids("watches-on-wrist","cafe-table","evening-luxury"), human({ cameraDistance:"close", framing:"close_up", humanPresence:"partial", interactionMode:"watch_lifestyle_closeup" })),
  }},
  "watches-product-composition": { vertical:"watches", sceneTypes:["human_free_editorial_environment"], modes: {
    desk: mode(ids("watches-product-composition","luxury-desk"), product({ environmentGrammar:"Sparse premium desk arrangement.", surface:"desk", propLanguage:"restrained_desk_objects" })),
    stone: mode(ids("watches-product-composition","stone-pedestal"), pedestal({ surface:"stone_pedestal" })),
    leather: mode(ids("watches-product-composition","leather-surface"), product({ surface:"leather", physicalSupport:"leather_surface" })),
    metal: mode(ids("watches-product-composition","brushed-metal"), product({ surface:"brushed_metal", physicalSupport:"metal_support" })),
    fabric: mode(ids("watches-product-composition","soft-fabric"), product({ surface:"fabric", physicalSupport:"soft_textile_support" })),
    box_composition: mode(ids("watches-product-composition","watch-box","architectural-block"), product({ surface:"watch_box_or_block", physicalSupport:"box_support", propLanguage:"single_box_or_block" })),
    macro_detail: mode(ids("watches-product-composition","dark-wood"), macro({ targetDetail:"crown_case_or_dial_detail" })),
  }},
  "watches-editorial-studio": { vertical:"watches", sceneTypes:["controlled_product_studio"], modes: {
    dark_studio: mode(ids("watches-editorial-studio","black-reflective","warm-neutral"), product({ environmentGrammar:"Controlled low-key watch studio.", lighting:"low_key_detail_preserving" })),
    gradient: mode(ids("watches-editorial-studio","soft-gradient"), product({ environmentGrammar:"Controlled gradient studio backdrop.", propLanguage:"none" })),
    metallic: mode(ids("watches-editorial-studio","metallic"), product({ surface:"metallic_support", environmentGrammar:"Controlled metallic studio set." })),
    spotlight: mode(ids("watches-editorial-studio","spotlight"), product({ lighting:"focused_spotlight", environmentGrammar:"Minimal dark studio with one spotlight." })),
    reflection: mode(ids("watches-editorial-studio","monochrome"), reflection()),
    catalogue: mode(ids("watches-editorial-studio","catalogue","architectural-shadow"), product({ environmentGrammar:"High-end catalogue studio.", cameraAngle:"front_on", framing:"full_product", propLanguage:"none" })),
  }},
  "footwear-street": { vertical:"footwear", sceneTypes:["urban_street","human_interaction"], modes: {
    walking: mode(ids("footwear-street","sidewalk","industrial"), human({ environmentGrammar:"Recognizable city street.", cameraDistance:"close", cameraAngle:"low", framing:"medium_close", humanPresence:"partial", interactionMode:"footwear_walking", targetDetail:"footwear_and_ground_contact" })),
    crosswalk: mode(ids("footwear-street","crosswalk"), human({ environmentGrammar:"Recognizable crosswalk.", cameraDistance:"close", cameraAngle:"low", framing:"medium_close", humanPresence:"partial", interactionMode:"footwear_crossing" })),
    concrete_district: mode(ids("footwear-street","concrete","minimal-metropolitan"), human({ environmentGrammar:"Concrete urban district.", cameraDistance:"close", cameraAngle:"low", framing:"medium_close", humanPresence:"partial", interactionMode:"footwear_urban_stance" })),
    metro_stairs: mode(ids("footwear-street","metro-platform"), human({ environmentGrammar:"Metro platform or transit stairs.", cameraDistance:"close", cameraAngle:"low", framing:"medium_close", humanPresence:"partial", interactionMode:"footwear_on_stairs" })),
    seated_urban_moment: mode(ids("footwear-street","skate-urban"), human({ environmentGrammar:"Urban seating context.", cameraDistance:"close", cameraAngle:"low", framing:"medium_close", humanPresence:"partial", interactionMode:"footwear_seated" })),
    movement_detail: mode(ids("footwear-street","rainy"), human({ environmentGrammar:"Recognizable urban pavement.", cameraDistance:"macro", cameraAngle:"low", framing:"macro", subjectScale:"extreme_close", humanPresence:"partial", interactionMode:"footwear_motion_detail", targetDetail:"sole_flex_and_movement" })),
    low_angle_street: mode(ids("footwear-street","evening","storefront-night"), human({ environmentGrammar:"Recognizable city street.", cameraDistance:"close", cameraAngle:"low", framing:"medium_close", humanPresence:"partial", interactionMode:"footwear_urban_stance" })),
  }},
  "footwear-studio": { vertical:"footwear", sceneTypes:["controlled_product_studio"], modes: {
    isolated_hero: mode(ids("footwear-studio","white"), product({ framing:"full_product", cameraDistance:"close", targetDetail:"complete_footwear_silhouette" })),
    floating_product: mode(ids("footwear-studio","gray"), floating()),
    pedestal: mode(ids("footwear-studio","pedestal"), pedestal()),
    reflective_floor: mode(ids("footwear-studio","reflective-floor"), reflection({ surface:"reflective_floor" })),
    sculptural_blocks: mode(ids("footwear-studio","blocks"), pedestal({ propLanguage:"minimal_sculptural_blocks", physicalSupport:"visible_sculptural_blocks" })),
    pair_composition: mode(ids("footwear-studio","monochrome"), product({ productCount:"pair", interactionMode:"product_pair", required:["Show a coherent footwear pair when the source product semantics permit it."], forbidden:["Single-item-only hero when a pair is expected."], referenceProtectedFields:["productCount","interactionMode"] })),
    top_down: mode(ids("footwear-studio","soft-shadow"), topDown()),
    side_profile_campaign: mode(ids("footwear-studio","dark"), product({ cameraAngle:"side", productOrientation:"side_profile", framing:"full_product" })),
    macro_material_detail: mode(ids("footwear-studio","macro-detail"), macro({ targetDetail:"upper_sole_or_material_detail" })),
  }},
  "footwear-scenic": { vertical:"footwear", sceneTypes:["human_free_editorial_environment"], modes: {
    architectural_stone: mode(ids("footwear-scenic","architecture","stone"), product({ environmentGrammar:"Outdoor architecture and tactile stone.", surface:"architectural_stone" })),
    terrace: mode(ids("footwear-scenic","coastal"), product({ environmentGrammar:"Refined outdoor terrace.", surface:"terrace_stone" })),
    gallery: mode(ids("footwear-scenic","gallery-courtyard"), product({ environmentGrammar:"Human-free contemporary gallery setting.", surface:"gallery_surface" })),
    courtyard: mode(ids("footwear-scenic","stairs"), product({ environmentGrammar:"Human-free courtyard or stone steps.", surface:"courtyard_stone" })),
    hotel_setting: mode(ids("footwear-scenic","hotel-interior","travel"), product({ environmentGrammar:"Refined human-free hotel or travel interior.", surface:"hotel_architecture" })),
    minimal_landscape: mode(ids("footwear-scenic","rocky","desert","grass"), product({ environmentGrammar:"Minimal natural landscape with stable product contact.", surface:"natural_ground" })),
  }},
  "cosmetics-studio": { vertical:"cosmetics", sceneTypes:["controlled_product_studio"], modes: {
    packshot: mode(ids("cosmetics-studio","white"), product({ cameraAngle:"front_on", framing:"full_product", productOrientation:"front", propLanguage:"none", targetDetail:"package_and_label" })),
    floating: mode(ids("cosmetics-studio","beige"), floating()),
    liquid_interaction: mode(ids("cosmetics-studio","glossy"), product({ physicalSupport:"liquid_contact_or_splash", surface:"controlled_liquid", targetDetail:"liquid_product_interaction", required:["A controlled, physically plausible liquid interaction is materially visible."], forbidden:["Dry generic packshot with no liquid interaction."], referenceProtectedFields:["physicalSupport","surface","targetDetail"] })),
    acrylic: mode(ids("cosmetics-studio","acrylic"), product({ physicalSupport:"acrylic_support", surface:"clear_acrylic", propLanguage:"single_acrylic_form" })),
    reflection: mode(ids("cosmetics-studio","gradient"), reflection()),
    monochrome: mode(ids("cosmetics-studio","monochrome"), product({ environmentGrammar:"Tonal monochrome beauty studio.", propLanguage:"tonal_only" })),
    clinical: mode(ids("cosmetics-studio","shadow"), product({ environmentGrammar:"Clean clinical beauty studio.", lighting:"clean_clinical", propLanguage:"minimal_clinical", required:["Clinical cleanliness and precise controlled light are visually clear."], forbidden:["Botanical, rustic, or decorative lifestyle scene."], referenceProtectedFields:["environment","lighting","propLanguage"] })),
    glossy: mode(ids("cosmetics-studio","dark"), product({ environmentGrammar:"Glossy editorial beauty studio.", lighting:"glossy_editorial", surface:"glossy_surface" })),
    shadow_play: mode(ids("cosmetics-studio","shadow-play"), product({ lighting:"graphic_shadow_play", targetDetail:"graphic_shadow_composition", required:["Deliberate graphic shadows are materially visible."], forbidden:["Flat reflection-only studio."], referenceProtectedFields:["lighting","targetDetail"] })),
  }},
  "cosmetics-scenic": { vertical:"cosmetics", sceneTypes:["human_free_editorial_environment"], modes: {
    water: mode(ids("cosmetics-scenic","water"), product({ environmentGrammar:"Controlled water or wet-surface setting.", surface:"water", targetDetail:"water_interaction" })),
    stone: mode(ids("cosmetics-scenic","stone","mineral-shelf"), product({ environmentGrammar:"Tactile stone or mineral-plaster setting.", surface:"stone" })),
    botanical: mode(ids("cosmetics-scenic","botanical","organic"), product({ environmentGrammar:"Materially visible restrained botanical setting.", propLanguage:"botanical_accents", required:["Recognizable botanical context is materially present."], forbidden:["Plain stone or generic decor without botanical context."], referenceProtectedFields:["environment","propLanguage"] })),
    glasshouse: mode(ids("cosmetics-scenic","glasshouse"), product({ environmentGrammar:"Human-free glasshouse ledge with layered natural depth.", propLanguage:"glasshouse_structure" })),
    architecture: mode(ids("cosmetics-scenic","vanity"), product({ environmentGrammar:"Refined architectural shelf or vanity.", surface:"architectural_shelf" })),
    material_study: mode(ids("cosmetics-scenic","coastal","landscape"), product({ environmentGrammar:"Controlled material-led scenic study.", propLanguage:"one_material_accent" })),
    natural_light: mode(ids("cosmetics-scenic","sunlight"), product({ environmentGrammar:"Simple setting shaped by visible natural window light.", lighting:"natural_window_light" })),
  }},
  "bags-on-model": { vertical:"bags", sceneTypes:["human_interaction","editorial_lifestyle"], modes: {
    shoulder_carry: mode(ids("bags-on-model","shoulder-city"), human({ interactionMode:"bag_shoulder_carry", physicalSupport:"shoulder_and_source_strap", required:["Source-compatible strap rests naturally on the shoulder."], forbidden:["Crossbody or hand-only carry."], referenceProtectedFields:["interactionMode","physicalSupport"] })),
    hand_carry: mode(ids("bags-on-model","cafe-seated"), human({ humanPresence:"partial", interactionMode:"bag_hand_carry", physicalSupport:"natural_hand_grip", required:["A natural hand grip uses the source handle or clutch body."], forbidden:["Shoulder-only or crossbody carry."], referenceProtectedFields:["interactionMode","physicalSupport"] })),
    crossbody: mode(ids("bags-on-model","walking-street"), human({ interactionMode:"bag_crossbody_carry", physicalSupport:"crossbody_strap_contact", required:["The source-compatible strap crosses the torso and supports the bag at a plausible position."], forbidden:["Shoulder-only, handheld-only, or invented strap."], referenceProtectedFields:["interactionMode","physicalSupport"] })),
    walking: mode(ids("bags-on-model","shopping-street","casual-walking","hotel-arrival"), human({ framing:"three_quarter", interactionMode:"bag_source_compatible_carry_walking" })),
    seated: mode(ids("bags-on-model","terrace-seated"), human({ framing:"three_quarter", interactionMode:"bag_source_compatible_carry_seated" })),
    full_body: mode(ids("bags-on-model","gallery-walk"), human({ cameraDistance:"medium", framing:"full_body", interactionMode:"bag_source_compatible_carry" , forbidden:["Tight detail or waist crop."]})),
    waist_crop: mode(ids("bags-on-model","editorial-standing"), human({ cameraDistance:"close", framing:"waist_crop", interactionMode:"bag_source_compatible_carry", forbidden:["Full-body or tight-detail framing."] })),
    urban_editorial: mode(ids("bags-on-model","urban-lifestyle"), human({ sceneTypes:["urban_street","human_interaction"], environmentGrammar:"Recognizable refined urban architecture.", interactionMode:"bag_source_compatible_carry" })),
  }},
  "bags-studio": { vertical:"bags", sceneTypes:["controlled_product_studio"], modes: {
    front_hero: mode(ids("bags-studio","white"), product({ cameraAngle:"front_on", framing:"full_product", productOrientation:"front", targetDetail:"complete_bag_front" })),
    three_quarter_hero: mode(ids("bags-studio","beige","dark"), product({ cameraAngle:"three_quarter", framing:"full_product", productOrientation:"three_quarter" })),
    suspended_bag: mode(ids("bags-studio","blocks"), floating({ targetDetail:"complete_suspended_bag" })),
    pedestal: mode(ids("bags-studio","pedestal"), pedestal()),
    top_down: mode(ids("bags-studio","soft-shadow"), topDown()),
    reflective_floor: mode(ids("bags-studio","reflective"), reflection({ surface:"reflective_floor" })),
    hardware_macro: mode(ids("bags-studio","monochrome"), macro({ targetDetail:"bag_hardware_or_closure", required:["Hardware or closure detail is visually dominant in a tight macro frame."], forbidden:["Wide full-bag hero without a dominant hardware detail."] })),
  }},
  "bags-lifestyle": { vertical:"bags", sceneTypes:["human_free_editorial_environment"], modes: {
    cafe: mode(ids("bags-lifestyle","cafe-table"), product({ environmentGrammar:"Human-free cafe tabletop setting.", surface:"cafe_table" })),
    terrace: mode(ids("bags-lifestyle","terrace"), product({ environmentGrammar:"Human-free refined terrace.", surface:"terrace_support" })),
    gallery: mode(ids("bags-lifestyle","gallery-plinth"), pedestal({ environmentGrammar:"Human-free gallery setting." })),
    hotel: mode(ids("bags-lifestyle","elegant-interior","hotel-console"), product({ environmentGrammar:"Human-free refined hotel interior.", surface:"hotel_console" })),
    architecture: mode(ids("bags-lifestyle","architecture","bench"), product({ environmentGrammar:"Human-free architectural environment.", surface:"architectural_support" })),
    window_light: mode(ids("bags-lifestyle","window-light"), product({ environmentGrammar:"Human-free interior near a window.", lighting:"natural_window_light" })),
    travel_setting: mode(ids("bags-lifestyle","travel-setting"), product({ environmentGrammar:"Human-free refined travel setting.", propLanguage:"restrained_travel_context" })),
    editorial_still_life: mode(ids("bags-lifestyle","scenic-outdoor"), product({ environmentGrammar:"Human-free editorial still life.", propLanguage:"one_editorial_accent" })),
  }},
} as const satisfies Record<string, FamilySeed>;

export const presentationModeContracts: readonly PresentationModeContract[] = Object.entries(families).flatMap(([familyId, family]) =>
  Object.entries(family.modes).map(([id, value]) => ({ id, familyId, vertical: family.vertical, variantIds: value.variants, ...value.contract })),
);

export function getPresentationModeContracts(familyId: unknown): readonly PresentationModeContract[] {
  return typeof familyId === "string" ? presentationModeContracts.filter((contract) => contract.familyId === familyId) : [];
}

export function getPresentationModeContract(familyId: unknown, modeId: unknown): PresentationModeContract | null {
  return typeof familyId === "string" && typeof modeId === "string"
    ? presentationModeContracts.find((contract) => contract.familyId === familyId && contract.id === modeId) ?? null
    : null;
}

export function getPresentationModeContractForVariant(familyId: string, variantId: string): PresentationModeContract | null {
  return presentationModeContracts.find((contract) => contract.familyId === familyId && contract.variantIds.includes(variantId)) ?? null;
}

export function describePresentationModeContract(contract: PresentationModeContract): string {
  return [
    `Presentation contract ${contract.id}: scene ${contract.sceneTypes.join(" or ")}; environment ${contract.environmentGrammar}`,
    `Camera ${contract.cameraDistance}/${contract.cameraAngle}; framing ${contract.framing}; scale ${contract.subjectScale}; placement ${contract.subjectPlacement}; orientation ${contract.productOrientation}.`,
    `Support ${contract.physicalSupport}; gravity ${contract.gravityBehavior}; human ${contract.humanPresence}; interaction ${contract.interactionMode}; surface ${contract.surface}.`,
    `Required: ${contract.required.join(" ")} Forbidden: ${contract.forbidden.join(" ")}`,
  ].join(" ");
}
