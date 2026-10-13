import type { HumanRealismPolicy } from "./types";

export function compileHumanRealismPrompt(policy: HumanRealismPolicy, vertical: string | null): string {
  if (!policy.applied) return "";
  const areas = new Set(policy.focusAreas);
  return [
    "HUMAN REALISM V2 — BINDING: Render a real photographed, clearly adult human with anatomically correct natural proportions, believable posture, balance, weight distribution, joint continuity, and physically plausible product contact. Preserve attractive commercial realism through genuine photographic imperfections and slight natural asymmetry; never optimize toward mathematical perfection or a synthetic avatar. Preserve the exact product SKU above all human refinements.",
    areas.has("skin") ? "SKIN: Natural microtexture, subtle pores where photographically appropriate, fine tonal variation, realistic highlights and subsurface appearance, restrained commercial retouching, and small natural irregularities. No waxy, plastic, porcelain, poreless, rubbery, blurred, uniformly airbrushed, or beauty-filter skin." : "",
    areas.has("face") ? "FACE: Believable bone structure, natural asymmetry, alive-looking aligned eyes and eyelids, under-eye structure, natural nose anatomy, textured lips, brows, lashes, and expression. HAIR: believable roots and hairline, strand breakup, density variation, volume, gravity and subtle flyaways; no doll face, dead eyes, frozen smile, helmet hair, painted hair, or synthetic wig edge." : "",
    areas.has("hands") ? "HANDS: Anatomically correct hands; when fully visible, five fingers with realistic lengths, thumb placement, joints, knuckles, nails, grip and contact. Respect plausible occlusion—hidden fingers are not missing. No fused, extra, duplicated, rubbery or malformed digits, impossible wrists, or hand/object clipping." : "",
    areas.has("feet") ? "FEET: Correct ankle, arch and heel anatomy; when toes are clearly visible, five toes with realistic spacing and alignment. Feet must occupy footwear naturally with plausible heel, sole, strap and open-toe contact. Respect plausible occlusion; no fused, missing, extra or distorted visible toes." : "",
    areas.has("body") ? "FULL BODY: Realistic overall proportions, shoulders, arms, elbows, wrists, legs, knees, ankles, natural posture, and center of gravity. No tubular, detached or duplicated limbs, impossible bending, distorted proportions, or stiff mannequin posture." : "",
    vertical === "apparel" ? "CONTACT: Garment follows the body with gravity-consistent drape, folds, tension, and natural fit; no floating cloth or distorted anatomy." :
      vertical === "jewelry" ? "CONTACT: Jewelry wraps or attaches naturally to fingers, ears or neck with plausible occlusion and skin contact." :
      vertical === "watches" ? "CONTACT: Strap wraps the anatomical wrist; case rests on skin with a realistic contact shadow." :
      vertical === "footwear" ? "CONTACT: The foot occupies the shoe; toe, footbed, strap, sole and heel relationships are physically plausible, with balanced stance, weight-bearing compression and ground contact—no shoe clipping." :
      vertical === "cosmetics" ? "CONTACT: Natural face and hand texture even in close-up beauty lighting; product touches skin plausibly." : "CONTACT: Product and body meet with realistic pressure, occlusion and shadow.",
    vertical === "bags" ? "CONTACT: Fingers naturally grip handles; handles bend under load. Shoulder/crossbody straps follow the body contour with believable weight, gravity, contact and tension; no floating strap, skin penetration or bag/torso merge." : "",
    "ARTIFACT REJECTION (compact): no mannequin/doll/wax figure appearance, hyper-symmetrical face, duplicated or missing limbs, broken major joints, body parts merging into clothing, straps or jewelry entering skin, floating contact, or synthetic AI-model finish.",
  ].filter(Boolean).join("\n");
}
