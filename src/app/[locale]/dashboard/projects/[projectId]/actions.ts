"use server";

import { revalidatePath } from "next/cache";

import { isSupportedLocale, type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type RegisterProductAssetResult = {
  status: "error" | "success";
};

export type UpdateCreativeDirectionState = {
  status: "error" | "idle" | "success" | "validation";
};

function hasValidObjectPath(userId: string, projectId: string, objectPath: string) {
  const segments = objectPath.split("/");

  return (
    segments.length === 3 &&
    segments[0] === userId &&
    segments[1] === projectId &&
    segments[2].length > 0
  );
}

export async function registerProductAsset(
  locale: AppLocale,
  projectId: unknown,
  objectPath: unknown,
): Promise<RegisterProductAssetResult> {
  if (
    !isSupportedLocale(locale) ||
    typeof projectId !== "string" ||
    typeof objectPath !== "string"
  ) {
    return { status: "error" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId || !hasValidObjectPath(userId, projectId, objectPath)) {
    return { status: "error" };
  }

  try {
    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError || !project) {
      return { status: "error" };
    }

    const { error: assetError } = await supabase.from("assets").insert({
      user_id: userId,
      project_id: projectId,
      bucket_id: "product-assets",
      object_path: objectPath,
    });

    if (assetError) {
      return { status: "error" };
    }
  } catch {
    return { status: "error" };
  }

  revalidatePath(`/${locale}/dashboard/projects/${projectId}`, "page");

  return { status: "success" };
}

export async function updateCreativeDirection(
  locale: AppLocale,
  projectId: string,
  _previousState: UpdateCreativeDirectionState,
  formData: FormData,
): Promise<UpdateCreativeDirectionState> {
  if (!isSupportedLocale(locale) || typeof projectId !== "string") {
    return { status: "error" };
  }

  const creativeDirection = formData.get("creative_direction");
  if (typeof creativeDirection !== "string") {
    return { status: "error" };
  }

  const normalizedCreativeDirection = creativeDirection.trim();
  if (Array.from(normalizedCreativeDirection).length > 4000) {
    return { status: "validation" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { status: "error" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        creative_direction: normalizedCreativeDirection || null,
      })
      .eq("id", projectId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { status: "error" };
    }
  } catch {
    return { status: "error" };
  }

  revalidatePath(`/${locale}/dashboard/projects/${projectId}`, "page");

  return { status: "success" };
}
