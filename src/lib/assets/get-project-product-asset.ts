import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProjectProductAsset = {
  id: string;
  bucket_id: string;
  object_path: string;
  created_at: string;
};

const assetFields = "id, bucket_id, object_path, created_at";

export async function getProjectProductAsset(
  userId: string,
  projectId: string,
): Promise<ProjectProductAsset | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select(assetFields)
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("asset_type", "product")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load product asset.");
  }

  return data as ProjectProductAsset | null;
}
