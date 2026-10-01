import type { CreativeComplianceResolution, CreativeRequirement } from "./types";

function instruction(requirement: CreativeRequirement): string {
  return requirement.value === "black nail polish" ? "model/hand must have clearly visible black nail polish"
    : requirement.value === "red nail polish" ? "model/hand must have clearly visible red nail polish"
      : requirement.value === "an elegant feminine hand" ? "use an elegant feminine hand"
        : requirement.value === "wide full-body framing" ? "do not use unsafe wide full-body framing; keep the product in the safe composition"
          : `use ${requirement.value}`;
}

export function compileCreativeComplianceDirection(resolution: CreativeComplianceResolution | null): string {
  if (!resolution) return "";
  const applied = resolution.requirements.filter(({ status }) => status === "applied" || status === "decorative" || status === "adjusted_for_composition");
  if (!applied.length) return "";
  const unique = applied.map(instruction).filter((value, index, all) => all.indexOf(value) === index);
  return `Creative requirements — must preserve:\n${unique.map((value) => `- ${value}`).join("\n")}`;
}
