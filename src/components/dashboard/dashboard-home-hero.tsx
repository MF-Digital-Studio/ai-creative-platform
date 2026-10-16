import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";

const heroFrames = [
  { src: "/images/presets/jewelry-on-model.webp", altKey: "jewelryAlt" },
  { src: "/images/presets/cosmetics-scenic-lifestyle.webp", altKey: "cosmeticsAlt" },
  { src: "/images/presets/apparel-street.webp", altKey: "apparelAlt" },
] as const;

export async function DashboardHomeHero() {
  const t = await getTranslations("Dashboard.home");

  return (
    <header className="dashboard-home-hero">
      <div className="dashboard-home-hero-copy">
        <p className="dashboard-home-eyebrow"><span aria-hidden="true" />{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="dashboard-home-description">{t("description")}</p>
        <nav className="dashboard-home-jump-links" aria-label={t("jumpLabel")}>
          <a href="#composer"><DashboardIcon name="spark" />{t("createLink")}</a>
          <a href="#templates">{t("exploreLink")}<DashboardIcon name="arrow" /></a>
        </nav>
      </div>
      <div className="dashboard-home-visual" aria-label={t("visualLabel")}>
        {heroFrames.map((frame, index) => (
          <figure key={frame.src} className="dashboard-home-frame" data-frame={index + 1}>
            <Image
              src={frame.src}
              alt={t(frame.altKey)}
              fill
              priority={index === 0}
              sizes="(min-width: 1200px) 18vw, (min-width: 768px) 28vw, 48vw"
            />
            <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{t(`frame${index + 1}`)}</figcaption>
          </figure>
        ))}
      </div>
    </header>
  );
}
