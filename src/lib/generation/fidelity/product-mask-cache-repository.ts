import "server-only";

import sharp from "sharp";

import type { ProductMaskCache } from "./product-mask-resolver";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const productAssetsBucket = "product-assets";
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

type ProductMaskCacheRepositoryOptions = {
  model: string;
  pipelineVersion: number;
  projectId: string;
  provider: string;
  sourceAssetId: string;
  userId: string;
};

type CachedMaskAsset = {
  bucket_id: string;
  object_path: string;
};

type SupabaseFailure = {
  code?: string;
  status?: number;
};

function requireIdentityPart(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`Product mask ${label} is required.`);
  }

  return normalized;
}

function requirePathSegment(value: string, label: string) {
  const normalized = requireIdentityPart(value, label);

  if (normalized.includes("/")) {
    throw new Error(`Product mask ${label} must be a single path segment.`);
  }

  return normalized;
}

function safeFilePart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isUniqueConflict(error: SupabaseFailure | null) {
  return error?.code === "23505" || error?.status === 409;
}

async function assertPngMask(mask: Buffer) {
  if (mask.length < pngSignature.length || !mask.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error("Product mask must be a valid PNG.");
  }

  try {
    const metadata = await sharp(mask, { limitInputPixels: 24_000_000 }).metadata();
    if (metadata.format !== "png" || !metadata.width || !metadata.height) {
      throw new Error("Product mask must be a valid PNG.");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Product mask must be a valid PNG.") {
      throw error;
    }

    throw new Error("Product mask must be a valid PNG.", { cause: error });
  }
}

export function buildProductMaskDerivationKey(
  provider: string,
  model: string,
  pipelineVersion: number,
) {
  const normalizedProvider = requireIdentityPart(provider, "provider");
  const normalizedModel = requireIdentityPart(model, "model");

  if (!Number.isSafeInteger(pipelineVersion) || pipelineVersion < 1) {
    throw new Error("Product mask pipeline version must be a positive integer.");
  }

  return `${normalizedProvider}:${normalizedModel}:v${pipelineVersion}`;
}

export class ProductMaskCacheRepository implements ProductMaskCache {
  private readonly derivationKey: string;
  private readonly objectPath: string;

  constructor(private readonly options: ProductMaskCacheRepositoryOptions) {
    const provider = requireIdentityPart(options.provider, "provider");
    const model = requireIdentityPart(options.model, "model");
    const sourceAssetId = requirePathSegment(options.sourceAssetId, "source asset id");
    const userId = requirePathSegment(options.userId, "user id");
    const projectId = requirePathSegment(options.projectId, "project id");
    const safeProvider = safeFilePart(provider);
    const safeModel = safeFilePart(model);

    if (!safeProvider || !safeModel) {
      throw new Error("Product mask cache identity contains unsupported characters.");
    }

    this.derivationKey = buildProductMaskDerivationKey(provider, model, options.pipelineVersion);
    this.objectPath = `${userId}/${projectId}/mask-${sourceAssetId}-${safeProvider}-${safeModel}-v${options.pipelineVersion}.png`;
  }

  async find() {
    return this.findCompatibleMask();
  }

  async save(mask: Buffer) {
    await this.saveMask(mask);
  }

  async findCompatibleMask(): Promise<Buffer | null> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("assets")
      .select("bucket_id, object_path")
      .eq("asset_type", "product_mask")
      .eq("derived_from_asset_id", this.options.sourceAssetId)
      .eq("derivation_key", this.derivationKey)
      .maybeSingle();

    if (error) {
      throw new Error("Unable to find a compatible product mask.", { cause: error });
    }

    if (!data) {
      return null;
    }

    const asset = data as CachedMaskAsset;
    if (asset.bucket_id !== productAssetsBucket) {
      throw new Error("Cached product mask has an invalid storage location.");
    }

    const { data: blob, error: downloadError } = await admin.storage
      .from(asset.bucket_id)
      .download(asset.object_path);

    if (downloadError || !blob) {
      throw new Error("Unable to download the cached product mask.", { cause: downloadError });
    }

    return Buffer.from(await blob.arrayBuffer());
  }

  async saveMask(mask: Buffer): Promise<Buffer> {
    await assertPngMask(mask);

    const compatibleMask = await this.findCompatibleMask();
    if (compatibleMask) {
      return compatibleMask;
    }

    const admin = getSupabaseAdminClient();
    const { error: uploadError } = await admin.storage
      .from(productAssetsBucket)
      .upload(this.objectPath, mask, {
        cacheControl: "31536000",
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Unable to upload the product mask.", { cause: uploadError });
    }

    const { error: insertError } = await admin.from("assets").insert({
      asset_type: "product_mask",
      bucket_id: productAssetsBucket,
      derivation_key: this.derivationKey,
      derivation_metadata: {
        model: this.options.model.trim(),
        pipeline_version: this.options.pipelineVersion,
        provider: this.options.provider.trim(),
      },
      derived_from_asset_id: this.options.sourceAssetId,
      object_path: this.objectPath,
      project_id: this.options.projectId,
      user_id: this.options.userId,
    });

    if (!insertError) {
      return mask;
    }

    if (isUniqueConflict(insertError)) {
      const winningMask = await this.findCompatibleMask();
      if (winningMask) {
        return winningMask;
      }
    } else {
      try {
        await admin.storage.from(productAssetsBucket).remove([this.objectPath]);
      } catch {
        // The database failure remains the primary error when best-effort cleanup fails.
      }
    }

    throw new Error("Unable to save the product mask.", { cause: insertError });
  }
}
