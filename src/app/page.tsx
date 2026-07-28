import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <h1 className="sr-only">UI Preview</h1>
        <Section spacing="large" aria-label="UI Preview">
          <Container>
            <div className="border-y border-[var(--border)] py-[var(--section-space-compact)]">
              <SectionHeading
                eyebrow="Foundation"
                title="UI Preview"
                description="Creative platform için tutarlı, sade ve içerik odaklı arayüz bileşenleri."
                align="center"
                className="mx-auto"
              />
            </div>
          </Container>
        </Section>

        <Section spacing="compact" aria-labelledby="actions-title">
          <Container>
            <div className="grid gap-10 border-b border-[var(--border)] pb-[var(--section-space-compact)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                  Actions
                </p>
                <h2
                  id="actions-title"
                  className="mt-3 text-2xl tracking-[-0.035em]"
                >
                  Button variants
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary action</Button>
                <Button variant="ghost">Ghost action</Button>
                <Button variant="dark">Dark action</Button>
                <Button disabled>Disabled action</Button>
              </div>
            </div>
          </Container>
        </Section>

        <Section spacing="compact" aria-labelledby="tags-title">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                  Categories
                </p>
                <h2
                  id="tags-title"
                  className="mt-3 text-2xl tracking-[-0.035em]"
                >
                  Badge variants
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge>Takı</Badge>
                <Badge variant="accent">Giyim</Badge>
                <Badge variant="outline">Kozmetik</Badge>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <div className="mt-[var(--section-space)]">
        <Footer />
      </div>
    </>
  );
}
