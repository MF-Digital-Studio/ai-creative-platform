"use server";

import { revalidatePath } from "next/cache";
import { isSupportedLocale, type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import {
  updateGenerationFavorite,
  type FavoriteGenerationRepository,
  type FavoriteGenerationResult,
} from "@/lib/generations/favorite-generation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function toggleGenerationFavorite(
  locale: AppLocale,
  generationId: string,
  nextValue: boolean,
): Promise<FavoriteGenerationResult> {
  if (!isSupportedLocale(locale) || !uuidPattern.test(generationId) || typeof nextValue !== "boolean") {
    return { status: "error" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) return { status: "error" };

  try {
    const admin = getSupabaseAdminClient();
    const repository: FavoriteGenerationRepository = {
      async findGeneration(id) {
        const { data: generation, error } = await admin
          .from("generations")
          .select("id, project_id, status, output_bucket_id, output_object_path")
          .eq("id", id)
          .maybeSingle();
        if (error || !generation) return null;

        const { data: project, error: projectError } = await admin
          .from("projects")
          .select("user_id")
          .eq("id", generation.project_id)
          .maybeSingle();
        if (projectError || !project) return null;

        return {
          id: generation.id,
          ownerId: project.user_id,
          status: generation.status,
          outputBucketId: generation.output_bucket_id,
          outputObjectPath: generation.output_object_path,
        };
      },
      async updateFavorite(id, value) {
        const { data, error } = await admin
          .from("generations")
          .update({ is_favorite: value })
          .eq("id", id)
          .eq("status", "succeeded")
          .not("output_bucket_id", "is", null)
          .not("output_object_path", "is", null)
          .select("id")
          .maybeSingle();
        return !error && Boolean(data);
      },
    };

    const result = await updateGenerationFavorite(repository, { userId, generationId, nextValue });
    if (result.status === "success") {
      revalidatePath(`/${locale}/dashboard`, "page");
      revalidatePath(`/${locale}/dashboard/projects`, "page");
    }
    return result;
  } catch {
    return { status: "error" };
  }
}
