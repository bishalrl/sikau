import Image from "next/image";
import Link from "next/link";
import { EbookBuyButton } from "@/components/ebooks/EbookBuyButton";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { formatPromoEndsLabel, getEbookDisplayPricing } from "@/lib/ebook-pricing";
import { SITE_ASSETS } from "@/lib/site-assets";

const EBOOK_SLUG = "nepse-trading-guide";
const COMMUNITY_SLUG = "nepse-trading-community";

type DbPricing = {
  slug: string;
  priceNpr: number;
  listPriceNpr: number | null;
  promoEndsAt: Date | null;
  isFree: boolean;
};

const packageMeta = [
  {
    id: "ebook",
    slug: EBOOK_SLUG,
    name: "Ebook Only",
    fallbackPrice: 599,
    popular: false,
    summary: "Get the complete NEPSE trading guide and learn at your own pace.",
    features: [
      "Full ebook access",
      "3 proven trading strategies",
      "7 critical indicators explained",
      "Step-by-step NEPSE roadmap",
      "Lifetime reading access",
    ],
    cta: "Get the Ebook",
  },
  {
    id: "community",
    slug: COMMUNITY_SLUG,
    name: "Lifetime Community Access",
    fallbackPrice: 999,
    popular: true,
    summary: "Everything in the ebook, plus ongoing mentorship and live sessions.",
    features: [
      "Everything in Ebook Only",
      "Lifetime community access",
      "Entry to every monthly live session",
      "Ask questions and get guidance",
      "Stay accountable with fellow traders",
    ],
    cta: "Join Community Bundle",
  },
] as const;

function buildPackages(pricingRows: DbPricing[]) {
  const bySlug = new Map(pricingRows.map((row) => [row.slug, row]));

  return packageMeta.map((meta) => {
    const db = bySlug.get(meta.slug);
    const display = db
      ? getEbookDisplayPricing(db)
      : getEbookDisplayPricing({ priceNpr: meta.fallbackPrice, isFree: false });

    return {
      ...meta,
      price: display.price || meta.fallbackPrice,
      listPrice: display.listPrice,
      promoActive: display.promoActive,
      promoEndsAt: db?.promoEndsAt ?? null,
    };
  });
}

function NepsePrice({
  price,
  listPrice,
  compact,
}: {
  price: number;
  listPrice: number | null;
  compact?: boolean;
}) {
  return (
    <p className={compact ? "nepse-price-card__amount" : "nepse-package__price"}>
      {listPrice != null && (
        <span className="nepse-price__was">Rs {listPrice.toLocaleString()}</span>
      )}
      <span className={compact ? undefined : "nepse-price__now"}>
        {compact ? `Rs ${price.toLocaleString()}` : <>Rs <span>{price}</span></>}
      </span>
    </p>
  );
}

const phases = [
  { phase: "Phase 1", title: "Mindset & Introduction", detail: "Build the right foundation before you place a single trade." },
  { phase: "Phase 2", title: "Stock Market Basics", detail: "Understand how NEPSE works in clear, practical language." },
  { phase: "Phase 3", title: "Technical Analysis Foundations", detail: "Read charts with confidence using essential tools." },
  { phase: "Phase 4", title: "Core Trading Strategies", detail: "Apply 3 proven strategies designed for Nepali markets." },
  { phase: "Phase 5", title: "Risk Management & Execution", detail: "Protect capital and execute trades with discipline." },
  { phase: "Phase 6", title: "Psychology & Next Steps", detail: "Master emotions and create your personal trading plan." },
];

const audience = [
  "Complete beginners with zero trading knowledge",
  "Anyone who has lost money and wants to understand why",
  "People who want a calm, practical approach",
];

const comparisonRows = [
  { label: "Full NEPSE trading ebook", ebook: true, community: true },
  { label: "3 proven strategies + 7 indicators", ebook: true, community: true },
  { label: "Self-paced reading access", ebook: true, community: true },
  { label: "Lifetime community membership", ebook: false, community: true },
  { label: "Monthly live trading sessions", ebook: false, community: true },
  { label: "Ongoing Q&A and accountability", ebook: false, community: true },
];

