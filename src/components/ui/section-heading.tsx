import { Badge } from "@/components/ui/badge";
import { AnimatedHeading } from "@/components/motion/animated-heading";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";

type SectionHeadingAlign = "left" | "center";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: SectionHeadingAlign;
  className?: string;
}

const alignmentClasses: Record<SectionHeadingAlign, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "flex max-w-4xl flex-col gap-5",
        alignmentClasses[align],
        className,
      )}
    >
      {eyebrow ? <Reveal variant="fade"><Badge>{eyebrow}</Badge></Reveal> : null}
      <AnimatedHeading
        lines={title.split("\n")}
        className="text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--foreground)] sm:text-5xl lg:text-6xl"
        style={{ fontFamily: "var(--font-display)" }}
      />
      {description ? (
        <Reveal delay={100} className="max-w-2xl"><p className="text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">
          {description}
        </p></Reveal>
      ) : null}
    </header>
  );
}
