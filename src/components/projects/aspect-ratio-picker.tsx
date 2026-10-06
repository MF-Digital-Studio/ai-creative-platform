"use client";

import { GENERATION_ASPECT_RATIOS } from "@/lib/generation/aspect-ratios";
import type { GenerationAspectRatio } from "@/lib/generation/types";
import { AspectRatioPreview } from "@/components/projects/aspect-ratio-preview";

export type AspectRatioPickerMessages = {
  label: string;
  helper: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
};

type AspectRatioPickerProps = {
  value: GenerationAspectRatio;
  onChange: (value: GenerationAspectRatio) => void;
  disabled?: boolean;
  messages: AspectRatioPickerMessages;
  name?: string;
};

export function AspectRatioPicker({ value, onChange, disabled = false, messages, name = "aspect_ratio" }: AspectRatioPickerProps) {
  return <fieldset className="aspect-ratio-picker" disabled={disabled}>
    <legend>{messages.label}</legend>
    <p>{messages.helper}</p>
    <div className="aspect-ratio-options" role="radiogroup" aria-label={messages.label}>
      {GENERATION_ASPECT_RATIOS.map((ratio) =>
        <label key={ratio.value} className="aspect-ratio-option" data-selected={value === ratio.value}>
          <input type="radio" name={name} value={ratio.value} checked={value === ratio.value} onChange={() => onChange(ratio.value)} />
          <AspectRatioPreview value={ratio.value} className="aspect-ratio-preview" />
          <span className="aspect-ratio-copy"><strong>{ratio.value}</strong><b>{messages.names[ratio.nameKey]}</b><small>{messages.descriptions[ratio.descriptionKey]}</small></span>
        </label>,
      )}
    </div>
  </fieldset>;
}
