"use client";

import { type ChangeEvent, type DragEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { createWorkspaceProject } from "@/app/[locale]/dashboard/actions";
import { DASHBOARD_PRESET_EVENT, type DashboardPresetSelection } from "@/components/dashboard/creative-preset-rail";
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
import { MAX_PROJECT_PRODUCT_IMAGES } from "@/lib/assets/product-asset-constraints";

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
  const [productFiles, setProductFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const productFilesRef = useRef(productFiles);
  const [referenceFiles, setReferenceFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const referenceFilesRef = useRef(referenceFiles);
  const [generationState, setGenerationState] = useState<"idle" | "pending">("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [statusState, setStatusState] = useState<GenerationState>("idle");
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const isCreating = generationState === "pending";
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedPresentationMode, setSelectedPresentationMode] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<GenerationAspectRatio>(DEFAULT_GENERATION_ASPECT_RATIO);
  const selectedPreset = getCreativePreset(selectedPresetId);

  useEffect(() => {
    function handlePreset(event: Event) {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const selection = event.detail as DashboardPresetSelection | null;
      if (!selection || selection.presetId === null) {
        setSelectedPresetId(null);
        setSelectedPresentationMode(null);
        setStatusMessage("");
        return;
      }

      const preset = getCreativePreset(selection.presetId);
      if (!preset) return;

      setSelectedPresetId(preset.id);
      setSelectedPresentationMode(selection.presentationMode);
      setStatusMessage("");
      setAdditionalOpen(true);
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.requestAnimationFrame(() => promptRef.current?.focus({ preventScroll: true }));
    }

    window.addEventListener(DASHBOARD_PRESET_EVENT, handlePreset);
    return () => window.removeEventListener(DASHBOARD_PRESET_EVENT, handlePreset);
  }, []);

  useEffect(() => { productFilesRef.current = productFiles; }, [productFiles]);
  useEffect(() => () => { productFilesRef.current.forEach((product) => URL.revokeObjectURL(product.previewUrl)); }, []);

  useEffect(() => {
    referenceFilesRef.current = referenceFiles;
  }, [referenceFiles]);

  useEffect(() => () => {
    referenceFilesRef.current.forEach((reference) => URL.revokeObjectURL(reference.previewUrl));
  }, []);

  function selectProducts(files: File[]) {
    const available = MAX_PROJECT_PRODUCT_IMAGES - productFilesRef.current.length;
    if (files.length > available) { setProductError(t("productLimit")); return; }
    if (files.some((file) => !isSupportedProductImageType(file.type))) { setProductError(t("invalidProductType")); return; }
    if (files.some((file) => file.size > MAX_PRODUCT_IMAGE_FILE_SIZE)) { setProductError(t("productTooLarge")); return; }
    setProductFiles((current) => [...current, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
    setProductError(""); setStatusMessage("");
  }

  function handleProductChange(event: ChangeEvent<HTMLInputElement>) {
    selectProducts(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleProductDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsProductDragging(false);
    selectProducts(Array.from(event.dataTransfer.files));
  }

  function removeProduct(index: number) {
    setProductFiles((current) => { const target = current[index]; if (target) URL.revokeObjectURL(target.previewUrl); return current.filter((_, itemIndex) => itemIndex !== index); });
    setProductError(""); setStatusMessage("");
  }

  function makeProductPrimary(index: number) {
    if (index === 0) return;
    setProductFiles((current) => { const selected = current[index]; return selected ? [selected, ...current.filter((_, itemIndex) => itemIndex !== index)] : current; });
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (index < 1 || nextIndex < 1 || nextIndex >= productFiles.length) return;
    setProductFiles((current) => { const next = [...current]; [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!]; return next; });
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
      !productFiles.length ||
      (!creativeDirection && !selectedPreset) ||
      isCreating ||
      productFiles.some(({ file }) => !isSupportedProductImageType(file.type)) ||
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

      const supabase = createClient();
      activePhase = "productUpload";
      setStatusMessage(t("productUploading"));
      for (const { file } of productFiles) {
        const extension = productImageExtensions[file.type as keyof typeof productImageExtensions];
        const objectPath = `${userId}/${project.projectId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("product-assets").upload(objectPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        activePhase = "productAnalysis";
        setStatusMessage(t("productAnalyzing"));
        const registration = await registerProductAsset(locale, project.projectId, objectPath);
        if (registration.status !== "success") throw new Error("Unable to register the product asset.");
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
      if (selectedPresentationMode) generationFormData.set("presentation_mode", selectedPresentationMode);
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

  const canStartImageCreation = canCreateImageWithPreset(productFiles.length > 0, prompt, selectedPreset) && Boolean(userId) && !isCreating;
  const disabledReason = !userId ? t("signInRequired") : !productFiles.length ? t("productRequired") : !prompt.trim() && !selectedPreset ? t("directionRequired") : "";

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

      <div className="creative-output-picker" role="radiogroup" aria-label={t("outputType.label")}>
        <button type="button" className="creative-output-option is-selected" role="radio" aria-checked="true">
          <span className="creative-output-icon"><DashboardIcon name="image" /></span>
          <span className="creative-output-copy"><strong>{t("outputType.image.title")}</strong><small>{t("outputType.image.description")}</small></span>
          <span className="creative-output-check" aria-hidden="true">✓</span>
        </button>
        <button type="button" className="creative-output-option is-locked" role="radio" aria-checked="false" disabled aria-describedby="creative-video-availability">
          <span className="creative-output-icon"><DashboardIcon name="video" /></span>
          <span className="creative-output-copy"><strong>{t("outputType.video.title")}</strong><small>{t("outputType.video.description")}</small></span>
          <span className="creative-output-lock" id="creative-video-availability"><DashboardIcon name="lock" />{t("outputType.video.badge")}</span>
        </button>
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
          <section className="creative-workspace-step creative-product-step" aria-labelledby="creative-product-step-title">
            <header className="creative-step-heading">
              <span className="creative-step-number" aria-hidden="true">01</span>
              <span><h2 id="creative-product-step-title">{t("steps.product.title")}</h2><p>{t("steps.product.description")}</p></span>
            </header>
            <div className="creative-product-field">
              <div className="creative-upload-content">
              {productFiles.length ? (
                <div className="project-product-grid creative-product-grid" aria-live="polite">
                  {productFiles.map((product, index) => <article className="project-product-card" key={product.previewUrl}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.previewUrl} alt={t("productPreviewAlt", { index: index + 1 })} />
                    <span className="project-product-role">{index === 0 ? t("primaryProduct") : t("supportingProduct")}</span>
                    <div className="project-product-actions">
                      {index > 0 ? <button type="button" onClick={() => makeProductPrimary(index)} disabled={isCreating}>{t("setPrimaryProduct")}</button> : null}
                      {index > 1 ? <button type="button" aria-label={t("moveProductEarlier", { index: index + 1 })} onClick={() => moveProduct(index, -1)} disabled={isCreating}>↑</button> : null}
                      {index > 0 && index < productFiles.length - 1 ? <button type="button" aria-label={t("moveProductLater", { index: index + 1 })} onClick={() => moveProduct(index, 1)} disabled={isCreating}>↓</button> : null}
                      <button type="button" aria-label={t("removeProductView", { index: index + 1 })} onClick={() => removeProduct(index)} disabled={isCreating}>×</button>
                    </div>
                  </article>)}
                  {productFiles.length < MAX_PROJECT_PRODUCT_IMAGES ? <button type="button" className="project-product-add" onClick={() => productInputRef.current?.click()} disabled={isCreating}><DashboardIcon name="plus" /><strong>{t("addProductView")}</strong></button> : null}
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
                  <strong>{t("dropzone.title")}</strong>
                  <span className="creative-dropzone-secondary">{t("dropzone.secondary")}</span>
                  <span className="creative-dropzone-action">{t("dropzone.action")}</span>
                  <small>{t("dropzone.formats")}</small>
                </button>
              )}
              </div>
              <div className="creative-panel-footer">
                {productError ? <p id={productErrorId} className="creative-field-error" role="alert">{productError}</p> : <p>{productFiles.length ? t("productCount", { count: productFiles.length }) : t("productMultiViewHelper")}</p>}
              </div>
            </div>
          </section>

          <input
            ref={productInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={t("addProduct")}
            multiple
            disabled={isCreating || productFiles.length >= MAX_PROJECT_PRODUCT_IMAGES}
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
          <section className="creative-workspace-step creative-format-step" aria-labelledby="creative-format-step-title">
            <header className="creative-step-heading">
              <span className="creative-step-number" aria-hidden="true">02</span>
              <span><h2 id="creative-format-step-title">{t("steps.format.title")}</h2><p>{t("steps.format.description")}</p></span>
            </header>
            <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={isCreating} messages={{
              label: t("aspectRatio.label"), helper: t("aspectRatio.helper"),
              names: { widescreen: t("aspectRatio.names.widescreen"), vertical: t("aspectRatio.names.vertical"), square: t("aspectRatio.names.square"), classic: t("aspectRatio.names.classic"), tall: t("aspectRatio.names.tall"), cinemascope: t("aspectRatio.names.cinemascope") },
              descriptions: { widescreenUse: t("aspectRatio.descriptions.widescreenUse"), verticalUse: t("aspectRatio.descriptions.verticalUse"), squareUse: t("aspectRatio.descriptions.squareUse"), classicUse: t("aspectRatio.descriptions.classicUse"), tallUse: t("aspectRatio.descriptions.tallUse"), cinemascopeUse: t("aspectRatio.descriptions.cinemascopeUse") },
            }} />
          </section>

          <section className="creative-workspace-step creative-project-step" aria-labelledby="creative-project-step-title">
            <header className="creative-step-heading">
              <span className="creative-step-number" aria-hidden="true">03</span>
              <span><h2 id="creative-project-step-title">{t("steps.project.title")}</h2><p>{t("steps.project.description")}</p></span>
            </header>
            <div className="creative-project-name-field creative-prompt-field">
              <label htmlFor={projectNameId} className="sr-only">{t("projectNameLabel")}</label>
              <input id={projectNameId} value={projectName} maxLength={120} placeholder={t("projectNamePlaceholder")} className="creative-project-name-input" onChange={(event) => setProjectName(event.target.value)} />
            </div>
          </section>

          <section className="creative-workspace-step creative-additional-step" aria-labelledby="creative-additional-step-title">
            <button
              type="button"
              className="creative-additional-trigger"
              aria-expanded={additionalOpen}
              aria-controls="creative-optional-controls"
              onClick={() => setAdditionalOpen((current) => !current)}
            >
              <span className="creative-step-number" aria-hidden="true">04</span>
              <span><span id="creative-additional-step-title" className="creative-step-title">{t("steps.additional.title")}</span><span className="creative-step-description">{t("steps.additional.description")}</span></span>
              <DashboardIcon name="chevron" className="creative-additional-chevron" />
            </button>
            <div id="creative-optional-controls" className="creative-optional-controls" hidden={!additionalOpen}>
              <div className="creative-prompt-field creative-direction-field">
                <label htmlFor={promptId} className="creative-field-label">{t("promptLabel")}</label>
                <textarea ref={promptRef} id={promptId} value={prompt} placeholder={t("promptPlaceholder")} className="creative-prompt-textarea" onChange={(event) => setPrompt(event.target.value)} />
                {selectedPreset ? <p className="creative-prompt-helper">{t("selectedPreset", { title: getPresetFamily(selectedPreset.id)?.title[locale] ?? presetT(`items.${selectedPreset.id}.title`) })}</p> : null}
              </div>

              <div className="creative-reference-field">
                <span className="creative-field-label">{t("referenceLabel")}</span>
                <div className="creative-upload-content">
                  <div className="creative-reference-list" aria-live="polite">
                  {referenceFiles.map((reference, index) => (
                    <div key={reference.previewUrl} className="creative-reference-thumbnail">
                      {/* Local object URLs are used only before creation starts. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={reference.previewUrl} alt={t("referencePreviewAlt", { index: index + 1 })} />
                      <span className="creative-reference-role">{index === 0 ? t("primaryReference") : t("supportingReference")}</span>
                      <button type="button" onClick={() => removeReference(index)} aria-label={t("removeReference", { index: index + 1 })} disabled={isCreating}><span aria-hidden="true">×</span></button>
                    </div>
                  ))}
                  <button type="button" className={`creative-reference-add${isReferenceDragging ? " is-dragging" : ""}`} onClick={() => referenceInputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsReferenceDragging(true); }} onDragLeave={() => setIsReferenceDragging(false)} onDrop={(event) => { event.preventDefault(); setIsReferenceDragging(false); selectReferences(Array.from(event.dataTransfer.files)); }} disabled={referenceFiles.length >= 3 || isCreating} aria-describedby={referenceError ? referenceErrorId : undefined}>
                    <DashboardIcon name="plus" /><span>{t("addReference")}</span>
                  </button>
                  </div>
                </div>
                <div className="creative-panel-footer">
                  {referenceError ? <p id={referenceErrorId} className="creative-field-error" role="alert">{referenceError}</p> : <p>{t("referenceHelper")}</p>}
                  <span className="creative-reference-count" aria-live="polite">{t("referenceCount", { count: referenceFiles.length })}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="creative-composer-controls">
          <p id={disabledHintId} className={!canStartImageCreation && !isCreating ? "creative-disabled-reason" : "sr-only"}>{!canStartImageCreation && !isCreating ? disabledReason || t("startDisabledHint") : ""}</p>
          <Button
            type="submit"
            variant="dark"
            disabled={!canStartImageCreation}
            aria-busy={isCreating}
            aria-describedby={disabledHintId}
            className="creative-start-button"
          >
            <span>{isCreating ? t("creating") : t("createImage")}</span>
          </Button>
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
