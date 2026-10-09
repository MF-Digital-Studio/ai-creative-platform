export const MAX_PROJECT_PRODUCT_IMAGES = 4;
export const MAX_PRODUCT_IMAGE_FILE_SIZE = 20 * 1024 * 1024;

export const productImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type ProductImageMimeType = (typeof productImageMimeTypes)[number];
export type ProductAssetRole = "primary" | "supporting";

export function isProductImageMimeType(value: string): value is ProductImageMimeType {
  return productImageMimeTypes.includes(value as ProductImageMimeType);
}

export function nextProductAssetRole(activeCount: number): ProductAssetRole {
  return activeCount === 0 ? "primary" : "supporting";
}

export function canAddProductImages(activeCount: number, requestedCount = 1) {
  return activeCount >= 0 && requestedCount > 0 && activeCount + requestedCount <= MAX_PROJECT_PRODUCT_IMAGES;
}

