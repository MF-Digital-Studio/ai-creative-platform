export type ModelRailItem = {
  id: string;
  name: string;
  wordmark: string;
  logoSrc?: string;
  logoScaleClassName?: string;
  roleKey: "openai" | "gemini" | "flux" | "veo" | "runway" | "kling" | "fal";
  type: "provider" | "model" | "infrastructure";
};

export const modelRailItems: readonly ModelRailItem[] = [
  {
    id: "openai",
    name: "OpenAI",
    wordmark: "OpenAI",
    logoSrc: "/brands/openai.svg",
    roleKey: "openai",
    type: "provider",
  },
  {
    id: "gemini",
    name: "Gemini",
    wordmark: "GEMINI",
    logoSrc: "/brands/gemini.svg",
    logoScaleClassName: "scale-110",
    roleKey: "gemini",
    type: "provider",
  },
  {
    id: "flux",
    name: "FLUX.2",
    wordmark: "FLUX.2",
    logoSrc: "/brands/flux-bfl.svg",
    logoScaleClassName: "scale-95",
    roleKey: "flux",
    type: "model",
  },
  {
    id: "veo",
    name: "Veo",
    wordmark: "VEO",
    logoSrc: "/brands/veo-deepmind.svg",
    logoScaleClassName: "scale-95",
    roleKey: "veo",
    type: "model",
  },
  {
    id: "runway",
    name: "Runway",
    wordmark: "RUNWAY",
    logoSrc: "/brands/runway.svg",
    logoScaleClassName: "scale-90",
    roleKey: "runway",
    type: "provider",
  },
  {
    id: "kling",
    name: "Kling AI",
    wordmark: "KLING",
    logoSrc: "/brands/kling.svg",
    logoScaleClassName: "scale-90",
    roleKey: "kling",
    type: "provider",
  },
  {
    id: "fal",
    name: "fal.ai",
    wordmark: "fal",
    logoSrc: "/brands/fal.svg",
    logoScaleClassName: "scale-95",
    roleKey: "fal",
    type: "infrastructure",
  },
];
