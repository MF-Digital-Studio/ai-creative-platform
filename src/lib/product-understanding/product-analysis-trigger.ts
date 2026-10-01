export type ProductAnalysisTriggerInput = {
  assetId: string;
  projectId: string;
  userId: string;
};

export type ProductAnalysisTrigger = (input: {
  assetId: string;
  force?: boolean;
  userId: string;
}) => Promise<unknown>;

type TriggerLogger = (event: string, details: Record<string, boolean | string>) => void;

function developmentLogger(event: string, details: Record<string, boolean | string>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[product-understanding] ${event}`, details);
  }
}

/** Awaits analysis so server-action lifetimes cannot cancel the best-effort task. */
export async function triggerProductAnalysisAfterRegistration(
  input: ProductAnalysisTriggerInput,
  analyze: ProductAnalysisTrigger,
  log: TriggerLogger = developmentLogger,
) {
  log("trigger_requested", { assetId: input.assetId, projectId: input.projectId });
  log("starting", { assetId: input.assetId });
  try {
    await analyze({ assetId: input.assetId, userId: input.userId });
  } catch {
    log("trigger_error", { assetId: input.assetId });
  }
}
