import "server-only";

import { getProjectProductAssets, type ProjectProductAsset } from "./product-assets";

export type { ProjectProductAsset } from "./product-assets";

export async function getProjectProductAsset(
  userId: string,
  projectId: string,
): Promise<ProjectProductAsset | null> {
  return (await getProjectProductAssets(userId, projectId))[0] ?? null;
}
