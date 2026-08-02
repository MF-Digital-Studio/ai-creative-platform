export type WorkspaceScenarioId = "jewelry" | "fashion" | "cosmetics";

export type WorkspaceAssetType = "input" | "image" | "video";

type WorkspaceAssetPosition = {
  x: number;
  y: number;
  width: number;
  rotate: number;
  zIndex?: number;
};

type WorkspaceAssetBase = {
  id: string;
  labelKey: string;
  altKey: string;
  aspectRatio: string;
  objectPosition: string;
  position: WorkspaceAssetPosition;
  alternativePosition: WorkspaceAssetPosition;
};

export type WorkspaceImageAsset = WorkspaceAssetBase & {
  type: "input" | "image";
  src: string;
};

export type WorkspaceVideoAsset = WorkspaceAssetBase & {
  type: "video";
  src: string | null;
  poster: string;
  autoPlay: boolean;
  muted: true;
  loop: boolean;
};

export type WorkspaceAsset = WorkspaceImageAsset | WorkspaceVideoAsset;

export type WorkspaceScenario = {
  id: WorkspaceScenarioId;
  promptKey: string;
  agentKey: string;
  updatedAgentKey: string;
  defaultSelectedAssetId: string;
  updatedSelectedAssetId: string;
  assets: WorkspaceAsset[];
};

export type WorkspaceGenerationState =
  | "idle"
  | "analyzing"
  | "researching"
  | "composing"
  | "complete";

export const workspaceGenerationConfig = {
  assetStaggerMs: 70,
  timings: {
    researching: 650,
    composing: 1300,
    complete: 2100,
  },
} as const;

const fashionCampaignImage = "/auth/fashion-dress-campaign.webp";
const fashionProductImage = "/auth/fashion-dress-product.webp";

