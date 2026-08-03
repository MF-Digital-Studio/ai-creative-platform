"use client";

import Image from "next/image";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import {
  DASHBOARD_DIRECTION_EVENT,
  type DashboardInspiration,
} from "@/data/dashboard-inspiration";
import { cn } from "@/lib/cn";

type InspirationCardProps = {
  item: DashboardInspiration;
  title: string;
  typeLabel: string;
  alt: string;
  prompt: string;
  actionLabel: string;
};

export function InspirationCard({
  item,
  title,
  typeLabel,
  alt,
  prompt,
  actionLabel,
}: InspirationCardProps) {
  function useDirection() {
    window.dispatchEvent(
      new CustomEvent(DASHBOARD_DIRECTION_EVENT, { detail: prompt }),
    );
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <article className={cn("dashboard-inspiration-card", `is-${item.size}`)}>
      <Image
        src={item.src}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 26vw, (min-width: 768px) 44vw, 92vw"
        style={{ objectPosition: item.objectPosition }}
      />
      <div className="dashboard-inspiration-shade" />
      <div className="dashboard-inspiration-copy">
        <div>
          <span>{typeLabel}</span>
          <h3>{title}</h3>
        </div>
        <button type="button" className="dashboard-direction-button" onClick={useDirection}>
          <span>{actionLabel}</span>
          <DashboardIcon name="arrow" />
        </button>
      </div>
    </article>
  );
}
