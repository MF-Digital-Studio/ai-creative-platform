export type FavoriteGenerationRecord = {
  id: string;
  ownerId: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  outputBucketId: string | null;
  outputObjectPath: string | null;
};

export type FavoriteGenerationRepository = {
  findGeneration: (generationId: string) => Promise<FavoriteGenerationRecord | null>;
  updateFavorite: (generationId: string, nextValue: boolean) => Promise<boolean>;
};

export type FavoriteGenerationResult = { status: "success"; isFavorite: boolean } | { status: "error" };

export function isMissingFavoriteColumnError(error: { code?: string; message?: string } | null) {
  return Boolean(error && (
    error.code === "42703" ||
    (error.message?.includes("is_favorite") && error.message.includes("does not exist"))
  ));
}

export function canFavoriteGeneration(generation: FavoriteGenerationRecord) {
  return generation.status === "succeeded" && Boolean(generation.outputBucketId && generation.outputObjectPath);
}

export async function updateGenerationFavorite(
  repository: FavoriteGenerationRepository,
  input: { userId: string; generationId: string; nextValue: boolean },
): Promise<FavoriteGenerationResult> {
  const generation = await repository.findGeneration(input.generationId);
  if (!generation || generation.ownerId !== input.userId || !canFavoriteGeneration(generation)) {
    return { status: "error" };
  }

  const updated = await repository.updateFavorite(generation.id, input.nextValue);
  return updated ? { status: "success", isFavorite: input.nextValue } : { status: "error" };
}

export function filterFavoriteGenerations<T extends { status: string; previewUrl: string | null; isFavorite: boolean }>(
  items: T[],
  filter: "all" | "favorites",
) {
  return filter === "favorites"
    ? items.filter((item) => item.isFavorite && item.status === "succeeded" && Boolean(item.previewUrl))
    : items;
}
