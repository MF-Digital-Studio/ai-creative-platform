"use client";

import { type ChangeEvent, type DragEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { createWorkspaceProject } from "@/app/[locale]/dashboard/actions";
import { DASHBOARD_PRESET_EVENT } from "@/components/dashboard/creative-preset-rail";
import {
  registerProductAsset,
  registerReferenceAsset,
  updateCreativeDirection,
} from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { createQueuedImageGeneration } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { GenerationProgressModal } from "@/components/projects/generation-progress-modal";
import { GenerationStatusIndicator, type GenerationState } from "@/components/projects/generation-status-indicator";
import {
  isSupportedProductImageType,
  MAX_PRODUCT_IMAGE_FILE_SIZE,
  productImageExtensions,
} from "@/components/projects/product-image-upload";
import { Button } from "@/components/ui/button";
import { AspectRatioPicker } from "@/components/projects/aspect-ratio-picker";
import { DEFAULT_GENERATION_ASPECT_RATIO } from "@/lib/generation/aspect-ratios";
import type { GenerationAspectRatio } from "@/lib/generation/types";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { canCreateImageWithPreset } from "@/lib/creative-presets/creative-preset-context";
import { getCreativePreset, getPresetFamily } from "@/lib/creative-presets/creative-presets";
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
  const projectNameId = useId();
  const statusId = useId();
  const disabledHintId = useId();
  const productErrorId = useId();
  const referenceErrorId = useId();
  const productInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLElement>(null);
  const submissionLockRef = useRef(false);
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [productError, setProductError] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [isProductDragging, setIsProductDragging] = useState(false);
  const [isReferenceDragging, setIsReferenceDragging] = useState(false);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const referenceFilesRef = useRef(referenceFiles);
  const [generationState, setGenerationState] = useState<"idle" | "pending">("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [statusState, setStatusState] = useState<GenerationState>("idle");
  const isCreating = generationState === "pending";
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<GenerationAspectRatio>(DEFAULT_GENERATION_ASPECT_RATIO);
  const selectedPreset = getCreativePreset(selectedPresetId);

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
      setProductError(t("invalidProductType"));
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
      setProductError(t("productTooLarge"));
      return;
    }

    if (productPreviewUrl) URL.revokeObjectURL(productPreviewUrl);
    setProductFile(file);
    setProductPreviewUrl(URL.createObjectURL(file));
    setProductError("");
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
    setIsProductDragging(false);
    const [file] = Array.from(event.dataTransfer.files);
    if (file) {
      selectProduct(file);
    }
  }

  function removeProduct() {
    if (productPreviewUrl) URL.revokeObjectURL(productPreviewUrl);
    setProductFile(null);
    setProductPreviewUrl(null);
    setProductError("");
    setStatusMessage("");
  }

  function selectReferences(files: File[]) {
    setReferenceError("");
    const availableSlots = 3 - referenceFilesRef.current.length;
    const accepted = files.slice(0, availableSlots).filter((file) => {
      if (!isSupportedProductImageType(file.type)) {
        setReferenceError(t("invalidProductType"));
        return false;
      }
      if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
        setReferenceError(t("productTooLarge"));
        return false;
      }
      return true;
    });
    if (!accepted.length) {
      if (availableSlots < files.length) setReferenceError(t("referenceLimit"));
      return;
    }
    setReferenceFiles((current) => [
      ...current,
      ...accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    setReferenceError(availableSlots < files.length ? t("referenceLimit") : "");
  }

  function removeReference(index: number) {
    setReferenceFiles((current) => {
      const reference = current[index];
      if (reference) URL.revokeObjectURL(reference.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
    setReferenceError("");
  }

  async function startImageCreation() {
    const creativeDirection = prompt.trim();
    if (
      !userId ||
      !productFile ||
      (!creativeDirection && !selectedPreset) ||
      isCreating ||
      !isSupportedProductImageType(productFile.type) ||
      submissionLockRef.current
    ) {
      return;
    }

    submissionLockRef.current = true;
    setGenerationState("pending");
    setStatusState("processing"); setModalOpen(true);
    setProductError("");
    setReferenceError("");
    setStatusMessage(t("creating"));

    let activePhase: "setup" | "productUpload" | "productAnalysis" | "referenceUpload" | "generation" = "setup";

    try {
      const project = await createWorkspaceProject(locale, projectName.trim());
      if (!project.ok) {
        throw new Error("Unable to create a project.");
      }

      const extension = productImageExtensions[productFile.type];
      const objectPath = `${userId}/${project.projectId}/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      activePhase = "productUpload";
      setStatusMessage(t("productUploading"));
      const { error: uploadError } = await supabase.storage
        .from("product-assets")
        .upload(objectPath, productFile, { contentType: productFile.type, upsert: false });
      if (uploadError) {
        throw uploadError;
      }

      activePhase = "productAnalysis";
      setStatusMessage(t("productAnalyzing"));
      const registration = await registerProductAsset(locale, project.projectId, objectPath);
      if (registration.status !== "success") {
        throw new Error("Unable to register the product asset.");
      }

      for (const reference of referenceFiles) {
        activePhase = "referenceUpload";
        setStatusMessage(t("referenceUploading"));
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

      activePhase = "generation";
      setStatusMessage(t("creating"));
      const generationFormData = new FormData();
      generationFormData.set("enhance_with_ai", "on");
      generationFormData.set("aspect_ratio", aspectRatio);
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
      setStatusState("succeeded"); setModalOpen(false);
      window.setTimeout(() => setStatusState((current) => current === "succeeded" ? "idle" : current), 7000);
      router.push(`/dashboard/projects/${project.projectId}`, { locale });
    } catch {
      if (activePhase === "productUpload" || activePhase === "productAnalysis") setProductError(t("productUploadFailed"));
      else if (activePhase === "referenceUpload") setReferenceError(t("referenceUploadFailed"));
      else setStatusMessage(t("creationError"));
      setGenerationState("idle");
      setStatusState("failed");
      submissionLockRef.current = false;
    }
  }

  const canStartImageCreation = canCreateImageWithPreset(Boolean(productFile), prompt, selectedPreset) && Boolean(userId) && !isCreating;
  const disabledReason = !userId ? t("signInRequired") : !productFile ? t("productRequired") : !prompt.trim() && !selectedPreset ? t("directionRequired") : "";

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
          <div className="creative-project-name-field creative-prompt-field">
            <label htmlFor={projectNameId} className="creative-field-label">{t("projectNameLabel")}</label>
            <input id={projectNameId} value={projectName} maxLength={120} placeholder={t("projectNamePlaceholder")} className="creative-project-name-input" onChange={(event) => setProjectName(event.target.value)} />
          </div>
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
                  <small className="creative-product-ready">{t("productReady")}</small>
                  <span>
                    <button type="button" onClick={() => productInputRef.current?.click()} disabled={isCreating} aria-describedby={productError ? productErrorId : undefined}>
                      {t("replaceProduct")}
                    </button>
                    <button type="button" onClick={removeProduct} disabled={isCreating}>
                      {t("removeProduct")}
                    </button>
                  </span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                className={`creative-product-upload${isProductDragging ? " is-dragging" : ""}`}
                aria-describedby={`${statusId} ${productError ? productErrorId : ""}`.trim()}
                onClick={() => productInputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setIsProductDragging(true); }}
                onDragLeave={() => setIsProductDragging(false)}
                onDrop={handleProductDrop}
                disabled={isCreating}
              >
                <span className="creative-product-upload-icon"><DashboardIcon name="plus" /></span>
                <span>{t("addProduct")}</span>
                <small>{t("productHelper")}</small>
              </button>
            )}
            {productError ? <p id={productErrorId} className="creative-field-error" role="alert">{productError}</p> : null}
          </div>

          <div className="creative-reference-field">
            <span className="creative-field-label"><span className="creative-step-number">02</span>{t("referenceLabel")}</span>
            <p>{t("referenceHelper")}</p>
            <div className="creative-reference-list" aria-live="polite">
              {referenceFiles.map((reference, index) => (
                <div key={reference.previewUrl} className="creative-reference-thumbnail">
                  {/* Local object URLs are used only before creation starts. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reference.previewUrl} alt={t("referencePreviewAlt", { index: index + 1 })} />
                  <span className="creative-reference-role">{index === 0 ? t("primaryReference") : t("supportingReference")}</span>
                  <button type="button" onClick={() => removeReference(index)} aria-label={t("removeReference", { index: index + 1 })} disabled={isCreating}>
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              ))}
              <button type="button" className={`creative-reference-add${isReferenceDragging ? " is-dragging" : ""}`} onClick={() => referenceInputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsReferenceDragging(true); }} onDragLeave={() => setIsReferenceDragging(false)} onDrop={(event) => { event.preventDefault(); setIsReferenceDragging(false); selectReferences(Array.from(event.dataTransfer.files)); }} disabled={referenceFiles.length >= 3 || isCreating} aria-describedby={referenceError ? referenceErrorId : undefined}>
                <DashboardIcon name="plus" />
                <span>{t("addReference")}</span>
              </button>
            </div>
            <span className="creative-reference-count" aria-live="polite">{t("referenceCount", { count: referenceFiles.length })}</span>
            {referenceError ? <p id={referenceErrorId} className="creative-field-error" role="alert">{referenceError}</p> : null}
          </div>

          <input
            ref={productInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={t("addProduct")}
            disabled={isCreating}
            onChange={handleProductChange}
          />
          <input
            ref={referenceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            multiple
            aria-label={t("addReference")}
            disabled={referenceFiles.length >= 3 || isCreating}
            onChange={(event) => {
              selectReferences(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <div className="creative-prompt-field creative-direction-field">
            <label htmlFor={promptId} className="creative-field-label">{t("promptLabel")}</label>
            <textarea
              ref={promptRef}
              id={promptId}
              value={prompt}
              placeholder={t("promptPlaceholder")}
              className="creative-prompt-textarea"
              onChange={(event) => setPrompt(event.target.value)}
            />
            {selectedPreset ? <p className="creative-prompt-helper">{t("selectedPreset", { title: getPresetFamily(selectedPreset.id)?.title[locale] ?? presetT(`items.${selectedPreset.id}.title`) })}</p> : null}
          </div>



          <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={isCreating} messages={{
            label: t("aspectRatio.label"), helper: t("aspectRatio.helper"),
            names: { widescreen: t("aspectRatio.names.widescreen"), vertical: t("aspectRatio.names.vertical"), square: t("aspectRatio.names.square"), classic: t("aspectRatio.names.classic"), tall: t("aspectRatio.names.tall"), cinemascope: t("aspectRatio.names.cinemascope") },
            descriptions: { widescreenUse: t("aspectRatio.descriptions.widescreenUse"), verticalUse: t("aspectRatio.descriptions.verticalUse"), squareUse: t("aspectRatio.descriptions.squareUse"), classicUse: t("aspectRatio.descriptions.classicUse"), tallUse: t("aspectRatio.descriptions.tallUse"), cinemascopeUse: t("aspectRatio.descriptions.cinemascopeUse") },
          }} />


        </div>

        <div className="creative-composer-controls">
          <span className="creative-generate-label"><span className="creative-step-number">03</span>{t("generateStep")}</span>
          <Button
            type="submit"
            variant="dark"
            disabled={!canStartImageCreation}
            aria-busy={isCreating}
            aria-describedby={disabledHintId}
            className="creative-start-button"
          >
            <span>{isCreating ? t("creating") : t("createImage")}</span>
            <DashboardIcon name="arrow" className="creative-start-icon" />
          </Button>
          <p id={disabledHintId} className={!canStartImageCreation && !isCreating ? "creative-disabled-reason" : "sr-only"}>{!canStartImageCreation && !isCreating ? disabledReason || t("startDisabledHint") : ""}</p>
        </div>

        <div className="creative-composer-feedback">
          <p id={statusId} role="status" aria-live="polite">{statusMessage}</p>
        </div>
      </form>
    </section>
    <GenerationStatusIndicator status={statusState} label={statusState === "failed" ? t("failedStatus") : statusState === "succeeded" ? t("successStatus") : t("activeStatus")} onClick={() => setModalOpen(true)} />
    <GenerationProgressModal open={modalOpen && generationState === "pending"} onClose={() => setModalOpen(false)} closeLabel={t("closeProgress")} title={t("progressTitle")} description={t("progressDescription")} statuses={[t("progressStatuses.preparing"), t("progressStatuses.scene"), t("progressStatuses.generating"), t("progressStatuses.finalizing")]} />
    </>
  );
}
