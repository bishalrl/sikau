import type { Metadata } from "next";
import { getPublicCms, parseLessons } from "@/lib/cms/public";
import { CurriculumAccordion } from "@/components/landing/CurriculumAccordion";
import { CurriculumGrid } from "@/components/landing/CurriculumGrid";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { HomepageNewsletterSection } from "@/components/landing/HomepageNewsletterSection";
import { HomepageLiveSessions } from "@/components/landing/HomepageLiveSessions";
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
import { getUpcomingLiveSessions } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublicCms();
  const seo = cms.seo.home;
  return {
    title: { absolute: seo.title || "Sikau Paisa" },
    description: seo.description,
    openGraph: {
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  };
}

export default async function HomePage() {
  const session = await getCurrentSession();
  const [cms, liveSessions] = await Promise.all([getPublicCms(), getUpcomingLiveSessions()]);
  const hero = cms.sections["home.hero"];
  const stats = cms.sections["home.hero.stats"];
  const trust = cms.sections["home.trust"];
  const raju = cms.sections["home.raju"];
  const masterclass = cms.sections["home.masterclass"];
  const newsletter = cms.sections["home.newsletter"];
  const live = cms.sections["home.live"];
  const curriculum = cms.sections["home.curriculum"];
  const stories = cms.sections["home.stories"];
  const roadmap = cms.sections["home.roadmap"];
  const inside = cms.sections["home.inside"];
  const closing = cms.sections["home.cta"];

  const sessions = [...liveSessions]
    .sort((a, b) => {
      if (a.status === "LIVE" && b.status !== "LIVE") return -1;
      if (b.status === "LIVE" && a.status !== "LIVE") return 1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      scheduledAt: item.scheduledAt,
      status: item.status,
      host: item.host ? { name: item.host.name } : null,
    }));

  return (
    <div className="has-mobile-bottom-nav">
      <ScrollReveal />
      <LandingHeader />
      <main className="overflow-x-hidden">
        {hero?.enabled !== false && (
          <LandingHero
            badge={hero?.data.badge}
            titleLine1={hero?.data.titleLine1}
            titleLine2={hero?.data.titleLine2}
            image={hero?.data.image}
            imageAlt={hero?.data.imageAlt}
            primaryCta={hero?.data.primaryCta}
            primaryHref={hero?.data.primaryHref}
            secondaryCta={hero?.data.secondaryCta}
            secondaryHref={hero?.data.secondaryHref}
            benefits={hero?.items.map((item) => item.data.text).filter(Boolean)}
            stats={stats?.items.map((item) => ({
              value: item.data.value,
              label: item.data.label,
              icon: item.data.icon,
            }))}
          />
        )}
        {trust?.enabled !== false && (
          <TrustMarquee items={trust?.items.map((item) => ({ icon: item.data.icon, label: item.data.label }))} />
        )}
        {raju?.enabled !== false && (
          <MeetRajuSection
            title={raju?.data.title}
            description={raju?.data.description}
            image={raju?.data.image}
            imageAlt={raju?.data.imageAlt}
            quote={raju?.data.quote}
            cta={raju?.data.cta}
            ctaHref={raju?.data.ctaHref}
            timeline={raju?.items.map((item) => ({ title: item.data.title, description: item.data.description }))}
          />
        )}
        {masterclass?.enabled !== false && (
          <MasterclassSection
            badge={masterclass?.data.badge}
            title={masterclass?.data.title}
            image={masterclass?.data.image}
            imageAlt={masterclass?.data.imageAlt}
            listPrice={masterclass?.data.listPrice}
            price={masterclass?.data.price}
            cta={masterclass?.data.cta}
            ctaHref={masterclass?.data.ctaHref}
            features={masterclass?.items.map((item) => item.data.text).filter(Boolean)}
          />
        )}
        {newsletter?.enabled !== false && (
          <HomepageNewsletterSection
            badge={newsletter?.data.badge}
            primaryCta={newsletter?.data.primaryCta}
            secondaryCta={newsletter?.data.secondaryCta}
          />
        )}
        {live?.enabled !== false && (
          <HomepageLiveSessions
            sessions={sessions}
            isLoggedIn={Boolean(session?.user)}
            badge={live?.data.badge}
            title={live?.data.title}
            description={live?.data.description}
          />
        )}
        {curriculum?.enabled !== false && (
          <CurriculumGrid
            title={curriculum?.data.title}
            description={curriculum?.data.description}
            modules={curriculum?.items.map((item) => ({
              icon: item.data.icon,
              title: item.data.title,
              description: item.data.description,
            }))}
          />
        )}
        {stories?.enabled !== false && (
          <TransformationSection
            title={stories?.data.title}
            description={stories?.data.description}
            stories={stories?.items.map((item) => ({
              name: item.data.name,
              role: item.data.role,
              image: item.data.image,
              badge: item.data.badge,
              quote: item.data.quote,
              beforeTitle: item.data.beforeTitle,
              beforeDetail: item.data.beforeDetail,
              beforeTitle2: item.data.beforeTitle2,
              beforeDetail2: item.data.beforeDetail2,
              afterTitle: item.data.afterTitle,
              afterDetail: item.data.afterDetail,
              afterTitle2: item.data.afterTitle2,
              afterDetail2: item.data.afterDetail2,
            }))}
          />
        )}
        {roadmap?.enabled !== false && (
          <RoadmapSection
            title={roadmap?.data.title}
            description={roadmap?.data.description}
            steps={roadmap?.items.map((item) => ({
              icon: item.data.icon,
              title: item.data.title,
              description: item.data.description,
            }))}
          />
        )}
        {inside?.enabled !== false && (
          <CurriculumAccordion
            title={inside?.data.title}
            description={inside?.data.description}
            modules={inside?.items.map((item) => ({
              num: item.data.num,
              title: item.data.title,
              meta: item.data.meta,
              summary: item.data.summary,
              lessons: parseLessons(item.data.lessons || ""),
            }))}
          />
        )}
        {closing?.enabled !== false && (
          <FinalCtaSection
            title={closing?.data.title}
            description={closing?.data.description}
            primaryCta={closing?.data.primaryCta}
            primaryHref={closing?.data.primaryHref}
            secondaryCta={closing?.data.secondaryCta}
            secondaryHref={closing?.data.secondaryHref}
          />
        )}
      </main>
      <LandingFooter />
      <MobileBottomNav isLoggedIn={Boolean(session?.user)} />
    </div>
  );
}

