import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProductAssetRole } from "./product-asset-constraints";
import { resolveActiveProductAssets, type ProductAssetSetRow } from "./product-asset-set";

export type ProjectProductAsset = {
  id: string;
  bucket_id: string;
  object_path: string;
  created_at: string;
  product_profile: unknown;
  product_role: ProductAssetRole;
  sort_order: number;
};

const assetFields = "id, bucket_id, object_path, created_at, product_profile, product_role, sort_order";

export async function getProjectProductAssets(userId: string, projectId: string): Promise<ProjectProductAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select(assetFields)
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("asset_type", "product")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load product assets.");
  return resolveActiveProductAssets((data ?? []) as ProductAssetSetRow[]);
}

