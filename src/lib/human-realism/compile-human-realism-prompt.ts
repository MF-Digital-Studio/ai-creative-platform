import type { HumanRealismPolicy } from "./types";

export function compileHumanRealismPrompt(policy: HumanRealismPolicy, vertical: string | null): string {
  if (!policy.applied) return "";
  const areas = new Set(policy.focusAreas);
  return [
    "HUMAN REALISM: Photograph a believable person with natural proportions, plausible joints, posture and weight distribution. Avoid mannequin anatomy and obvious AI artifacts. Preserve source product identity above all human refinements.",
    areas.has("skin") ? "SKIN: Keep subtle pores, fine texture, tonal variation, realistic translucency and highlights with restrained editorial retouching. Avoid plastic, waxy, airbrushed, porcelain, pore-free or CGI skin; do not exaggerate pores, wrinkles or blemishes." : "",
    areas.has("face") ? "FACE AND HAIR: Natural asymmetry, eyes, eyelids, lips, teeth if visible, expression, hairline, strand variation and flyaways. Avoid doll symmetry, uncanny stare, helmet hair and synthetic shine." : "",
    areas.has("hands") ? "ANATOMY: Exactly five fingers per visible hand, correctly placed thumb, natural lengths, joints, knuckles and pose. Nails align with fingers, have believable thickness and requested polish; no fused, duplicated, stretched or floating digits or nails. Scrutinize close-up hands." : "",
    vertical === "apparel" ? "CONTACT: Garment follows shoulders, chest and back with gravity-consistent drape, folds and tension; no floating cloth or distorted body." :
      vertical === "jewelry" ? "CONTACT: Jewelry wraps or attaches naturally to fingers, ears or neck with plausible occlusion and skin contact." :
      vertical === "watches" ? "CONTACT: Strap wraps the anatomical wrist; case rests on skin with a realistic contact shadow." :
      vertical === "footwear" ? "CONTACT: Natural ankle and foot geometry, balanced stance, weight-bearing sole and ground contact." :
      vertical === "cosmetics" ? "CONTACT: Natural face and hand texture even in close-up beauty lighting; product touches skin plausibly." : "CONTACT: Product and body meet with realistic pressure, occlusion and shadow.",
  ].filter(Boolean).join("\n");
}
