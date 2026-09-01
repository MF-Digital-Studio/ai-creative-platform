import "server-only";

import { createClient } from "@/lib/supabase/server";
import { MAX_PROJECT_REFERENCE_IMAGES } from "./reference-asset-constraints";

export {
  isReferenceImageMimeType,
  MAX_PROJECT_REFERENCE_IMAGES,
  referenceImageMimeTypes,
  type ReferenceImageMimeType,
} from "./reference-asset-constraints";

export type ProjectReferenceAsset = {
  id: string;
  bucket_id: string;
  object_path: string;
  created_at: string;
};

const assetFields = "id, bucket_id, object_path, created_at";

export async function getProjectReferenceAssets(
  userId: string,
  projectId: string,
): Promise<ProjectReferenceAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select(assetFields)
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("asset_type", "reference_image")
    .order("created_at", { ascending: true })
    .limit(MAX_PROJECT_REFERENCE_IMAGES);

  if (error) {
    throw new Error("Unable to load reference assets.");
  }

  return (data ?? []) as ProjectReferenceAsset[];
}
