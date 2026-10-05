import { getTranslations } from "next-intl/server";
import { registerProductAsset, registerReferenceAsset } from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { createQueuedImageGeneration } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { ProductImageUpload } from "@/components/projects/product-image-upload";
import { ReferenceAssetList } from "@/components/projects/reference-asset-list";
import type { AppLocale } from "@/i18n/routing";
import { GenerateImageForm } from "@/app/[locale]/dashboard/projects/[projectId]/generate-image-form";

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
    {!hasOutput ? <GenerateImageForm action={createQueuedImageGeneration.bind(null, locale, projectId)} messages={{
      generate: t("generation.generate"), creating: t("generation.creating"), missingProductImage: t("generation.missingProductImage"), missingCreativeDirection: t("generation.missingCreativeDirection"), creationFailed: t("generation.creationFailed"), generationFailed: t("generation.generationFailed"),
      invalidAspectRatio: t("composer.invalidAspectRatio"), aspectRatio: { label: t("composer.aspectRatio.label"), helper: t("composer.aspectRatio.helper"), names: { widescreen: t("composer.aspectRatio.names.widescreen"), vertical: t("composer.aspectRatio.names.vertical"), square: t("composer.aspectRatio.names.square"), classic: t("composer.aspectRatio.names.classic"), tall: t("composer.aspectRatio.names.tall"), cinemascope: t("composer.aspectRatio.names.cinemascope") }, descriptions: { widescreenUse: t("composer.aspectRatio.descriptions.widescreenUse"), verticalUse: t("composer.aspectRatio.descriptions.verticalUse"), squareUse: t("composer.aspectRatio.descriptions.squareUse"), classicUse: t("composer.aspectRatio.descriptions.classicUse"), tallUse: t("composer.aspectRatio.descriptions.tallUse"), cinemascopeUse: t("composer.aspectRatio.descriptions.cinemascopeUse") } },
      progressTitle: t("generation.progressTitle"), progressDescription: t("generation.progressDescription"), progressStatuses: [t("generation.progressStatuses.preparing"), t("generation.progressStatuses.scene"), t("generation.progressStatuses.generating"), t("generation.progressStatuses.finalizing")],
    }} /> : null}
  </aside>;
}
