import { MAX_PROJECT_PRODUCT_IMAGES, type ProductAssetRole } from "./product-asset-constraints";

export type ProductAssetSetRow = {
  id: string;
  bucket_id: string;
  object_path: string;
  created_at: string;
  product_profile: unknown;
  product_role: ProductAssetRole | null;
  sort_order: number | null;
};

export type ActiveProductAsset = Omit<ProductAssetSetRow, "product_role" | "sort_order"> & {
  product_role: ProductAssetRole;
  sort_order: number;
};

/** Explicit V1 members win; unmigrated legacy rows degrade to the newest single image. */
export function resolveActiveProductAssets(rows: readonly ProductAssetSetRow[]): ActiveProductAsset[] {
  const active = rows
    .filter((row): row is ActiveProductAsset => (row.product_role === "primary" || row.product_role === "supporting") && Number.isInteger(row.sort_order))
    .sort((a, b) => (a.product_role === "primary" ? 0 : 1) - (b.product_role === "primary" ? 0 : 1) || a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at))
    .slice(0, MAX_PROJECT_PRODUCT_IMAGES);
  if (active.length) return active;
  const legacy = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return legacy ? [{ ...legacy, product_role: "primary", sort_order: 0 }] : [];
}

