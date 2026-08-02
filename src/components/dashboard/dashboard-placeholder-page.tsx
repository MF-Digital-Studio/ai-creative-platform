import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";

type DashboardPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  notice: string;
};

export function DashboardPlaceholderPage({
  eyebrow,
  title,
  description,
  notice,
}: DashboardPlaceholderPageProps) {
  return (
    <div className="space-y-8">
      <DashboardPageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-subtle)] sm:p-8">
        <p className="max-w-xl text-sm leading-6 text-[var(--foreground-muted)]">
          {notice}
        </p>
      </section>
    </div>
  );
}
