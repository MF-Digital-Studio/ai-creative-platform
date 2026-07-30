import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BeforeAfter } from "@/components/sections/before-after";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { ModelEcosystem } from "@/components/sections/model-ecosystem";
import { Pricing } from "@/components/sections/pricing";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { isSupportedLocale } from "@/i18n/routing";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ModelEcosystem />
        <HowItWorks />
        <BeforeAfter />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
