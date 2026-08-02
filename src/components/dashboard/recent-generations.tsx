import { getTranslations } from "next-intl/server";

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

export type RecentGeneration = {
  id: string;
  label: string;
};

export async function RecentGenerations({
  outputs,
}: {
  outputs: readonly RecentGeneration[];
}) {
  const t = await getTranslations("Dashboard");

  return (
    <section className="dashboard-section" aria-labelledby="recent-generations-heading">
      <div className="mb-4">
        <h2 id="recent-generations-heading" className="text-lg font-semibold tracking-[-0.035em] text-[var(--foreground)]">
          {t("home.recentGenerations")}
        </h2>
      </div>
      {outputs.length === 0 ? (
        <DashboardEmptyState
          title={t("emptyStates.generationsTitle")}
          description={t("emptyStates.generationsDescription")}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {outputs.map((output) => (
            <li key={output.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-medium text-[var(--foreground)]">
              {output.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
