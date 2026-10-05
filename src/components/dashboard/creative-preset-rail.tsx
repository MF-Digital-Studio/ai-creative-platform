"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { getRecommendedFamilyPresets } from "@/lib/creative-presets/creative-presets";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

export const DASHBOARD_PRESET_EVENT = "creative-ai:select-preset";
const COLLAPSED_PRESET_COUNT = 6;

export function CreativePresetRail({ vertical }: { vertical?: SupportedVertical | null }) {
  const t = useTranslations("Dashboard.presets");
  const locale = useLocale() as AppLocale;
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const allPresets = getRecommendedFamilyPresets({ vertical: null, selectedPresetId });
  const recommendedPresets = getRecommendedFamilyPresets({ vertical, selectedPresetId });
  const compactPresets = vertical
    ? recommendedPresets
    : allPresets.slice(0, COLLAPSED_PRESET_COUNT);
  const selectedPreset = selectedPresetId
    ? allPresets.find((preset) => preset.id === selectedPresetId)
    : undefined;
  const visiblePresets = expanded
    ? allPresets
    : selectedPreset && !compactPresets.some((preset) => preset.id === selectedPreset.id)
      ? [...compactPresets.slice(0, COLLAPSED_PRESET_COUNT - 1), selectedPreset]
      : compactPresets;

  function selectPreset(id: string) {
    const nextPresetId = selectedPresetId === id ? null : id;
    setSelectedPresetId(nextPresetId);
    window.dispatchEvent(new CustomEvent(DASHBOARD_PRESET_EVENT, { detail: nextPresetId }));
  }

  return (
    <div className="dashboard-preset-group">
      <div className="dashboard-template-rail" aria-label={t("listLabel")}>
        {visiblePresets.map((preset) => (
          <button
          key={preset.id}
          type="button"
          className={cn("dashboard-template-card", selectedPresetId === preset.id && "is-selected")}
          aria-label={t("usePreset", { title: preset.localizedTitle[locale] })}
          aria-pressed={selectedPresetId === preset.id}
          onClick={() => selectPreset(preset.id)}
          >
            <span className="dashboard-template-media">
            <Image
              src={preset.thumbnail}
              alt={preset.localizedTitle[locale]}
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
                <strong>{preset.localizedTitle[locale]}</strong>
                <span>{preset.localizedDescription[locale]}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="dashboard-preset-actions">
        <button
          className="dashboard-preset-toggle"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? t("showLess") : t("viewAll")}
        </button>
      </div>
    </div>
  );
}
