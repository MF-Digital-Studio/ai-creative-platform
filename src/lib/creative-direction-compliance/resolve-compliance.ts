import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import { extractCreativeRequirements } from "./extract-creative-requirements";
import { CREATIVE_DIRECTION_COMPLIANCE_VERSION } from "./compliance-version";
import type { CreativeRequirement, ResolveComplianceInput, CreativeComplianceResolution } from "./types";

function normalized(value: string): string { return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function productColorConflict(requirement: CreativeRequirement, profile: ProductProfile): boolean {
  if (requirement.category !== "color") return false;
  const prompt = normalized(requirement.value);
  const colors = profile.dominantColors.concat(profile.identityCriticalAttributes.map((attribute) => attribute.attribute));
  const hasProductTarget = /ring|yuzuk|dial|kadran|shoe|ayakkabi|bottle|sise|dress|garment|elbise|kiyafet/.test(prompt);
  if (!hasProductTarget && profile.vertical !== "apparel") return false;
  if (profile.vertical === "apparel" && hasProductTarget) return true;
  return colors.some((color) => {
    const existing = normalized(color);
    return (existing.includes("silver") || existing.includes("gumus") || existing.includes("steel")) && prompt.startsWith("gold ")
      || existing.includes("gold") && prompt.startsWith("silver ")
      || existing.includes("green") && prompt.startsWith("blue ")
      || existing.includes("white") && prompt.startsWith("black ")
      || existing.includes("pink") && prompt.startsWith("blue ");
  });
}

function colorTargetConflict(requirement: CreativeRequirement, profile: ProductProfile): boolean {
  if (requirement.category !== "color") return false;
  const prompt = normalized(requirement.value);
  const identity = normalized(profile.identityCriticalAttributes.map((attribute) => `${attribute.attribute} ${attribute.rationale}`).join(" "));
  return (profile.vertical === "apparel" && /artwork|logo|print|color|renk/.test(identity))
    || (profile.vertical === "footwear" && /shoe|ayakkabi/.test(identity) && prompt === "black");
}

function physicalConflict(requirement: CreativeRequirement, profile: ProductProfile): boolean {
  if (requirement.category !== "interaction") return false;
  return profile.interactionTargets.every((target) => target === "none");
}

export function resolveCreativeCompliance(input: ResolveComplianceInput): CreativeComplianceResolution {
  const extracted = extractCreativeRequirements(input.userPrompt);
  const requirements = extracted.map((requirement) => {
    if (requirement.status === "decorative") return requirement;
    if (input.productProfile && (productColorConflict(requirement, input.productProfile) || colorTargetConflict(requirement, input.productProfile))) return { ...requirement, status: "rejected_identity_conflict" as const };
    if (input.productProfile && physicalConflict(requirement, input.productProfile)) return { ...requirement, status: "rejected_physical_conflict" as const };
    if (requirement.category === "composition" && requirement.value === "wide full-body framing" && input.composition && (input.composition.framing === "close_up" || input.composition.framing === "macro" || input.composition.productDominance === "hero")) return { ...requirement, status: "adjusted_for_composition" as const };
    return requirement;
  });
  return {
    version: CREATIVE_DIRECTION_COMPLIANCE_VERSION,
    requirements,
    applied: requirements.filter(({ status }) => status === "applied"),
    rejected: requirements.filter(({ status }) => status.startsWith("rejected_")),
    adjustedForComposition: requirements.filter(({ status }) => status === "adjusted_for_composition"),
  };
}
