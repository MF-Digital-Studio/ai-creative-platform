import type { ReactNode } from "react";

type DashboardSummaryCardProps = {
  label: string;
  value: string;
  description: string;
  icon?: ReactNode;
};

export function DashboardSummaryCard({
  label,
  value,
  description,
  icon,
}: DashboardSummaryCardProps) {
  return (
    <article className="dashboard-summary-card rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[var(--foreground-muted)]">{label}</p>
        {icon ? <span aria-hidden="true" className="text-[var(--accent)]">{icon}</span> : null}
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
        {description}
      </p>
    </article>
  );
}
