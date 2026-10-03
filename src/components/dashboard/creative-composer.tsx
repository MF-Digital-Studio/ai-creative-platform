"use client";

import { type ChangeEvent, type DragEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { createWorkspaceProject } from "@/app/[locale]/dashboard/actions";
import { DASHBOARD_PRESET_EVENT } from "@/components/dashboard/creative-preset-rail";
import {
  createQueuedImageGeneration,
  registerProductAsset,
  registerReferenceAsset,
  runQueuedImageGeneration,
  updateCreativeDirection,
} from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { GenerationProgressModal } from "@/components/projects/generation-progress-modal";
import {
  isSupportedProductImageType,
  MAX_PRODUCT_IMAGE_FILE_SIZE,
  productImageExtensions,
} from "@/components/projects/product-image-upload";
import { Button } from "@/components/ui/button";
import { DASHBOARD_DIRECTION_EVENT } from "@/data/dashboard-inspiration";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { canCreateImageWithPreset } from "@/lib/creative-presets/creative-preset-context";
import { getCreativePreset } from "@/lib/creative-presets/creative-presets";
import { createClient } from "@/lib/supabase/client";

type CreativeComposerProps = {
  locale: AppLocale;
  userId: string | null;
};

export function CreativeComposer({ locale, userId }: CreativeComposerProps) {
  const t = useTranslations("Dashboard.composer");
  const presetT = useTranslations("Dashboard.presets");
  const router = useRouter();
  const descriptionId = useId();
  const promptId = useId();
  const statusId = useId();
  const disabledHintId = useId();
  const productInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLElement>(null);
  const [prompt, setPrompt] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const referenceFilesRef = useRef(referenceFiles);
  const [generationState, setGenerationState] = useState<"idle" | "pending" | "failed">("idle");
  const isCreating = generationState === "pending";
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const selectedPreset = getCreativePreset(selectedPresetId);

  useEffect(() => {
    function handleDirection(event: Event) {
      if (event instanceof CustomEvent && typeof event.detail === "string") {
        setPrompt(event.detail);
        setStatusMessage("");
        promptRef.current?.focus();
      }
    }

    window.addEventListener(DASHBOARD_DIRECTION_EVENT, handleDirection);
    return () => window.removeEventListener(DASHBOARD_DIRECTION_EVENT, handleDirection);
  }, []);

  useEffect(() => {
    function handlePreset(event: Event) {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      if (event.detail === null) {
        setSelectedPresetId(null);
        setStatusMessage("");
        return;
      }

      const preset = getCreativePreset(event.detail);
      if (!preset) return;

      setSelectedPresetId(preset.id);
      setStatusMessage("");
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      promptRef.current?.focus({ preventScroll: true });
    }

    window.addEventListener(DASHBOARD_PRESET_EVENT, handlePreset);
    return () => window.removeEventListener(DASHBOARD_PRESET_EVENT, handlePreset);
  }, []);

  useEffect(() => {
    return () => {
      if (productPreviewUrl) {
        URL.revokeObjectURL(productPreviewUrl);
      }
    };
  }, [productPreviewUrl]);

  useEffect(() => {
    referenceFilesRef.current = referenceFiles;
  }, [referenceFiles]);

  useEffect(() => () => {
    referenceFilesRef.current.forEach((reference) => URL.revokeObjectURL(reference.previewUrl));
  }, []);

  function selectProduct(file: File) {
    if (!isSupportedProductImageType(file.type)) {
      setStatusMessage(t("invalidProductType"));
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
      setStatusMessage(t("productTooLarge"));
      return;
    }

    setProductFile(file);
    setProductPreviewUrl(URL.createObjectURL(file));
    setStatusMessage("");
  }

  function handleProductChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? []);
    if (file) {
      selectProduct(file);
    }
    event.target.value = "";
  }

  function handleProductDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const [file] = Array.from(event.dataTransfer.files);
    if (file) {
      selectProduct(file);
    }
  }

  function removeProduct() {
    setProductFile(null);
    setProductPreviewUrl(null);
    setStatusMessage("");
  }

  function selectReferences(files: File[]) {
    const availableSlots = 3 - referenceFilesRef.current.length;
    const accepted = files.slice(0, availableSlots).filter((file) => {
      if (!isSupportedProductImageType(file.type)) {
        setStatusMessage(t("invalidProductType"));
        return false;
      }
      if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
        setStatusMessage(t("productTooLarge"));
        return false;
      }
      return true;
    });
    if (!accepted.length) return;
    setReferenceFiles((current) => [
      ...current,
      ...accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    setStatusMessage(availableSlots < files.length ? t("referenceLimit") : "");
  }

  function removeReference(index: number) {
    setReferenceFiles((current) => {
      const reference = current[index];
      if (reference) URL.revokeObjectURL(reference.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
    setStatusMessage("");
  }

  async function startImageCreation() {
    const creativeDirection = prompt.trim();
    if (
      !userId ||
      !productFile ||
      (!creativeDirection && !selectedPreset) ||
      isCreating ||
      !isSupportedProductImageType(productFile.type)
    ) {
      return;
    }

    setGenerationState("pending");
    setStatusMessage(t("creating"));

    try {
      const project = await createWorkspaceProject(locale);
      if (!project.ok) {
        throw new Error("Unable to create a project.");
      }

      const extension = productImageExtensions[productFile.type];
      const objectPath = `${userId}/${project.projectId}/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("product-assets")
        .upload(objectPath, productFile, { contentType: productFile.type, upsert: false });
      if (uploadError) {
        throw uploadError;
      }

      const registration = await registerProductAsset(locale, project.projectId, objectPath);
      if (registration.status !== "success") {
        throw new Error("Unable to register the product asset.");
      }

      for (const reference of referenceFiles) {
        if (!isSupportedProductImageType(reference.file.type)) {
          throw new Error("Invalid reference image type.");
        }
        const referenceExtension = productImageExtensions[reference.file.type];
        const referencePath = `${userId}/${project.projectId}/reference-${crypto.randomUUID()}.${referenceExtension}`;
        const { error: referenceUploadError } = await supabase.storage
          .from("product-assets")
          .upload(referencePath, reference.file, { contentType: reference.file.type, upsert: false });
        if (referenceUploadError) throw referenceUploadError;

        const referenceRegistration = await registerReferenceAsset(locale, project.projectId, referencePath);
        if (referenceRegistration.status !== "success") {
          throw new Error("Unable to register the reference asset.");
        }
      }

      const directionFormData = new FormData();
      directionFormData.set("creative_direction", creativeDirection);
      const direction = await updateCreativeDirection(
        locale,
        project.projectId,
        { status: "idle" },
        directionFormData,
      );
      if (direction.status !== "success") {
        throw new Error("Unable to save the creative direction.");
      }

      const generationFormData = new FormData();
      generationFormData.set("enhance_with_ai", "on");
      if (selectedPreset) {
        generationFormData.set("preset_id", selectedPreset.id);
      }
      const generation = await createQueuedImageGeneration(
        locale,
        project.projectId,
        null,
        generationFormData,
      );
      if (!generation.ok) {
        throw new Error("Unable to queue the image generation.");
      }

      const result = await runQueuedImageGeneration(project.projectId, generation.generationId);
      if (!result.ok) {
        throw new Error("Unable to run the image generation.");
      }

      router.push(`/dashboard/projects/${project.projectId}`, { locale });
    } catch {
      setGenerationState("failed");
      setStatusMessage(t("creationError"));
      setGenerationState("idle");
    }
  }

  const canStartImageCreation = canCreateImageWithPreset(Boolean(productFile), prompt, selectedPreset) && !isCreating;

  return (
    <>
    <section
      ref={composerRef}
      id="composer"
      className="dashboard-composer-section"
      aria-labelledby="dashboard-composer-heading"
    >
      <div className="dashboard-composer-heading">
        <h1 id="dashboard-composer-heading">{t("heading")}</h1>
        <p id={descriptionId}>{t("description")}</p>
      </div>

      <form
        className="creative-composer"
        aria-describedby={descriptionId}
        onSubmit={(event) => {
          event.preventDefault();
          void startImageCreation();
        }}
      >
        <div className="creative-composer-body">
          <div className="creative-product-field">
            <span className="creative-field-label"><span className="creative-step-number">01</span>{t("productLabel")}</span>
            {productPreviewUrl ? (
              <div className="creative-selected-product">
                <span className="creative-selected-product-media">
                  {/* Local object URLs are used only before creation starts. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={productPreviewUrl} alt={t("selectedProductAlt")} />
                </span>
                <span className="creative-selected-product-copy">
                  <strong title={productFile?.name}>{productFile?.name}</strong>
                  <span>
                    <button type="button" onClick={() => productInputRef.current?.click()}>
                      {t("replaceProduct")}
                    </button>
                    <button type="button" onClick={removeProduct}>
                      {t("removeProduct")}
                    </button>
                  </span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="creative-product-upload"
                aria-describedby={statusId}
                onClick={() => productInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleProductDrop}
              >
                <span className="creative-product-upload-icon"><DashboardIcon name="plus" /></span>
                <span>{t("addProduct")}</span>
                <small>{t("productHelper")}</small>
              </button>
            )}
          </div>

          <input
            ref={productInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={t("addProduct")}
            onChange={handleProductChange}
          />

          <div className="creative-reference-field">
            <span className="creative-field-label"><span className="creative-step-number">02</span>{t("referenceLabel")}</span>
            <p>{t("referenceHelper")}</p>
            <div className="creative-reference-list" aria-live="polite">
              {referenceFiles.map((reference, index) => (
                <div key={reference.previewUrl} className="creative-reference-thumbnail">
                  {/* Local object URLs are used only before creation starts. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reference.previewUrl} alt={t("referencePreviewAlt", { index: index + 1 })} />
                  <button type="button" onClick={() => removeReference(index)} aria-label={t("removeReference", { index: index + 1 })}>
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              ))}
              {referenceFiles.length < 3 ? (
                <button type="button" className="creative-reference-add" onClick={() => referenceInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectReferences(Array.from(event.dataTransfer.files)); }}>
                  <DashboardIcon name="plus" />
                  <span>{t("addReference")}</span>
                </button>
              ) : null}
            </div>
            <span className="creative-reference-count">{t("referenceCount", { count: referenceFiles.length })}</span>
          </div>

          <input
            ref={referenceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            multiple
            aria-label={t("addReference")}
            onChange={(event) => {
              selectReferences(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />

          <div className="creative-prompt-field">
            <label htmlFor={promptId} className="creative-field-label">{t("promptLabel")}</label>
            <textarea
              ref={promptRef}
              id={promptId}
              value={prompt}
              placeholder={t("promptPlaceholder")}
              className="creative-prompt-textarea"
              onChange={(event) => setPrompt(event.target.value)}
            />
            {selectedPreset ? <p className="creative-prompt-helper">{t("selectedPreset", { title: presetT(`items.${selectedPreset.id}.title`) })}</p> : null}
          </div>
        </div>

        <div className="creative-composer-controls">
          <span className="creative-generate-label"><span className="creative-step-number">03</span>{t("generateStep")}</span>
          <Button
            type="submit"
            disabled={!canStartImageCreation}
            aria-busy={isCreating}
            aria-describedby={disabledHintId}
            className="creative-start-button"
          >
            <span>{isCreating ? t("creating") : t("createImage")}</span>
            <DashboardIcon name="arrow" className="creative-start-icon" />
          </Button>
        </div>

        <div className="creative-composer-feedback">
          <p id={statusId} role="status" aria-live="polite">{statusMessage}</p>
          <p id={disabledHintId} className="sr-only">{!canStartImageCreation && !isCreating ? t("startDisabledHint") : null}</p>
        </div>
      </form>
    </section>
    <GenerationProgressModal open={generationState === "pending"} title={t("progressTitle")} description={t("progressDescription")} statuses={[t("progressStatuses.preparing"), t("progressStatuses.scene"), t("progressStatuses.generating"), t("progressStatuses.finalizing")]} />
    </>
  );
}
