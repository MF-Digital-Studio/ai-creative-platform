import { Button } from "@/components/ui/button";

type DashboardPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  cta?: {
    href: string;
    label: string;
  };
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  cta,
}: DashboardPageHeaderProps) {
  return (
    <section className="dashboard-page-header flex flex-col gap-5 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="min-w-0 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 break-words text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--foreground)] [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--foreground-muted)] sm:text-base sm:leading-7">
          {description}
        </p>
      </div>
      {cta ? (
        <Button href={cta.href} variant="dark" className="w-full sm:w-auto">
          {cta.label}
        </Button>
      ) : null}
    </section>
  );
}
