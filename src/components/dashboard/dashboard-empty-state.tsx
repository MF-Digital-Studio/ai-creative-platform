import { Button } from "@/components/ui/button";

type DashboardEmptyStateProps = {
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
};

export function DashboardEmptyState({
  title,
  description,
  action,
}: DashboardEmptyStateProps) {
  return (
    <div className="dashboard-empty-state flex min-h-56 flex-col items-start justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 sm:min-h-64 sm:px-8">
      <svg aria-hidden="true" viewBox="0 0 40 40" className="h-10 w-10 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="6.5" y="6.5" width="27" height="27" rx="3.5" />
        <path d="M13 20h14M20 13v14" strokeLinecap="round" />
      </svg>
      <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
        {title}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--foreground-muted)]">
        {description}
      </p>
      {action ? (
        <Button href={action.href} variant="secondary" size="sm" className="mt-5">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
