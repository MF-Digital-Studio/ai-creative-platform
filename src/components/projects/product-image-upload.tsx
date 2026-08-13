"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { RegisterProductAssetResult } from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const fileExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type SupportedFileType = keyof typeof fileExtensions;

type ProductImageUploadProps = {
  projectId: string;
  userId: string;
  registerAsset: (projectId: string, objectPath: string) => Promise<RegisterProductAssetResult>;
  initialAsset: {
    objectPath: string;
    signedUrl: string;
  } | null;
};

function isSupportedFileType(fileType: string): fileType is SupportedFileType {
  return Object.prototype.hasOwnProperty.call(fileExtensions, fileType);
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
    if (!isSupportedFileType(file.type)) {
      setError(t("invalidType"));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t("tooLarge"));
      return;
    }

    setIsUploading(true);

    try {
      const extension = fileExtensions[file.type];
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
    <section aria-labelledby="product-image-heading" className="grid gap-4">
      <div>
        <h3 id="product-image-heading" className="text-base font-semibold tracking-[-0.02em] text-[var(--dashboard-foreground)]">
          {t("heading")}
        </h3>
        <p className="mt-1 text-sm leading-6 text-[var(--dashboard-muted)]">{t("description")}</p>
      </div>

      <label
        className={`grid min-h-40 cursor-pointer place-items-center rounded-[var(--radius-sm)] border border-dashed p-5 text-center transition-colors duration-(--transition-fast) focus-within:border-[var(--dashboard-focus)] focus-within:ring-2 focus-within:ring-[var(--dashboard-focus)] ${
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
        <span className="grid justify-items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-raised)] text-[var(--dashboard-foreground)]" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5">
              <path d="M12 16V4m0 0-4 4m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-medium text-[var(--dashboard-foreground)]">
            {isUploading ? t("uploading") : t("dropzone")}
          </span>
          <span className="text-xs text-[var(--dashboard-muted)]">{t("helper")}</span>
        </span>
      </label>

      <div aria-live="polite" role="status">
        {signedUrl ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--dashboard-border)] bg-[var(--dashboard-background)] p-3">
            {/* Signed Storage URLs are intentionally loaded directly, without Next's image optimizer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signedUrl} alt={t("previewAlt")} className="size-14 rounded-[var(--radius-sm)] object-cover" />
            <p className="text-sm font-medium text-[var(--dashboard-foreground)]">{t("success")}</p>
          </div>
        ) : null}
      </div>

      {error ? <p role="alert" className="text-sm text-[var(--dashboard-foreground)]">{error}</p> : null}
    </section>
  );
}
