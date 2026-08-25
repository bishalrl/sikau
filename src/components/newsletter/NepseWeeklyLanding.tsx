"use client";

import Image from "next/image";
import Link from "next/link";
import { NewsletterBuyButton } from "@/components/newsletter/NewsletterBuyButton";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { SITE_ASSETS } from "@/lib/site-assets";

export type WeeklyPlan = {
  id: string;
  code: string;
  label: string;
  priceNpr: number;
  listPriceNpr: number | null;
  discountPercent: number | null;
  perDayNpr: number | null;
  badge: string | null;
  sortOrder: number;
};

type Props = {
  paymentStatus: string | null;
  communitySlug: string;
  plans: WeeklyPlan[];
  isLoggedIn: boolean;
};

const BENEFITS = [
  "Weekly Market Research PDF",
  "Stocks & Sectors to Watch",
  "1-Hour Live Market Session",
  "Next-Week Market Outlook",
];

const WHAT_YOU_GET = [
  {
    title: "Market Research",
    body: "What happened in NEPSE, sectors, companies and key market data.",
    icon: "analytics",
  },
  {
    title: "Weekly Watchlist",
    body: "Stocks, sectors and important levels to keep on your radar.",
    icon: "visibility",
  },
  {
    title: "Live Session",
    body: "A focused 1-hour live class to unpack the week with clarity.",
    icon: "videocam",
  },
  {
    title: "Next Week Outlook",
    body: "A clear view of what may matter in the week ahead.",
    icon: "event",
  },
];

const PREVIEWS = [
  { src: "/images/nepse-weekly/preview-1.jpg", label: "Market summary" },
  { src: "/images/nepse-weekly/preview-2.jpg", label: "Watchlist" },
  { src: "/images/nepse-weekly/preview-3.jpg", label: "Outlook" },
];

function badgeLabel(badge: string | null) {
  if (badge === "MOST_POPULAR") return "Most Popular";
  if (badge === "BEST_VALUE") return "Best Value";
  return null;
}

