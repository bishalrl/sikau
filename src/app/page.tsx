import type { Metadata } from "next";
import { getPublicCms, parseLessons } from "@/lib/cms/public";
import { CurriculumAccordion } from "@/components/landing/CurriculumAccordion";
import { CurriculumGrid } from "@/components/landing/CurriculumGrid";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { HomepageNewsletterSection } from "@/components/landing/HomepageNewsletterSection";
import { HomepageEbookSection } from "@/components/landing/HomepageEbookSection";
import { HomepageLiveSessions } from "@/components/landing/HomepageLiveSessions";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { MasterclassSection } from "@/components/landing/MasterclassSection";
import { MeetRajuSection } from "@/components/landing/MeetRajuSection";
import { MobileBottomNav } from "@/components/landing/MobileBottomNav";
import { RoadmapSection } from "@/components/landing/RoadmapSection";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { HomepageReviewsSection } from "@/components/landing/HomepageReviewsSection";
import { TrustMarquee } from "@/components/landing/TrustMarquee";
import {
  getHomepagePromoCourse,
  getHomepagePromoEbook,
  getPublishedHomeReviews,
  getUpcomingLiveSessions,
} from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

function moneyLabel(priceNpr: number, isFree?: boolean) {
  if (isFree || priceNpr <= 0) return "Free";
  return `NPR ${priceNpr.toLocaleString()}`;
}

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
  const [cms, liveSessions, homeReviews] = await Promise.all([
    getPublicCms(),
    getUpcomingLiveSessions(),
    getPublishedHomeReviews(6),
  ]);
  const hero = cms.sections["home.hero"];
  const stats = cms.sections["home.hero.stats"];
  const trust = cms.sections["home.trust"];
  const raju = cms.sections["home.raju"];
  const masterclass = cms.sections["home.masterclass"];
  const ebookPromo = cms.sections["home.ebookPromo"];
  const newsletter = cms.sections["home.newsletter"];
  const live = cms.sections["home.live"];
  const curriculum = cms.sections["home.curriculum"];
  const stories = cms.sections["home.stories"];
  const roadmap = cms.sections["home.roadmap"];
  const inside = cms.sections["home.inside"];
  const closing = cms.sections["home.cta"];

  const [featuredCourse, featuredEbook] = await Promise.all([
    masterclass?.enabled !== false
      ? getHomepagePromoCourse(masterclass?.data.courseSlug || undefined)
      : Promise.resolve(null),
    ebookPromo?.enabled !== false
      ? getHomepagePromoEbook(ebookPromo?.data.ebookSlug || undefined)
      : Promise.resolve(null),
  ]);

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
        {masterclass?.enabled !== false && featuredCourse && (
          <MasterclassSection
            badge={masterclass?.data.badge}
            title={masterclass?.data.title || featuredCourse.title}
            image={masterclass?.data.image || featuredCourse.coverImage || featuredCourse.image || undefined}
            imageAlt={masterclass?.data.imageAlt || featuredCourse.title}
            listPrice={masterclass?.data.listPrice || undefined}
            price={masterclass?.data.price || moneyLabel(featuredCourse.priceNpr)}
            cta={masterclass?.data.cta || "View course"}
            href={`/learn/${featuredCourse.slug}`}
            features={masterclass?.items.map((item) => item.data.text).filter(Boolean)}
          />
        )}
        {ebookPromo?.enabled !== false && featuredEbook && (
          <HomepageEbookSection
            badge={ebookPromo?.data.badge}
            title={ebookPromo?.data.title || featuredEbook.title}
            description={ebookPromo?.data.description || featuredEbook.description}
            image={ebookPromo?.data.image || featuredEbook.coverImage || undefined}
            listPrice={ebookPromo?.data.listPrice || undefined}
            price={ebookPromo?.data.price || moneyLabel(featuredEbook.priceNpr, featuredEbook.isFree)}
            cta={ebookPromo?.data.cta || "Get the ebook"}
            href={`/ebooks/${featuredEbook.slug}`}
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
        {stories?.enabled !== false && homeReviews.length > 0 && (
          <HomepageReviewsSection
            title={stories?.data.title}
            description={stories?.data.description}
            reviews={homeReviews}
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

