import type { CreativePreset } from "./creative-presets";
import { renderCreativeBrief } from "@/lib/generation/prompts/creative-brief";

export function renderPresetCreativeDirection(
  preset: Pick<CreativePreset, "creativeDirection">,
  userCreativeDirection = "",
): string {
  const userNote = userCreativeDirection.trim();
  const renderedPreset = renderCreativeBrief(preset.creativeDirection);

  if (!userNote) {
    return renderedPreset;
  }

  return `${renderedPreset}\n\nUser customization: Apply this request only to the relevant creative fields while preserving all other preset defaults: ${userNote}`;
}

export function buildCreativePresetDirection(
  userCreativeDirection: string,
  preset: Pick<CreativePreset, "creativeDirection"> | null,
): string {
  if (!preset) {
    return userCreativeDirection.trim();
  }

  return renderPresetCreativeDirection(preset, userCreativeDirection);
}

export function createCreativePresetMetadata(preset: CreativePreset | null) {
  if (!preset) {
    return null;
  }

  return {
    id: preset.id,
    title: preset.title,
    category: preset.category,
    vertical: preset.vertical,
    useCase: preset.useCase,
  };
}

export function canCreateImageWithPreset(
  hasProduct: boolean,
  userCreativeDirection: string,
  preset: CreativePreset | null,
): boolean {
  return hasProduct && Boolean(userCreativeDirection.trim() || preset);
}
