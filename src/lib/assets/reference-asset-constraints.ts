export const MAX_PROJECT_REFERENCE_IMAGES = 3;

export const referenceImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ReferenceImageMimeType = (typeof referenceImageMimeTypes)[number];

export function isReferenceImageMimeType(value: string): value is ReferenceImageMimeType {
  return (referenceImageMimeTypes as readonly string[]).includes(value);
}
