import { getTranslations } from "next-intl/server";
import { registerProductAsset, registerReferenceAsset } from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { createQueuedImageGeneration } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { ProductImageUpload } from "@/components/projects/product-image-upload";
import { ReferenceAssetList } from "@/components/projects/reference-asset-list";
import type { AppLocale } from "@/i18n/routing";
import { GenerateImageForm } from "@/app/[locale]/dashboard/projects/[projectId]/generate-image-form";
import { ImageEditPanel } from "@/components/projects/image-edit-panel";

type ProjectControlPanelProps = {
  locale: AppLocale;
  projectId: string;
  userId: string;
  hasOutput: boolean;
  initialAsset: { objectPath: string; signedUrl: string } | null;
  referenceUrls: string[];
};

export async function ProjectControlPanel({ locale, projectId, userId, hasOutput, initialAsset, referenceUrls }: ProjectControlPanelProps) {
  const t = await getTranslations("Dashboard.project");
  return <aside className="project-settings-panel" aria-labelledby="project-controls-heading">
    <h2 id="project-controls-heading" className="project-controls-title">{t("controlsHeading")}</h2>
    <ProductImageUpload projectId={projectId} userId={userId} initialAsset={initialAsset} registerAsset={registerProductAsset.bind(null, locale)} />
    <ReferenceAssetList projectId={projectId} userId={userId} initialUrls={referenceUrls} registerAsset={registerReferenceAsset.bind(null, locale)} />
    <ImageEditPanel hasOutput={hasOutput} messages={{ title: t("imageEdit.title"), description: t("imageEdit.description"), placeholder: t("imageEdit.placeholder"), helper: t("imageEdit.helper"), apply: t("imageEdit.apply"), unavailable: t("imageEdit.unavailable") }} />
    {!hasOutput ? <GenerateImageForm action={createQueuedImageGeneration.bind(null, locale, projectId)} messages={{
      generate: t("generation.generate"), creating: t("generation.creating"), missingProductImage: t("generation.missingProductImage"), missingCreativeDirection: t("generation.missingCreativeDirection"), creationFailed: t("generation.creationFailed"), generationFailed: t("generation.generationFailed"),
      progressTitle: t("generation.progressTitle"), progressDescription: t("generation.progressDescription"), progressStatuses: [t("generation.progressStatuses.preparing"), t("generation.progressStatuses.scene"), t("generation.progressStatuses.generating"), t("generation.progressStatuses.finalizing")],
    }} /> : null}
  </aside>;
}
