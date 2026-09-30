"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
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
      {creativePresets.map((preset, index) => (
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
              loading={index === 0 ? "eager" : "lazy"}
              sizes="(min-width: 1280px) 230px, (min-width: 768px) 210px, 72vw"
              style={{ objectPosition: preset.objectPosition }}
            />
            <span className="dashboard-template-shade" />
          </span>
          <span className="dashboard-template-copy">
            <span>
              <small>{t(`categories.${preset.category}`)}</small>
              <strong>{t(`items.${preset.id}.title`)}</strong>
              <span>{t(`items.${preset.id}.description`)}</span>
            </span>
            <DashboardIcon name="arrow" />
          </span>
        </button>
      ))}
    </div>
  );
}
