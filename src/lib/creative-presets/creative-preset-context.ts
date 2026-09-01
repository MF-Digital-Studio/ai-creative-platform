import type { CreativePreset } from "./creative-presets";

export function buildCreativePresetDirection(
  userCreativeDirection: string,
  preset: Pick<CreativePreset, "promptSeed"> | null,
): string {
  return [preset?.promptSeed.trim(), userCreativeDirection.trim()].filter(Boolean).join("\n\n");
}

export function createCreativePresetMetadata(preset: CreativePreset | null) {
  if (!preset) {
    return null;
  }

  return {
    id: preset.id,
    title: preset.title,
    category: preset.category,
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
