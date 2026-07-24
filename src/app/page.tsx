import type { Metadata } from "next";
import { CurriculumAccordion } from "@/components/landing/CurriculumAccordion";
import { CurriculumGrid } from "@/components/landing/CurriculumGrid";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { MasterclassSection } from "@/components/landing/MasterclassSection";
import { MeetRajuSection } from "@/components/landing/MeetRajuSection";
import { MobileBottomNav } from "@/components/landing/MobileBottomNav";
import { RoadmapSection } from "@/components/landing/RoadmapSection";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { TransformationSection } from "@/components/landing/TransformationSection";
import { TrustMarquee } from "@/components/landing/TrustMarquee";
import { getWebsiteContentMap } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "Sikau Paisa | Personal Finance Masterclass by Raju Khatiwada",
  description:
    "Master the art of SIP, life insurance, and wealth building with Raju Khatiwada. Join Nepal's leading financial education community.",
};

export default async function HomePage() {
  const content = await getWebsiteContentMap();
  const heroBenefits =
    content["home.hero.benefits"]?.markdown
      ?.split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter(Boolean) ?? [];

  return (
    <>
      <ScrollReveal />
      <LandingHeader />
      <main className="overflow-x-hidden pb-20 md:pb-0">
        <LandingHero
          badge={content["home.hero.badge"]?.markdown}
          title={content["home.hero.title"]?.markdown}
          benefits={heroBenefits}
        />
        <TrustMarquee />
        <MeetRajuSection />
        <MasterclassSection />
        <CurriculumGrid />
        <TransformationSection />
        <RoadmapSection />
        <CurriculumAccordion />
        <FinalCtaSection />
      </main>
      <LandingFooter />
      <MobileBottomNav />
    </>
  );
}
