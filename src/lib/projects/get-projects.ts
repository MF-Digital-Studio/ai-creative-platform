import "server-only";

import {createClient} from "@/lib/supabase/server";

const projectFields = "id, title, status, created_at, updated_at";

export type ProjectStatus = "draft" | "active" | "completed";
export type GenerationType = "image" | "video";
export type GenerationStatus = "queued" | "processing" | "succeeded" | "failed";

export type ProjectGenerationSummary = {
  generation_type: GenerationType;
  status: GenerationStatus;
  created_at: string;
};

export type Project = {
  id: string;
  title: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  latest_generation: ProjectGenerationSummary | null;
  thumbnail_url: string | null;
  thumbnail_source: "generation" | "product" | null;
};

type ThumbnailGenerationRow = ProjectGenerationSummary & {
  output_bucket_id: string | null;
  output_object_path: string | null;
};

type AssetRow = {
  bucket_id: string;
  object_path: string;
  created_at: string;
};

type ProjectRow = Omit<
  Project,
  "latest_generation" | "thumbnail_url" | "thumbnail_source"
> & {
  latest_generation: ProjectGenerationSummary[];
  successful_generation: ThumbnailGenerationRow[];
  product_asset: AssetRow[];
};

export async function getProjects(userId: string, limit?: number): Promise<Project[]> {
  const supabase = await createClient();
  const query = supabase
    .from("projects")
    .select(`
      ${projectFields},
      latest_generation:generations(generation_type, status, created_at),
      successful_generation:generations(
        generation_type,
        status,
        output_bucket_id,
        output_object_path,
        created_at
      ),
      product_asset:assets(bucket_id, object_path, created_at)
    `)
    .eq("user_id", userId)
    .order("created_at", {ascending: false})
    .order("created_at", {referencedTable: "latest_generation", ascending: false})
    .limit(1, {referencedTable: "latest_generation"})
    .eq("successful_generation.generation_type", "image")
    .eq("successful_generation.status", "succeeded")
    .order("created_at", {referencedTable: "successful_generation", ascending: false})
    .limit(1, {referencedTable: "successful_generation"})
    .order("created_at", {referencedTable: "product_asset", ascending: false})
    .limit(1, {referencedTable: "product_asset"});
  const {data, error} = limit ? await query.limit(limit) : await query;

  if (error) {
    throw new Error("Unable to load projects.");
  }

  const projects = (data ?? []) as unknown as ProjectRow[];

  return Promise.all(
    projects.map(async (project) => {
      const latestGeneration = project.latest_generation[0] ?? null;
      const successfulImage = project.successful_generation[0] ?? null;
      const productAsset = project.product_asset[0] ?? null;
      const previewAsset = successfulImage?.output_bucket_id && successfulImage.output_object_path
        ? {
            bucketId: successfulImage.output_bucket_id,
            objectPath: successfulImage.output_object_path,
            source: "generation" as const,
          }
        : productAsset
          ? {
              bucketId: productAsset.bucket_id,
              objectPath: productAsset.object_path,
              source: "product" as const,
            }
          : null;

      let thumbnailUrl: string | null = null;
      if (previewAsset) {
        const {data: signedUrlData} = await supabase.storage
          .from(previewAsset.bucketId)
          .createSignedUrl(previewAsset.objectPath, 3600);
        thumbnailUrl = signedUrlData?.signedUrl ?? null;
      }

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        created_at: project.created_at,
        updated_at: project.updated_at,
        latest_generation: latestGeneration
          ? {
              generation_type: latestGeneration.generation_type,
              status: latestGeneration.status,
              created_at: latestGeneration.created_at,
            }
          : null,
        thumbnail_url: thumbnailUrl,
        thumbnail_source: thumbnailUrl ? previewAsset?.source ?? null : null,
      } satisfies Project;
    }),
  );
}
