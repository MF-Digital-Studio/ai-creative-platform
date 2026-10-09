import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isProductProfile } from "@/lib/product-understanding/product-profile";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type ProjectStatus = "draft" | "active" | "completed";
export type GenerationType = "image" | "video";
export type GenerationStatus = "queued" | "processing" | "succeeded" | "failed";
export type ProjectSort = "updated" | "newest" | "oldest";

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
  vertical: SupportedVertical | null;
};

type ThumbnailGenerationRow = ProjectGenerationSummary & {
  output_bucket_id: string | null;
  output_object_path: string | null;
};

type AssetRow = {
  bucket_id: string;
  object_path: string;
  product_profile: unknown;
  created_at: string;
};

type ProjectRow = Pick<Project, "id" | "title" | "status" | "created_at" | "updated_at"> & {
  latest_generation: ProjectGenerationSummary[];
  successful_generation: ThumbnailGenerationRow[];
  product_asset: AssetRow[];
};

const projectFields = `
  id, title, status, created_at, updated_at,
  latest_generation:generations(generation_type, status, created_at),
  successful_generation:generations(generation_type, status, output_bucket_id, output_object_path, created_at),
  product_asset:assets(bucket_id, object_path, product_profile, product_role, sort_order, created_at)
`;

async function signProjectPreviews(rows: ProjectRow[]): Promise<Project[]> {
  const supabase = await createClient();
  return Promise.all(rows.map(async (project) => {
    const latestGeneration = project.latest_generation[0] ?? null;
    const successfulImage = project.successful_generation[0] ?? null;
    const productAsset = project.product_asset[0] ?? null;
    const previewAsset = successfulImage?.output_bucket_id && successfulImage.output_object_path
      ? { bucketId: successfulImage.output_bucket_id, objectPath: successfulImage.output_object_path, source: "generation" as const }
      : productAsset ? { bucketId: productAsset.bucket_id, objectPath: productAsset.object_path, source: "product" as const } : null;
    const { data } = previewAsset
      ? await supabase.storage.from(previewAsset.bucketId).createSignedUrl(previewAsset.objectPath, 3600)
      : { data: null };
    const thumbnailUrl = data?.signedUrl ?? null;
    return {
      id: project.id,
      title: project.title,
      status: project.status,
      created_at: project.created_at,
      updated_at: project.updated_at,
      latest_generation: latestGeneration,
      thumbnail_url: thumbnailUrl,
      thumbnail_source: thumbnailUrl ? previewAsset?.source ?? null : null,
      vertical: isProductProfile(productAsset?.product_profile) ? productAsset.product_profile.vertical : null,
    } satisfies Project;
  }));
}

function buildProjectQuery(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return supabase.from("projects").select(projectFields, { count: "exact" }).eq("user_id", userId)
    .order("created_at", { referencedTable: "latest_generation", ascending: false })
    .limit(1, { referencedTable: "latest_generation" })
    .eq("successful_generation.generation_type", "image")
    .eq("successful_generation.status", "succeeded")
    .order("created_at", { referencedTable: "successful_generation", ascending: false })
    .limit(1, { referencedTable: "successful_generation" })
    .eq("product_asset.asset_type", "product")
    .eq("product_asset.product_role", "primary")
    .order("sort_order", { referencedTable: "product_asset", ascending: true })
    .limit(1, { referencedTable: "product_asset" });
}

function logProjectQueryFailure(error: { code: string; message: string; details: string; hint: string }) {
  if (process.env.NODE_ENV === "development") {
    console.error("[projects] query_failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
}

export async function getProjects(userId: string, limit?: number): Promise<Project[]> {
  if (process.env.NODE_ENV === "development") {
    console.info("[projects] query_start", { userIdPresent: Boolean(userId), limit: limit ?? null });
  }
  const supabase = await createClient();
  const query = buildProjectQuery(supabase, userId).order("created_at", { ascending: false });
  const { data, error } = limit ? await query.limit(limit) : await query;
  if (error) {
    logProjectQueryFailure(error);
    throw new Error("Unable to load projects.");
  }
  if (process.env.NODE_ENV === "development") {
    console.info("[projects] query_success", { count: data?.length ?? 0 });
  }
  return signProjectPreviews((data ?? []) as unknown as ProjectRow[]);
}

export async function getProjectsPage(userId: string, options: { page: number; pageSize: number; search: string; status: ProjectStatus | null; sort: ProjectSort }) {
  if (process.env.NODE_ENV === "development") {
    console.info("[projects] query_start", { userIdPresent: Boolean(userId), limit: options.pageSize });
  }
  const supabase = await createClient();
  const { count: totalCount, error: totalError } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (totalError) throw new Error("Unable to count projects.");
  const field = options.sort === "updated" ? "updated_at" : "created_at";
  const ascending = options.sort === "oldest";
  let query = buildProjectQuery(supabase, userId);
  if (options.search) query = query.ilike("title", `%${options.search}%`);
  if (options.status) query = query.eq("status", options.status);
  const start = (options.page - 1) * options.pageSize;
  const { data, count, error } = await query.order(field, { ascending }).range(start, start + options.pageSize - 1);
  if (error) {
    logProjectQueryFailure(error);
    throw new Error("Unable to load projects.");
  }
  const resultCount = count ?? 0;
  if (process.env.NODE_ENV === "development") {
    console.info("[projects] query_success", { count: data?.length ?? 0 });
  }
  const pageCount = Math.max(1, Math.ceil(resultCount / options.pageSize));
  if (resultCount > 0 && options.page > pageCount) return getProjectsPage(userId, { ...options, page: pageCount });
  return { projects: await signProjectPreviews((data ?? []) as unknown as ProjectRow[]), totalCount: totalCount ?? 0, resultCount, page: options.page, pageCount };
}
