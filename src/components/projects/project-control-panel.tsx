import { getTranslations } from "next-intl/server";
import { registerProductAsset, registerReferenceAsset } from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { createQueuedImageGeneration } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { ProductImageUpload } from "@/components/projects/product-image-upload";
import { ReferenceAssetList } from "@/components/projects/reference-asset-list";
import type { AppLocale } from "@/i18n/routing";
import { CreativeDirectionForm } from "@/app/[locale]/dashboard/projects/[projectId]/creative-direction-form";
import { GenerateImageForm } from "@/app/[locale]/dashboard/projects/[projectId]/generate-image-form";

type ProjectControlPanelProps = {
  locale: AppLocale;
  projectId: string;
  userId: string;
  creativeDirection: string | null;
  initialAsset: { objectPath: string; signedUrl: string } | null;
  referenceUrls: string[];
};

export async function ProjectControlPanel({ locale, projectId, userId, creativeDirection, initialAsset, referenceUrls }: ProjectControlPanelProps) {
  const t = await getTranslations("Dashboard.project");
  return <aside className="project-settings-panel" aria-labelledby="project-controls-heading">
    <h2 id="project-controls-heading" className="project-controls-title">{t("controlsHeading")}</h2>
    <ProductImageUpload projectId={projectId} userId={userId} initialAsset={initialAsset} registerAsset={registerProductAsset.bind(null, locale)} />
    <ReferenceAssetList projectId={projectId} userId={userId} initialUrls={referenceUrls} registerAsset={registerReferenceAsset.bind(null, locale)} />
    <CreativeDirectionForm creativeDirection={creativeDirection} projectId={projectId} locale={locale} messages={{
      label: t("creativeDirection.label"), description: t("creativeDirection.description"), placeholder: t("creativeDirection.placeholder"), save: t("creativeDirection.save"), saving: t("creativeDirection.saving"), validationError: t("creativeDirection.validationError"), saveError: t("creativeDirection.saveError"), saveSuccess: t("creativeDirection.saveSuccess"),
    }} />
    <GenerateImageForm action={createQueuedImageGeneration.bind(null, locale, projectId)} messages={{
      generate: t("generation.generate"), creating: t("generation.creating"), missingProductImage: t("generation.missingProductImage"), missingCreativeDirection: t("generation.missingCreativeDirection"), creationFailed: t("generation.creationFailed"), generationFailed: t("generation.generationFailed"),
      progressTitle: t("generation.progressTitle"), progressDescription: t("generation.progressDescription"), progressStatuses: [t("generation.progressStatuses.preparing"), t("generation.progressStatuses.scene"), t("generation.progressStatuses.generating"), t("generation.progressStatuses.finalizing")],
    }} />
  </aside>;
}
