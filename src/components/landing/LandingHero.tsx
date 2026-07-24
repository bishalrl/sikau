import Image from "next/image";
import Link from "next/link";
import { SITE_ASSETS } from "@/lib/site-assets";
import { MaterialIcon } from "./MaterialIcon";

const HERO_IMAGE = SITE_ASSETS.cover;

const benefits = [
  "Learn SIP investing step-by-step",
  "Understand life & health insurance",
  "Build long-term wealth with confidence",
  "Real examples from the Nepali market",
];

const socialProof = [
  { value: "45k+", label: "Trusted Nepalis", icon: "groups" },
  { value: "4.9", label: "Average rating", icon: "star" },
  { value: "100+", label: "Expert lessons", icon: "school" },
];

type Props = {
  badge?: string;
  title?: string;
  benefits?: string[];
};

export function LandingHero({ badge, title, benefits: contentBenefits }: Props) {
  const titleLines = (title ?? "Take Control of\n\nYour Money").split("\n").filter(Boolean);
  const finalBenefits = contentBenefits?.length ? contentBenefits : benefits;

  return (
    <section className="hero-section relative overflow-hidden py-12 md:py-16 lg:py-20">
      <div className="hero-bg-glow pointer-events-none absolute top-0 right-0 -z-10 h-full w-3/5 opacity-20" />

      <div className="hero-grid site-container">
        {/* Copy column — fixed readable width */}
        <div className="hero-copy reveal active">
          <div className="hero-badge">
            <MaterialIcon name="verified" className="text-[16px]" />
            {badge ?? "Nepal's Leading Financial Educator"}
          </div>

          <h1 className="hero-title">
            {titleLines[0] ?? "Take Control of"} <br />
            <span className="text-primary italic">{titleLines[1] ?? "Your Money"}</span>
          </h1>

          <div className="hero-social-proof">
            {socialProof.map((item) => (
              <div key={item.label} className="hero-stat">
                <MaterialIcon
                  name={item.icon}
                  className="text-[18px] text-primary"
                  filled={item.icon === "star"}
                />
                <div>
                  <span className="hero-stat-value">{item.value}</span>
                  <span className="hero-stat-label">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          <ul className="hero-benefits">
            {finalBenefits.map((benefit) => (
              <li key={benefit} className="hero-benefit">
                <MaterialIcon name="check_circle" className="shrink-0 text-[20px] text-primary" filled />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="hero-cta">
            <Link href="/ebooks" className="hero-btn-primary">
              Get the Ebook
            </Link>
            <button type="button" className="hero-btn-secondary">
              <MaterialIcon name="play_circle" />
              Watch Free Preview
            </button>
          </div>
        </div>

        {/* Image column */}
        <div className="hero-visual reveal active delay-200">
          <div className="hero-image-wrap">
            <Image
              src={HERO_IMAGE}
              alt="Raju Khatiwada teaching personal finance"
              width={640}
              height={720}
              className="hero-image"
              priority
            />
            <div className="hero-image-overlay" aria-hidden="true" />

            <div className="hero-growth-card">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MaterialIcon name="trending_up" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-on-background">+24.5%</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                  Portfolio Growth
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