function PlanCta({
  paymentStatus,
  communitySlug,
  planCode,
  label,
  isLoggedIn,
  className,
}: {
  paymentStatus: string | null;
  communitySlug: string;
  planCode: string;
  label: string;
  isLoggedIn: boolean;
  className?: string;
}) {
  if (!isLoggedIn && paymentStatus !== "APPROVED") {
    const payPath = `/newsletter/pay?plan=${encodeURIComponent(planCode)}`;
    return (
      <div className={className}>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(payPath)}`}
          className="nepse-weekly__btn"
        >
          {label}
        </Link>
      </div>
    );
  }

  return (
    <NewsletterBuyButton
      paymentStatus={paymentStatus}
      communitySlug={communitySlug}
      planCode={planCode}
      label={label}
      className={className}
    />
  );
}

export default function NepseWeeklyLanding({
  paymentStatus,
  communitySlug,
  plans,
  isLoggedIn,
}: Props) {
  const monthly = plans.find((p) => p.code === "MONTHLY") ?? plans[0];
  const startingPrice = monthly?.priceNpr ?? 999;

  return (
    <div className="nepse-landing nepse-weekly">
      {/* 1. Hero */}
      <section className="nepse-hero nepse-weekly__hero">
        <div className="nepse-hero__glow" aria-hidden="true" />
        <div className="site-container nepse-hero__grid">
          <div className="nepse-hero__copy">
            <p className="nepse-weekly__brand">NEPSE WEEKLY</p>
            <h1 className="nepse-hero__title">
              Understand the Market. Know What to Watch.
            </h1>
            <p className="nepse-hero__subtitle">
              Weekly market research + 1-hour live session for Nepali investors.
            </p>
            <ul className="nepse-weekly__benefits">
              {BENEFITS.map((item) => (
                <li key={item}>
                  <MaterialIcon name="check_circle" className="text-[18px] text-primary" filled />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="nepse-weekly__starting">
              Starting at Rs. {startingPrice.toLocaleString()}/month
            </p>
            <div className="nepse-hero__cta">
              <PlanCta
                paymentStatus={paymentStatus}
                communitySlug={communitySlug}
                planCode={monthly?.code ?? "MONTHLY"}
                label="Join NEPSE Weekly"
                isLoggedIn={isLoggedIn}
                className="nepse-hero__cta-btn"
              />
              <Link href="#pricing" className="nepse-hero__secondary">
                See plans
              </Link>
            </div>
          </div>

          <div className="nepse-hero__visual">
            <div className="nepse-weekly__cover-frame">
              <Image
                src={SITE_ASSETS.cover}
                alt="NEPSE Weekly research report cover"
                width={900}
                height={1200}
                className="nepse-hero__cover"
                priority
              />
              <p className="nepse-weekly__cover-caption">NEPSE WEEKLY · Research Report</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. What you get */}
      <section className="nepse-section nepse-weekly__section">
        <div className="site-container">
          <div className="nepse-section__intro">
            <h2 className="nepse-heading">Everything You Need. Every Week.</h2>
          </div>
          <div className="nepse-weekly__get-grid">
            {WHAT_YOU_GET.map((card) => (
              <article key={card.title} className="nepse-weekly__get-card">
                <MaterialIcon name={card.icon} className="text-[28px] text-primary" />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Report preview */}
      <section className="nepse-section nepse-weekly__section nepse-weekly__preview-section">
        <div className="site-container">
          <div className="nepse-section__intro">
            <h2 className="nepse-heading">Inside This Week&apos;s Report</h2>
          </div>
          <div className="nepse-weekly__previews">
            {PREVIEWS.map((preview) => (
              <figure key={preview.label} className="nepse-weekly__preview-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.src} alt={preview.label} />
                <figcaption>{preview.label}</figcaption>
              </figure>
            ))}
          </div>
          <div className="nepse-weekly__preview-cta">
            <a
              href={SITE_ASSETS.pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="nepse-weekly__btn nepse-weekly__btn--outline"
            >
              View Sample Report
            </a>
          </div>
        </div>
      </section>

      {/* 4. Live session */}
      <section className="nepse-section nepse-weekly__section">
        <div className="site-container nepse-weekly__live">
          <div className="nepse-weekly__live-photo">
            <Image
              src={SITE_ASSETS.raju2}
              alt="Raju teaching a live market session"
              width={800}
              height={900}
              className="nepse-author__photo"
            />
          </div>
          <div className="nepse-weekly__live-copy">
            <p className="nepse-eyebrow">Live every week</p>
            <h2 className="nepse-heading">1-Hour Live Market Session</h2>
            <p className="nepse-lead">
              What happened → Why it happened → What&apos;s next.
            </p>
            <p className="nepse-weekly__live-line">
              Sit with Raju for a clear weekly debrief — research meets live teaching.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Pricing */}
      <section id="pricing" className="nepse-section nepse-weekly__section">
        <div className="site-container">
          <div className="nepse-section__intro">
            <h2 className="nepse-heading">Simple Plans. Clear Value.</h2>
          </div>
          <div className="nepse-weekly__plans">
            {plans.map((plan) => {
              const badge = badgeLabel(plan.badge);
              const featured = plan.badge === "MOST_POPULAR" || plan.badge === "BEST_VALUE";
              return (
                <article
                  key={plan.id}
                  className={`nepse-weekly__plan ${featured ? "nepse-weekly__plan--featured" : ""}`}
                >
                  {badge && <span className="nepse-weekly__plan-badge">{badge}</span>}
                  <h3>{plan.label}</h3>
                  <p className="nepse-weekly__plan-price">
                    {plan.listPriceNpr != null && (
                      <span className="nepse-price__was">
                        Rs {plan.listPriceNpr.toLocaleString()}
                      </span>
                    )}
                    <span className="nepse-weekly__plan-now">
                      Rs {plan.priceNpr.toLocaleString()}
                    </span>
                  </p>
                  {plan.discountPercent != null && (
                    <p className="nepse-weekly__plan-save">Save {plan.discountPercent}%</p>
                  )}
                  {plan.perDayNpr != null && (
                    <p className="nepse-weekly__plan-day">~Rs {plan.perDayNpr}/day</p>
                  )}
                  <PlanCta
                    paymentStatus={paymentStatus}
                    communitySlug={communitySlug}
                    planCode={plan.code}
                    label="Join"
                    isLoggedIn={isLoggedIn}
                    className="nepse-weekly__plan-cta"
                  />
                </article>
              );
            })}
          </div>
          <p className="nepse-weekly__plans-foot">
            Pay once for your plan. Access the private read-only updates group after admin approval.
          </p>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="nepse-section nepse-weekly__final">
        <div className="site-container">
          <h2 className="nepse-heading">Stay Clear on NEPSE. Every Week.</h2>
          <p className="nepse-lead">
            Research PDF + live session — join when you&apos;re ready.
          </p>
          <PlanCta
            paymentStatus={paymentStatus}
            communitySlug={communitySlug}
            planCode={monthly?.code ?? "MONTHLY"}
            label="Join NEPSE Weekly"
            isLoggedIn={isLoggedIn}
            className="nepse-weekly__final-cta"
          />
          <p className="nepse-weekly__disclaimer">
            Educational market research only. Not financial advice. Past performance does not
            guarantee future results.
          </p>
        </div>
      </section>
    </div>
  );
}
