"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { Button } from "@/components/ui/button";
import { DASHBOARD_DIRECTION_EVENT } from "@/data/dashboard-inspiration";
import { cn } from "@/lib/cn";

const outputTypes = ["image", "video", "campaignSet"] as const;
const quickStarts = [
  "studioProductShot",
  "lifestyleCampaign",
  "onModelFashion",
  "productCloseUp",
  "shortVideo",
  "socialCampaign",
] as const;

type OutputType = (typeof outputTypes)[number];

export function CreativeComposer() {
  const t = useTranslations("Dashboard.composer");
  const descriptionId = useId();
  const promptId = useId();
  const statusId = useId();
  const disabledHintId = useId();
  const [prompt, setPrompt] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("image");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    function handleDirection(event: Event) {
      if (event instanceof CustomEvent && typeof event.detail === "string") {
        setPrompt(event.detail);
        setStatusMessage("");
      }
    }

    window.addEventListener(DASHBOARD_DIRECTION_EVENT, handleDirection);
    return () => window.removeEventListener(DASHBOARD_DIRECTION_EVENT, handleDirection);
  }, []);

  function showUnavailable(message: string) {
    setStatusMessage(message);
  }

  return (
    <section id="composer" className="dashboard-composer-section" aria-labelledby="dashboard-composer-heading">
      <div className="dashboard-composer-heading">
        <h1 id="dashboard-composer-heading">{t("heading")}</h1>
        <p id={descriptionId}>{t("description")}</p>
      </div>

      <form
        className="creative-composer"
        aria-describedby={descriptionId}
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="creative-composer-meta">
          <span>{t("eyebrow")}</span>
          <span>{t("context")}</span>
        </div>

        <div className="creative-composer-body">
          <button
            type="button"
            className="creative-product-upload"
            aria-describedby={statusId}
            onClick={() => showUnavailable(t("uploadUnavailable"))}
          >
            <span className="creative-product-upload-icon"><DashboardIcon name="plus" /></span>
            <span>{t("addProduct")}</span>
          </button>

          <div className="creative-prompt-field">
            <label htmlFor={promptId} className="sr-only">{t("promptLabel")}</label>
            <textarea
              id={promptId}
              value={prompt}
              placeholder={t("promptPlaceholder")}
              className="creative-prompt-textarea"
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>
        </div>

        <div className="creative-composer-controls">
          <div className="creative-attachment-controls">
            <button
              type="button"
              className="creative-utility-button"
              onClick={() => showUnavailable(t("uploadUnavailable"))}
            >
              <DashboardIcon name="plus" />
              <span>{t("addProduct")}</span>
            </button>
            <button
              type="button"
              className="creative-utility-button"
              onClick={() => showUnavailable(t("referenceUnavailable"))}
            >
              <DashboardIcon name="assets" />
              <span>{t("addReference")}</span>
            </button>
          </div>

          <fieldset className="creative-output-control">
            <legend className="sr-only">{t("outputLabel")}</legend>
            {outputTypes.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={outputType === type}
                className={cn("creative-output-option", outputType === type && "is-active")}
                onClick={() => setOutputType(type)}
              >
                {t(`outputTypes.${type}`)}
              </button>
            ))}
          </fieldset>

          <Button
            type="submit"
            disabled
            aria-describedby={disabledHintId}
            className="creative-start-button"
          >
            <span>{t("startCreating")}</span>
            <DashboardIcon name="arrow" className="creative-start-icon" />
          </Button>
        </div>

        <div className="creative-composer-feedback">
          <p id={statusId} role="status" aria-live="polite">{statusMessage}</p>
          <p id={disabledHintId}>{t("startDisabledHint")}</p>
        </div>
      </form>

      <div className="creative-quick-starts" aria-label={t("quickStartLabel")}>
        {quickStarts.map((item) => (
          <button
            key={item}
            type="button"
            className="creative-quick-start"
            onClick={() => {
              setPrompt(t(`quickStartPrompts.${item}`));
              setStatusMessage("");
            }}
          >
            {t(`quickStarts.${item}`)}
          </button>
        ))}
      </div>
    </section>
  );
}
