import Image from "next/image";
import Link from "next/link";
import { EbookBuyButton } from "@/components/ebooks/EbookBuyButton";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import {
  DEFAULT_SOLO_FEATURES,
  accessTypeLabel,
  ebookHasCommunityOffer,
  parseAudience,
  parseBenefits,
  parseCurriculum,
} from "@/lib/ebook-offer";
import { SITE_ASSETS } from "@/lib/site-assets";

type EbookDetail = {
  slug: string;
  title: string;
  titleNe: string | null;
  headline: string | null;
  description: string;
  coverImage: string | null;
  priceNpr: number;
  isFree: boolean;
  curriculumJson: string;
  audienceJson: string;
  communityOfferEnabled: boolean;
  communityOfferName: string | null;
  communityOfferPriceNpr: number | null;
  communityAccessType: string | null;
  communityBenefitsJson: string;
  paymentStatus: string | null;
  purchaseType: string | null;
  community: { id: string; slug: string; name: string } | null;
};

type Props = {
  ebook: EbookDetail;
};

export function EbookProductDetail({ ebook }: Props) {
  const curriculum = parseCurriculum(ebook.curriculumJson);
  const audience = parseAudience(ebook.audienceJson);
  const benefits = parseBenefits(ebook.communityBenefitsJson);
  const hasCommunity = ebookHasCommunityOffer(ebook);
  const approved = ebook.paymentStatus === "APPROVED";
  const hasBundle =
    approved && ebook.purchaseType === "COMMUNITY_BUNDLE";
  const communityName = ebook.communityOfferName?.trim() || ebook.community?.name || "Community";
  const headline =
    ebook.headline?.trim() ||
    ebook.title;

  const soloFeatures = DEFAULT_SOLO_FEATURES;
  const communityFeatures = [
    "Everything in Ebook Only",
    ...benefits,
    `${accessTypeLabel(ebook.communityAccessType)} community access`,
  ];

  return (
    <div className="nepse-landing">
      <section className="nepse-hero">
        <div className="nepse-hero__glow" aria-hidden="true" />
        <div className="site-container nepse-hero__grid">
          <div className="nepse-hero__copy">
            <Link href="/ebooks" className="nepse-hero__secondary">
              ← All ebooks
            </Link>
            <p className="nepse-hero__brand mt-4">{ebook.title}</p>
            <h1 className="nepse-hero__title">{headline}</h1>
            {ebook.titleNe && <p className="mt-2 text-lg text-primary">{ebook.titleNe}</p>}
            <p className="nepse-hero__subtitle">{ebook.description}</p>
            <div className="nepse-hero__cta">
              {approved ? (
                <EbookBuyButton
                  ebookSlug={ebook.slug}
                  label={hasBundle ? "Open ebook" : "Start reading"}
                  purchaseType="SOLO_EBOOK"
                  className="nepse-hero__cta-btn"
                />
              ) : (
                <EbookBuyButton
                  ebookSlug={ebook.slug}
                  label={ebook.isFree ? "Read free ebook" : "Get the Ebook"}
                  purchaseType="SOLO_EBOOK"
                  className="nepse-hero__cta-btn"
                />
              )}
              <Link href="#access" className="nepse-hero__secondary">
                See access options
              </Link>
            </div>
          </div>
          <div className="nepse-hero__visual">
            <Image
              src={ebook.coverImage || SITE_ASSETS.cover}
              alt={`${ebook.title} cover`}
              width={900}
              height={1200}
              className="nepse-hero__cover"
              priority
            />
          </div>
        </div>
      </section>

      {curriculum.length > 0 && (
        <section className="nepse-section">
          <div className="site-container">
            <div className="nepse-section__intro">
              <p className="nepse-eyebrow">Curriculum</p>
              <h2 className="nepse-heading">What you&apos;ll learn</h2>
            </div>
            <ul className="nepse-phases">
              {curriculum.map((item) => (
                <li key={`${item.phase}-${item.title}`} className="nepse-phase">
                  <span className="nepse-phase__number">{item.phase}</span>
                  <div>
                    <p className="nepse-phase__label">{item.title}</p>
                    <p className="nepse-phase__detail">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {audience.length > 0 && (
        <section className="nepse-section">
          <div className="site-container">
            <div className="nepse-section__intro">
              <p className="nepse-eyebrow">Audience</p>
              <h2 className="nepse-heading">Who this is for</h2>
            </div>
            <ul className="nepse-package__features max-w-2xl">
              {audience.map((item) => (
                <li key={item}>
                  <MaterialIcon name="check_circle" className="text-[18px] text-primary" filled />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="access" className="nepse-section">
        <div className="site-container">
          <div className="nepse-section__intro">
            <p className="nepse-eyebrow">Pricing</p>
            <h2 className="nepse-heading">Choose your access</h2>
            <p className="nepse-lead">
              {hasCommunity
                ? "Buy the ebook alone, or unlock this ebook’s community offer."
                : "Get lifetime reading access to this ebook."}
            </p>
          </div>

          <div className={`nepse-packages ${hasCommunity ? "" : "max-w-lg"}`}>
            <article className="nepse-package">
              <h3 className="nepse-package__name">Ebook Only</h3>
              <p className="nepse-package__price">
                {ebook.isFree || ebook.priceNpr <= 0 ? (
                  <span className="nepse-price__now">Free</span>
                ) : (
                  <span className="nepse-price__now">
                    Rs <span>{ebook.priceNpr.toLocaleString()}</span>
                  </span>
                )}
              </p>
              <ul className="nepse-package__features">
                {soloFeatures.map((feature) => (
                  <li key={feature}>
                    <MaterialIcon name="check_circle" className="text-[18px] text-primary" filled />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <EbookBuyButton
                ebookSlug={ebook.slug}
                label={
                  approved
                    ? "Open ebook"
                    : ebook.isFree
                      ? "Read Free Ebook"
                      : "Get the Ebook"
                }
                purchaseType="SOLO_EBOOK"
              />
            </article>

            {hasCommunity && (
              <article className="nepse-package nepse-package--popular">
                <span className="nepse-package__badge">Community</span>
                <h3 className="nepse-package__name">Ebook + {communityName}</h3>
                <p className="nepse-package__price">
                  <span className="nepse-price__now">
                    Rs <span>{(ebook.communityOfferPriceNpr ?? 0).toLocaleString()}</span>
                  </span>
                </p>
                <p className="nepse-package__summary">
                  {accessTypeLabel(ebook.communityAccessType)} access to {communityName}.
                </p>
                <ul className="nepse-package__features">
                  {communityFeatures.map((feature) => (
                    <li key={feature}>
                      <MaterialIcon name="check_circle" className="text-[18px] text-primary" filled />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <EbookBuyButton
                  ebookSlug={ebook.slug}
                  label={hasBundle ? "Open community ebook" : "Join Community"}
                  purchaseType="COMMUNITY_BUNDLE"
                />
              </article>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
