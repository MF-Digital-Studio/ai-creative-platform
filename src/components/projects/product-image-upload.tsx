"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { RegisterProductAssetResult } from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { createClient } from "@/lib/supabase/client";

export const MAX_PRODUCT_IMAGE_FILE_SIZE = 20 * 1024 * 1024;

export const productImageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type SupportedProductImageType = keyof typeof productImageExtensions;

type ProductImageUploadProps = {
  projectId: string;
  userId: string;
  registerAsset: (projectId: string, objectPath: string) => Promise<RegisterProductAssetResult>;
  initialAsset: {
    objectPath: string;
    signedUrl: string;
  } | null;
};

export function isSupportedProductImageType(fileType: string): fileType is SupportedProductImageType {
  return Object.prototype.hasOwnProperty.call(productImageExtensions, fileType);
}

export function ProductImageUpload({
  projectId,
  userId,
  initialAsset,
  registerAsset,
}: ProductImageUploadProps) {
  const t = useTranslations("Dashboard.project.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(initialAsset?.signedUrl ?? null);

  async function uploadFile(file: File) {
    if (isUploading) {
      return;
    }

    setError(null);
    if (!isSupportedProductImageType(file.type)) {
      setError(t("invalidType"));
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
      setError(t("tooLarge"));
      return;
    }

    setIsUploading(true);

    try {
      const extension = productImageExtensions[file.type];
      const path = `${userId}/${projectId}/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("product-assets").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }

      const registration = await registerAsset(projectId, path);
      if (registration.status !== "success") {
        setError(t("metadataError"));
        return;
      }

      const { data, error: signedUrlError } = await supabase.storage
        .from("product-assets")
        .createSignedUrl(path, 3600);

      if (signedUrlError || !data?.signedUrl) {
        throw signedUrlError ?? new Error("Signed URL could not be created.");
      }

      setSignedUrl(data.signedUrl);
    } catch {
      setError(t("uploadError"));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? []);
    if (file) {
      void uploadFile(file);
    }
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const [file] = Array.from(event.dataTransfer.files);
    if (file && !isUploading) {
      void uploadFile(file);
    }
  }

  return (
    <section aria-labelledby="product-image-heading" className="project-control-section">
      <div>
        <h3 id="product-image-heading" className="text-base font-semibold tracking-[-0.02em] text-[var(--dashboard-foreground)]">
          {t("heading")}
        </h3>
        {!signedUrl ? <p className="mt-1 text-sm leading-6 text-[var(--dashboard-muted)]">{t("description")}</p> : null}
      </div>

      <label
        className={`project-product-picker ${signedUrl ? "has-product" : ""} ${
          isDragging
            ? "border-[var(--accent)] bg-[var(--dashboard-surface-raised)]"
            : "border-[var(--dashboard-border-strong)] bg-[var(--dashboard-background)]"
        } ${isUploading ? "cursor-wait opacity-65" : "hover:border-[var(--dashboard-foreground)]"}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        aria-disabled={isUploading}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={isUploading}
          onChange={handleFileChange}
        />
        {signedUrl ? <span className="project-product-selected">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signedUrl} alt={t("previewAlt")} />
          <span><strong>{t("success")}</strong><small>{isUploading ? t("uploading") : t("replace")}</small></span>
        </span> : <span className="grid justify-items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-raised)] text-[var(--dashboard-foreground)]" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5">
              <path d="M12 16V4m0 0-4 4m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-medium text-[var(--dashboard-foreground)]">
            {isUploading ? t("uploading") : t("dropzone")}
          </span>
          <span className="text-xs text-[var(--dashboard-muted)]">{t("helper")}</span>
        </span>}
      </label>

      {error ? <p role="alert" className="text-sm text-[var(--dashboard-foreground)]">{error}</p> : null}
    </section>
  );
}
