import Link from "next/link";
import { CmsImage } from "@/components/cms/CmsImage";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { GrowthChart } from "@/components/motion/GrowthChart";
import { SITE_ASSETS } from "@/lib/site-assets";
import { MaterialIcon } from "./MaterialIcon";

type Props = {
  badge?: string;
  titleLine1?: string;
  titleLine2?: string;
  image?: string;
  imageAlt?: string;
  primaryCta?: string;
  primaryHref?: string;
  secondaryCta?: string;
  secondaryHref?: string;
  benefits?: string[];
  stats?: Array<{ value: string; label: string; icon: string }>;
};

export function LandingHero({
  badge,
  titleLine1,
  titleLine2,
  image,
  imageAlt,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
  benefits = [],
  stats = [],
}: Props) {
  const finalBenefits = benefits.length
    ? benefits
    : [
        "Learn SIP investing step-by-step",
        "Understand life & health insurance",
        "Build long-term wealth with confidence",
        "Real examples from the Nepali market",
      ];
  const socialProof = stats.length
    ? stats
    : [
        { value: "45k+", label: "Trusted Nepalis", icon: "groups" },
        { value: "4.9", label: "Average rating", icon: "star" },
        { value: "100+", label: "Expert lessons", icon: "school" },
      ];

  const line1 = titleLine1 || "Take Control of";
  const line2 = titleLine2 || "Your Money";

  return (
    <section className="hero-section relative overflow-hidden py-12 md:py-16 lg:py-20">
      <div className="hero-grid site-container">
        <div className="hero-copy">
          <div className="hero-badge hero-entrance hero-entrance--1">
            <MaterialIcon name="verified" className="text-[16px]" />
            {badge || "Nepal's Leading Financial Educator"}
          </div>

          <h1 className="hero-title">
            <span className="hero-title__line hero-entrance hero-entrance--2">{line1}</span>
            <span className="hero-title__line text-primary italic hero-entrance hero-entrance--3">
              {line2}
            </span>
          </h1>

          <div className="hero-social-proof hero-entrance hero-entrance--4">
            {socialProof.map((item) => (
              <div key={item.label} className="hero-stat group">
                <MaterialIcon
                  name={item.icon}
                  className="text-[18px] text-primary transition-transform duration-300 group-hover:scale-105"
                  filled={item.icon === "star"}
                />
                <div>
                  <AnimatedNumber value={item.value} className="hero-stat-value" />
                  <span className="hero-stat-label">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          <ul className="hero-benefits hero-entrance hero-entrance--5">
            {finalBenefits.map((benefit) => (
              <li key={benefit} className="hero-benefit">
                <MaterialIcon name="check_circle" className="shrink-0 text-[20px] text-primary" filled />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="hero-cta hero-entrance hero-entrance--6">
            <Link href={primaryHref || "/ebooks"} className="hero-btn-primary btn-arrow">
              <span>{primaryCta || "Get the Ebook"}</span>
              <span className="btn-arrow__icon" aria-hidden="true">
                →
              </span>
            </Link>
            {secondaryHref ? (
              <Link href={secondaryHref} className="hero-btn-secondary">
                <MaterialIcon name="play_circle" />
                {secondaryCta || "Watch Free Preview"}
              </Link>
            ) : (
              <button type="button" className="hero-btn-secondary">
                <MaterialIcon name="play_circle" />
                {secondaryCta || "Watch Free Preview"}
              </button>
            )}
          </div>
        </div>

        <div className="hero-visual hero-entrance hero-entrance--5">
          <div className="hero-image-wrap media-zoom">
            <CmsImage
              src={image || SITE_ASSETS.raju1}
              alt={imageAlt || "Raju Khatiwada teaching personal finance"}
              width={640}
              height={720}
              className="hero-image"
            />
            <div className="hero-image-overlay" aria-hidden="true" />

            <div className="hero-growth-card">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon name="trending_up" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-on-background">+24.5%</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                  Portfolio Growth
                </p>
                <GrowthChart className="mt-1 h-8 w-full text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
