"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { WorkspaceCanvas } from "@/components/sections/workspace-canvas";
import { WorkspaceChat } from "@/components/sections/workspace-chat";
import { WorkspaceProjectSelector } from "@/components/sections/workspace-project-selector";
import {
  getWorkspaceScenario,
  type WorkspaceGenerationState,
  type WorkspaceScenarioId,
  workspaceGenerationConfig,
  workspaceScenarios,
} from "@/data/workspace-demo";

function getScenarioRotationDelay() {
  return 5_000 + Math.round(Math.random() * 2_500);
}

export function HeroWorkspace() {
  const t = useTranslations("WorkspaceDemo");
  const [activeScenarioId, setActiveScenarioId] =
    useState<WorkspaceScenarioId>("jewelry");
  const activeScenario = getWorkspaceScenario(activeScenarioId);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    activeScenario.defaultSelectedAssetId,
  );
  const [draft, setDraft] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [generationState, setGenerationState] =
    useState<WorkspaceGenerationState>("complete");
  const [usesUpdatedResponse, setUsesUpdatedResponse] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const timeoutIdsRef = useRef<number[]>([]);

  const projectNames = useMemo(
    () => ({
      jewelry: t("projects.jewelry"),
      fashion: t("projects.fashion"),
      cosmetics: t("projects.cosmetics"),
    }),
    [t],
  );

  const clearGenerationTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    timeoutIdsRef.current = [];
  }, []);

  useEffect(() => clearGenerationTimeouts, [clearGenerationTimeouts]);

  function resetConversation() {
    clearGenerationTimeouts();
    setDraft("");
    setSubmittedPrompt(null);
    setGenerationState("complete");
    setUsesUpdatedResponse(false);
  }

  const handleScenarioChange = useCallback((scenarioId: WorkspaceScenarioId) => {
    const nextScenario = getWorkspaceScenario(scenarioId);
    const { timings } = workspaceGenerationConfig;

    clearGenerationTimeouts();
    setActiveScenarioId(scenarioId);
    setSelectedAssetId(nextScenario.defaultSelectedAssetId);
    setDraft("");
    setSubmittedPrompt(null);
    setGenerationState("analyzing");
    setUsesUpdatedResponse(false);
    setLayoutVersion(0);

    timeoutIdsRef.current = [
      window.setTimeout(
        () => setGenerationState("researching"),
        timings.researching,
      ),
      window.setTimeout(
        () => setGenerationState("composing"),
        timings.composing,
      ),
      window.setTimeout(() => setGenerationState("complete"), timings.complete),
    ];
  }, [
    clearGenerationTimeouts,
    setActiveScenarioId,
    setDraft,
    setGenerationState,
    setLayoutVersion,
    setSelectedAssetId,
    setSubmittedPrompt,
    setUsesUpdatedResponse,
  ]);

  useEffect(() => {
    if (
      isProjectMenuOpen ||
      draft.trim() ||
      generationState !== "complete"
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const activeIndex = workspaceScenarios.findIndex(
        (scenario) => scenario.id === activeScenarioId,
      );
      const nextScenario =
        workspaceScenarios[(activeIndex + 1) % workspaceScenarios.length];

      handleScenarioChange(nextScenario.id);
    }, getScenarioRotationDelay());

    return () => window.clearTimeout(timeoutId);
  }, [
    activeScenarioId,
    draft,
    generationState,
    handleScenarioChange,
    isProjectMenuOpen,
  ]);

  function handlePromptSubmit(prompt: string) {
    const { timings } = workspaceGenerationConfig;

    clearGenerationTimeouts();
    setSubmittedPrompt(prompt);
    setDraft("");
    setGenerationState("analyzing");
    setUsesUpdatedResponse(false);

    timeoutIdsRef.current = [
      window.setTimeout(
        () => setGenerationState("researching"),
        timings.researching,
      ),
      window.setTimeout(
        () => setGenerationState("composing"),
        timings.composing,
      ),
      window.setTimeout(() => {
        setGenerationState("complete");
        setUsesUpdatedResponse(true);
        setLayoutVersion((current) => current + 1);
      }, timings.complete),
    ];
  }

  const prompt = submittedPrompt ?? t(activeScenario.promptKey);
  const agentResponse = t(
    usesUpdatedResponse
      ? activeScenario.updatedAgentKey
      : activeScenario.agentKey,
  );

  return (
    <div
      role="region"
      aria-label={t("workspaceLabel")}
      className="workspace-frame mx-auto w-full max-w-[80rem]"
    >
      <div className="flex min-h-0 flex-col overflow-hidden border border-[var(--workspace-line)] bg-[var(--workspace-canvas)] xl:min-h-[44rem] xl:[aspect-ratio:16/9.25]">
        <div className="relative z-30 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <WorkspaceProjectSelector
              activeScenarioId={activeScenarioId}
              menuLabel={t("projectMenuLabel")}
              projectNames={projectNames}
              selectProjectLabel={t("selectProject", {
                project: projectNames[activeScenarioId],
              })}
              onOpenChange={setIsProjectMenuOpen}
              onScenarioChange={handleScenarioChange}
            />
          </div>
          <span className="hidden shrink-0 rounded-[var(--radius-sm)] border border-[var(--workspace-line)] px-2 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--workspace-muted)] sm:inline-flex">
            {t("demoLabel")}
          </span>
        </div>

        <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,73fr)_minmax(20rem,27fr)]">
          <WorkspaceCanvas
            scenario={activeScenario}
            selectedAssetId={selectedAssetId}
            generationState={generationState}
            layoutVersion={layoutVersion}
            onAssetSelect={setSelectedAssetId}
          />
          <WorkspaceChat
            prompt={prompt}
            agentResponse={agentResponse}
            draft={draft}
            generationState={generationState}
            onDraftChange={setDraft}
            onNewChat={resetConversation}
            onSubmit={handlePromptSubmit}
          />
        </div>
      </div>
    </div>
  );
}