export default function NepseEbookLanding({ pricingRows = [] }: { pricingRows?: DbPricing[] }) {
  const packages = buildPackages(pricingRows);
  const ebookPkg = packages.find((p) => p.slug === EBOOK_SLUG)!;
  const communityPkg = packages.find((p) => p.slug === COMMUNITY_SLUG)!;
  const promoPkg = packages.find((p) => p.promoActive && p.promoEndsAt);

  return (
    <div className="nepse-landing">
      {promoPkg?.promoEndsAt && (
        <div className="nepse-promo-banner" role="status">
          <MaterialIcon name="schedule" className="text-[20px]" />
          <span>
            Limited-time pricing — offer ends {formatPromoEndsLabel(promoPkg.promoEndsAt)}
          </span>
        </div>
      )}
      {/* Hero */}
      <section className="nepse-hero">
        <div className="nepse-hero__glow" aria-hidden="true" />
        <div className="site-container nepse-hero__grid">
          <div className="nepse-hero__copy">
            <p className="nepse-hero__brand">Sikau Paisa</p>
            <h1 className="nepse-hero__title">
              From Confused to Confident: Your Step-by-Step Guide to Professional Trading in{" "}
              <span>NEPSE</span>.
            </h1>
            <p className="nepse-hero__subtitle">
              No complex jargon. No guessing. Just 3 proven strategies, 7 critical indicators, and a
              direct roadmap to master the Nepalese stock market.
            </p>
            <div className="nepse-hero__cta">
              <EbookBuyButton
                ebookSlug={COMMUNITY_SLUG}
                label="Start Your Trading Journey Now"
                className="nepse-hero__cta-btn"
              />
              <Link href="#packages" className="nepse-hero__secondary">
                See selling options
              </Link>
              <Link href="#compare" className="nepse-hero__secondary">
                Compare both
              </Link>
            </div>
          </div>

          <div className="nepse-hero__visual">
            <Image
              src={SITE_ASSETS.cover}
              alt="NEPSE Trading Guide ebook cover"
              width={900}
              height={1200}
              className="nepse-hero__cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="nepse-section">
        <div className="site-container">
          <div className="nepse-section__intro">
            <p className="nepse-eyebrow">Choose your path</p>
            <h2 className="nepse-heading">Two ways to start</h2>
            <p className="nepse-lead">
              Pick the ebook alone, or unlock lifetime community access with every monthly live session.
            </p>
          </div>

          <div className="nepse-packages">
            {packages.map((pkg) => (
              <article
                key={pkg.id}
                className={`nepse-package ${pkg.popular ? "nepse-package--popular" : ""}`}
              >
                {pkg.popular && <span className="nepse-package__badge">Popular</span>}
                <h3 className="nepse-package__name">{pkg.name}</h3>
                <NepsePrice price={pkg.price} listPrice={pkg.listPrice} />
                <p className="nepse-package__summary">{pkg.summary}</p>
                <ul className="nepse-package__features">
                  {pkg.features.map((feature) => (
                    <li key={feature}>
                      <MaterialIcon name="check_circle" className="text-[18px] text-primary" filled />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <EbookBuyButton
                  ebookSlug={pkg.slug}
                  label={pkg.cta}
                  variant={pkg.popular ? "primary" : "outline"}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="nepse-section nepse-section--muted">
        <div className="site-container">
          <div className="nepse-section__intro">
            <p className="nepse-eyebrow">Curriculum</p>
            <h2 className="nepse-heading">What You&apos;ll Learn</h2>
            <p className="nepse-lead">A clear six-phase roadmap from beginner mindset to confident execution.</p>
          </div>

          <ol className="nepse-phases">
            {phases.map((item, index) => (
              <li key={item.phase} className="nepse-phase">
                <span className="nepse-phase__number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="nepse-phase__label">{item.phase}</p>
                  <h3 className="nepse-phase__title">{item.title}</h3>
                  <p className="nepse-phase__detail">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Who this is for */}
      <section className="nepse-section">
        <div className="site-container nepse-audience">
          <div>
            <p className="nepse-eyebrow">Audience</p>
            <h2 className="nepse-heading">Who This Is For</h2>
          </div>
          <ul className="nepse-audience__list">
            {audience.map((item) => (
              <li key={item}>
                <MaterialIcon name="person" className="text-[22px] text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Compare */}
      <section id="compare" className="nepse-section nepse-section--muted">
        <div className="site-container">
          <div className="nepse-section__intro">
            <p className="nepse-eyebrow">Side by side</p>
            <h2 className="nepse-heading">Compare both</h2>
            <p className="nepse-lead">See exactly what you get with each option.</p>
          </div>

          <div className="nepse-compare">
            <table className="nepse-compare__table">
              <thead>
                <tr>
                  <th scope="col">What&apos;s included</th>
                  <th scope="col">Ebook<br /><span>Rs {ebookPkg.price}</span></th>
                  <th scope="col">Community<br /><span>Rs {communityPkg.price} · Popular</span></th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>
                      <span className="nepse-compare__icon" aria-hidden="true">
                        {row.ebook ? (
                          <MaterialIcon name="check_circle" className="text-primary" filled />
                        ) : (
                          <MaterialIcon name="cancel" className="text-outline" />
                        )}
                      </span>
                      <span className="sr-only">{row.ebook ? "Included" : "Not included"}</span>
                    </td>
                    <td>
                      <span className="nepse-compare__icon" aria-hidden="true">
                        {row.community ? (
                          <MaterialIcon name="check_circle" className="text-primary" filled />
                        ) : (
                          <MaterialIcon name="cancel" className="text-outline" />
                        )}
                      </span>
                      <span className="sr-only">{row.community ? "Included" : "Not included"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section id="pricing" className="nepse-section">
        <div className="site-container">
          <div className="nepse-section__intro">
            <p className="nepse-eyebrow">Pricing</p>
            <h2 className="nepse-heading">Simple pricing</h2>
            <p className="nepse-lead">One payment. Clear value. Start whenever you&apos;re ready.</p>
          </div>

          <div className="nepse-pricing">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`nepse-price-card ${pkg.popular ? "nepse-price-card--popular" : ""}`}>
                {pkg.popular && <span className="nepse-package__badge">Popular</span>}
                <p className="nepse-price-card__name">{pkg.name}</p>
                <NepsePrice price={pkg.price} listPrice={pkg.listPrice} compact />
                <EbookBuyButton
                  ebookSlug={pkg.slug}
                  label={
                    pkg.popular
                      ? "Start Your Trading Journey Now"
                      : `Buy Ebook — Rs ${pkg.price.toLocaleString()}`
                  }
                  variant={pkg.popular ? "primary" : "outline"}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
