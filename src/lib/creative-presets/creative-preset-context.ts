import type { CreativePreset } from "./creative-presets";
import { renderCreativeBrief } from "@/lib/generation/prompts/creative-brief";
import { getPresetFamily } from "./creative-presets";
import { getPresetVariationMetadata } from "./creative-presets";
import { PRESET_SYSTEM_VERSION } from "./creative-presets";

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

export function createCreativePresetMetadata(preset: CreativePreset | null, variantId?: string | null) {
  if (!preset) {
    return null;
  }

  const family = getPresetFamily(preset.id);
  const variant = family?.variants.find(({ id }) => id === variantId);
  return {
    id: preset.id,
    title: preset.title,
    category: preset.category,
    vertical: preset.vertical,
    useCase: preset.useCase,
    ...(family ? {
      version: PRESET_SYSTEM_VERSION, familyId: family.id, variantId: variantId ?? null,
      ...(variant ? getPresetVariationMetadata(variant) : {}),
      vertical: family.vertical,
      allowedSceneTypes: family.allowedSceneTypes,
      disallowedSceneTypes: family.disallowedSceneTypes,
    } : {}),
  };
}

export function canCreateImageWithPreset(
  hasProduct: boolean,
  userCreativeDirection: string,
  preset: CreativePreset | null,
): boolean {
  return hasProduct && Boolean(userCreativeDirection.trim() || preset);
}