export const WORKSPACE_SCENARIOS: WorkspaceScenario[] = [
  {
    id: "jewelry",
    promptKey: "prompts.jewelry",
    agentKey: "agent.jewelry.default",
    updatedAgentKey: "agent.jewelry.updated",
    defaultSelectedAssetId: "jewelry-hero",
    updatedSelectedAssetId: "jewelry-video",
    assets: [
      {
        id: "jewelry-product",
        type: "input",
        src: "/workspace-demo/jewelry/product.webp",
        labelKey: "assets.jewelry.product.label",
        altKey: "assets.jewelry.product.alt",
        aspectRatio: "1 / 1",
        objectPosition: "50% 50%",
        position: { x: 4, y: 7, width: 18, rotate: -1.2 },
        alternativePosition: { x: 5, y: 9, width: 17, rotate: -0.3 },
      },
      {
        id: "jewelry-closeup",
        type: "image",
        src: "/workspace-demo/jewelry/campaign.webp",
        labelKey: "assets.jewelry.closeup.label",
        altKey: "assets.jewelry.closeup.alt",
        aspectRatio: "4 / 5",
        objectPosition: "51% 50%",
        position: { x: 27, y: 5, width: 20, rotate: 0.8 },
        alternativePosition: { x: 26, y: 6, width: 19, rotate: -0.5 },
      },
      {
        id: "jewelry-macro",
        type: "image",
        src: "/workspace-demo/jewelry/macro.webp",
        labelKey: "assets.jewelry.macro.label",
        altKey: "assets.jewelry.macro.alt",
        aspectRatio: "1 / 1",
        objectPosition: "50% 50%",
        position: { x: 53, y: 8, width: 18, rotate: -0.7 },
        alternativePosition: { x: 52, y: 7, width: 19, rotate: 0.4 },
      },
      {
        id: "jewelry-social",
        type: "image",
        src: "/workspace-demo/jewelry/social.webp",
        labelKey: "assets.jewelry.social.label",
        altKey: "assets.jewelry.social.alt",
        aspectRatio: "4 / 5",
        objectPosition: "50% 48%",
        position: { x: 6, y: 49, width: 17, rotate: 0.7 },
        alternativePosition: { x: 7, y: 48, width: 16, rotate: -0.6 },
      },
      {
        id: "jewelry-hero",
        type: "image",
        src: "/workspace-demo/jewelry/campaign-hero.webp",
        labelKey: "assets.jewelry.hero.label",
        altKey: "assets.jewelry.hero.alt",
        aspectRatio: "16 / 9",
        objectPosition: "50% 50%",
        position: { x: 30, y: 49, width: 43, rotate: -0.4 },
        alternativePosition: { x: 29, y: 50, width: 44, rotate: 0.5 },
      },
      {
        id: "jewelry-video",
        type: "video",
        src: null,
        poster: "/workspace-demo/jewelry/video-poster.webp",
        labelKey: "assets.jewelry.video.label",
        altKey: "assets.jewelry.video.alt",
        aspectRatio: "9 / 16",
        objectPosition: "50% 50%",
        position: { x: 80, y: 44, width: 13, rotate: 1.1 },
        alternativePosition: { x: 79, y: 45, width: 14, rotate: -0.4 },
        autoPlay: false,
        muted: true,
        loop: true,
      },
    ],
  },
  {
    id: "fashion",
    promptKey: "prompts.fashion",
    agentKey: "agent.fashion.default",
    updatedAgentKey: "agent.fashion.updated",
    defaultSelectedAssetId: "fashion-campaign",
    updatedSelectedAssetId: "fashion-social",
    assets: [
      {
        id: "fashion-product",
        type: "input",
        src: fashionProductImage,
        labelKey: "assets.fashion.product.label",
        altKey: "assets.fashion.product.alt",
        aspectRatio: "1 / 1",
        objectPosition: "50% 50%",
        position: { x: 4, y: 7, width: 19, rotate: -0.8 },
        alternativePosition: { x: 5, y: 9, width: 18, rotate: 0.4 },
      },
      {
        id: "fashion-model",
        type: "image",
        src: fashionCampaignImage,
        labelKey: "assets.fashion.model.label",
        altKey: "assets.fashion.model.alt",
        aspectRatio: "4 / 5",
        objectPosition: "50% 48%",
        position: { x: 27, y: 5, width: 19, rotate: 0.7 },
        alternativePosition: { x: 26, y: 7, width: 20, rotate: -0.6 },
      },
      {
        id: "fashion-detail",
        type: "image",
        src: fashionProductImage,
        labelKey: "assets.fashion.detail.label",
        altKey: "assets.fashion.detail.alt",
        aspectRatio: "1 / 1",
        objectPosition: "50% 50%",
        position: { x: 52, y: 7, width: 18, rotate: -0.6 },
        alternativePosition: { x: 53, y: 8, width: 17, rotate: 0.5 },
      },
      {
        id: "fashion-social",
        type: "image",
        src: fashionCampaignImage,
        labelKey: "assets.fashion.social.label",
        altKey: "assets.fashion.social.alt",
        aspectRatio: "4 / 5",
        objectPosition: "50% 50%",
        position: { x: 77, y: 5, width: 16, rotate: 0.9 },
        alternativePosition: { x: 76, y: 6, width: 17, rotate: -0.5 },
      },
      {
        id: "fashion-campaign",
        type: "image",
        src: fashionCampaignImage,
        labelKey: "assets.fashion.campaign.label",
        altKey: "assets.fashion.campaign.alt",
        aspectRatio: "16 / 9",
        objectPosition: "50% 50%",
        position: { x: 28, y: 50, width: 44, rotate: -0.4 },
        alternativePosition: { x: 29, y: 49, width: 43, rotate: 0.5 },
      },
      {
        id: "fashion-video",
        type: "video",
        src: null,
        poster: fashionCampaignImage,
        labelKey: "assets.fashion.video.label",
        altKey: "assets.fashion.video.alt",
        aspectRatio: "9 / 16",
        objectPosition: "50% 50%",
        position: { x: 79, y: 49, width: 14, rotate: -0.9 },
        alternativePosition: { x: 80, y: 48, width: 13, rotate: 0.6 },
        autoPlay: false,
        muted: true,
        loop: true,
      },
    ],
  },
  {
    id: "cosmetics",
    promptKey: "prompts.cosmetics",
    agentKey: "agent.cosmetics.default",
    updatedAgentKey: "agent.cosmetics.updated",
    defaultSelectedAssetId: "cosmetics-hero",
    updatedSelectedAssetId: "cosmetics-model",
    assets: [
      {
        id: "cosmetics-product",
        type: "input",
        src: "/workspace-demo/cosmetics/product.webp",
        labelKey: "assets.cosmetics.product.label",
        altKey: "assets.cosmetics.product.alt",
        aspectRatio: "1 / 1",
        objectPosition: "50% 50%",
        position: { x: 4, y: 7, width: 18, rotate: -1 },
        alternativePosition: { x: 5, y: 9, width: 17, rotate: 0.4 },
      },
      {
        id: "cosmetics-hero",
        type: "image",
        src: "/workspace-demo/cosmetics/campaign.webp",
        labelKey: "assets.cosmetics.hero.label",
        altKey: "assets.cosmetics.hero.alt",
        aspectRatio: "16 / 9",
        objectPosition: "50% 50%",
        position: { x: 27, y: 6, width: 42, rotate: 0.4 },
        alternativePosition: { x: 28, y: 7, width: 41, rotate: -0.5 },
      },
      {
        id: "cosmetics-detail",
        type: "image",
        src: "/workspace-demo/cosmetics/texture-macro.webp",
        labelKey: "assets.cosmetics.detail.label",
        altKey: "assets.cosmetics.detail.alt",
        aspectRatio: "1 / 1",
        objectPosition: "50% 50%",
        position: { x: 76, y: 7, width: 18, rotate: -0.7 },
        alternativePosition: { x: 75, y: 8, width: 19, rotate: 0.5 },
      },
      {
        id: "cosmetics-model",
        type: "image",
        src: "/workspace-demo/cosmetics/model-usage.webp",
        labelKey: "assets.cosmetics.model.label",
        altKey: "assets.cosmetics.model.alt",
        aspectRatio: "4 / 5",
        objectPosition: "50% 48%",
        position: { x: 5, y: 48, width: 18, rotate: 0.7 },
        alternativePosition: { x: 6, y: 49, width: 17, rotate: -0.5 },
      },
      {
        id: "cosmetics-social",
        type: "image",
        src: "/workspace-demo/cosmetics/social.webp",
        labelKey: "assets.cosmetics.social.label",
        altKey: "assets.cosmetics.social.alt",
        aspectRatio: "4 / 5",
        objectPosition: "50% 50%",
        position: { x: 31, y: 49, width: 18, rotate: -0.5 },
        alternativePosition: { x: 30, y: 48, width: 19, rotate: 0.6 },
      },
      {
        id: "cosmetics-video",
        type: "video",
        src: null,
        poster: "/workspace-demo/cosmetics/video-poster.webp",
        labelKey: "assets.cosmetics.video.label",
        altKey: "assets.cosmetics.video.alt",
        aspectRatio: "9 / 16",
        objectPosition: "50% 50%",
        position: { x: 80, y: 45, width: 13, rotate: 0.9 },
        alternativePosition: { x: 79, y: 44, width: 14, rotate: -0.6 },
        autoPlay: false,
        muted: true,
        loop: true,
      },
    ],
  },
];

export const workspaceScenarios = WORKSPACE_SCENARIOS;

export function getWorkspaceScenario(
  scenarioId: WorkspaceScenarioId,
): WorkspaceScenario {
  return (
    WORKSPACE_SCENARIOS.find((scenario) => scenario.id === scenarioId) ??
    WORKSPACE_SCENARIOS[0]
  );
}
