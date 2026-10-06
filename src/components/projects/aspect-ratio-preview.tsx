import type { CSSProperties } from "react";

import type { GenerationAspectRatio } from "@/lib/generation/types";

export function getAspectRatioPreviewStyle(value: GenerationAspectRatio, size = 40): CSSProperties {
  const [width, height] = value.split(":").map(Number);
  const scale = Math.min(size / width, size / height);

  return {
    width: `${width * scale}px`,
    height: `${height * scale}px`,
    aspectRatio: value.replace(":", " / "),
  };
}

export function AspectRatioPreview({ value, className, size = 40 }: { value: GenerationAspectRatio; className?: string; size?: number }) {
  return <span className={className} aria-hidden="true"><span style={getAspectRatioPreviewStyle(value, size)} /></span>;
}
