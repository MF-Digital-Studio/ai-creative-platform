"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { InspirationCard } from "@/components/dashboard/inspiration-card";
import {
  dashboardInspiration,
  inspirationCategories,
  type InspirationCategory,
} from "@/data/dashboard-inspiration";
import { cn } from "@/lib/cn";

export function InspirationGrid() {
  const t = useTranslations("Dashboard.inspiration");
  const [category, setCategory] = useState<InspirationCategory>("all");
  const visibleItems = useMemo(
    () => dashboardInspiration.filter((item) => category === "all" || item.category === category),
    [category],
  );

  return (
    <section id="inspiration" className="dashboard-content-section" aria-labelledby="dashboard-inspiration-heading">
      <div className="dashboard-section-heading dashboard-inspiration-heading">
        <div>
          <h2 id="dashboard-inspiration-heading">{t("heading")}</h2>
          <p>{t("description")}</p>
        </div>
        <div className="dashboard-filter-list" role="group" aria-label={t("filterLabel")}>
          {inspirationCategories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={cn("dashboard-filter-button", category === item && "is-active")}
              onClick={() => setCategory(item)}
            >
              {t(`categories.${item}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-inspiration-grid">
        {visibleItems.map((item) => (
          <InspirationCard
            key={item.id}
            item={item}
            title={t(item.titleKey)}
            typeLabel={t(`types.${item.typeKey}`)}
            alt={t(item.altKey)}
            prompt={t(item.promptKey)}
            actionLabel={t("useDirection")}
          />
        ))}
      </div>
    </section>
  );
}
