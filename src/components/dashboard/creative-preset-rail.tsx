"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { creativePresets } from "@/lib/creative-presets/creative-presets";
import { cn } from "@/lib/cn";

export const DASHBOARD_PRESET_EVENT = "creative-ai:select-preset";

export function CreativePresetRail() {
  const t = useTranslations("Dashboard.presets");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  function selectPreset(id: string) {
    const nextPresetId = selectedPresetId === id ? null : id;
    setSelectedPresetId(nextPresetId);
    window.dispatchEvent(new CustomEvent(DASHBOARD_PRESET_EVENT, { detail: nextPresetId }));
  }

  return (
    <div className="dashboard-template-rail" aria-label={t("listLabel")}>
      {creativePresets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={cn("dashboard-template-card", selectedPresetId === preset.id && "is-selected")}
          aria-label={t("usePreset", { title: t(`items.${preset.id}.title`) })}
          aria-pressed={selectedPresetId === preset.id}
          onClick={() => selectPreset(preset.id)}
        >
          <span className="dashboard-template-media">
            <Image
              src={preset.thumbnail}
              alt={t(`items.${preset.id}.alt`)}
              fill
              loading="lazy"
              sizes="(min-width: 1600px) 25vw, (min-width: 1200px) 33vw, (min-width: 700px) 50vw, 100vw"
              style={{ objectPosition: preset.objectPosition }}
            />
            {selectedPresetId === preset.id ? <span className="dashboard-template-check" aria-hidden="true">✓</span> : null}
          </span>
          <span className="dashboard-template-copy">
            <span>
              <small>{t(`categories.${preset.category}`)}</small>
              <strong>{t(`items.${preset.id}.title`)}</strong>
              <span>{t(`items.${preset.id}.description`)}</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
