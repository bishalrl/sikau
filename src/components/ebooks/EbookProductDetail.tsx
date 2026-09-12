import Link from "next/link";
import ReactMarkdown from "react-markdown";
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

type EbookDetail = {
  slug: string;
  title: string;
  titleNe: string | null;
  headline: string | null;
  description: string;
  content: string;
  coverImage: string | null;
  priceNpr: number;
  listPriceNpr: number | null;
  promoEndsAt: string | null;
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
  authorName: string | null;
  community: { id: string; slug: string; name: string } | null;
};

type Props = {
  ebook: EbookDetail;
};

function money(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

export function EbookProductDetail({ ebook }: Props) {
  const curriculum = parseCurriculum(ebook.curriculumJson);
  const audience = parseAudience(ebook.audienceJson);
  const benefits = parseBenefits(ebook.communityBenefitsJson);
  const hasCommunity = ebookHasCommunityOffer(ebook);
  const approved = ebook.paymentStatus === "APPROVED";
  const hasBundle = approved && ebook.purchaseType === "COMMUNITY_BUNDLE";
  const communityName = ebook.communityOfferName?.trim() || ebook.community?.name || "Community";
  const free = ebook.isFree || ebook.priceNpr <= 0;
  const body = ebook.content?.trim() ?? "";
  const showList = !free && ebook.listPriceNpr != null && ebook.listPriceNpr > ebook.priceNpr;
  const promo = ebook.promoEndsAt ? new Date(ebook.promoEndsAt) : null;
  const promoActive = promo && !Number.isNaN(promo.getTime()) && promo.getTime() > Date.now();
  const soloLabel = approved ? "Start reading" : free ? "Read free ebook" : "Get the ebook";

  const communityFeatures = [
    "Everything in the ebook",
    ...benefits,
    `${accessTypeLabel(ebook.communityAccessType)} access`,
  ];

  return (
    <div className="ebook-detail">
      <div className="site-container ebook-detail__wrap">
        <Link href="/ebooks" className="ebook-detail__back">
          ← All ebooks
        </Link>

        <div className="ebook-detail__layout">
          <figure className="ebook-detail__cover">
            {ebook.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ebook.coverImage} alt={`${ebook.title} cover`} />
            ) : (
              <div className="ebook-detail__cover-fallback">Cover not added yet</div>
            )}
          </figure>

          <div>
            <p className="ebook-detail__eyebrow">Ebook</p>
            <h1 className="ebook-detail__title">{ebook.title}</h1>
            {ebook.titleNe && <p className="ebook-detail__ne">{ebook.titleNe}</p>}
            {ebook.headline?.trim() && ebook.headline.trim() !== ebook.title && (
              <p className="ebook-detail__headline">{ebook.headline}</p>
            )}
            {ebook.description?.trim() && <p className="ebook-detail__lead">{ebook.description}</p>}

            <div className="ebook-detail__meta">
              {ebook.authorName && <span className="ebook-detail__chip">{ebook.authorName}</span>}
              <span className="ebook-detail__chip">{free ? "Free" : "Paid"}</span>
              {approved && <span className="ebook-detail__chip">Unlocked</span>}
              {hasCommunity && <span className="ebook-detail__chip">Community offer</span>}
            </div>

            <nav className="ebook-detail__nav" aria-label="On this page">
              {body && <a href="#about">About</a>}
              {curriculum.length > 0 && <a href="#learn">What you&apos;ll learn</a>}
              {audience.length > 0 && <a href="#audience">Who it&apos;s for</a>}
              <a href="#access">Access</a>
            </nav>

            {body && (
              <section id="about" className="ebook-detail__section">
                <h2>About this ebook</h2>
                <article className="ebook-detail__copy">
                  <ReactMarkdown>{body}</ReactMarkdown>
                </article>
              </section>
            )}

            {curriculum.length > 0 && (
              <section id="learn" className="ebook-detail__section">
                <h2>What you&apos;ll learn</h2>
                <ol className="ebook-detail__learn">
                  {curriculum.map((item, index) => (
                    <li key={`${item.phase}-${item.title}`}>
                      <span className="ebook-detail__phase">{item.phase || `Part ${index + 1}`}</span>
                      <div>
                        <strong>{item.title}</strong>
                        {item.detail && <p>{item.detail}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {audience.length > 0 && (
              <section id="audience" className="ebook-detail__section">
                <h2>Who this is for</h2>
                <ul className="ebook-detail__audience">
                  {audience.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside id="access" className="ebook-detail__buy">
            <p className="ebook-detail__eyebrow">{free ? "Read now" : "Ebook only"}</p>
            <p className="ebook-detail__price">
              {showList && <span className="ebook-detail__was">{money(ebook.listPriceNpr as number)}</span>}
              {free ? "Free" : money(ebook.priceNpr)}
            </p>
            {promoActive && (
              <p className="ebook-detail__offer">
                Offer ends {promo.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
            <ul className="ebook-detail__features">
              {DEFAULT_SOLO_FEATURES.map((feature) => (
                <li key={feature}>
                  <MaterialIcon name="check_circle" className="text-[18px] text-primary" filled />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <EbookBuyButton
                ebookSlug={ebook.slug}
                label={soloLabel}
                purchaseType="SOLO_EBOOK"
                alreadyUnlocked={approved}
                isFree={free}
              />
            </div>

            {hasCommunity && (
              <div className="ebook-detail__bundle">
                <p className="ebook-detail__eyebrow">Ebook + {communityName}</p>
                <p className="ebook-detail__price">{money(ebook.communityOfferPriceNpr ?? 0)}</p>
                <p className="ebook-detail__lead" style={{ marginTop: 6 }}>
                  {accessTypeLabel(ebook.communityAccessType)} access to {communityName}.
                </p>
                <ul className="ebook-detail__features">
                  {communityFeatures.map((feature) => (
                    <li key={feature}>
                      <MaterialIcon name="check_circle" className="text-[18px] text-primary" filled />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <EbookBuyButton
                    ebookSlug={ebook.slug}
                    label={hasBundle ? "Open community ebook" : "Join community"}
                    purchaseType="COMMUNITY_BUNDLE"
                    alreadyUnlocked={hasBundle}
                    variant="secondary"
                  />
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="ebook-detail__dock">
        <div>
          <p className="ebook-detail__price">{free ? "Free" : money(ebook.priceNpr)}</p>
          <p className="text-xs text-on-surface-variant">{ebook.title}</p>
        </div>
        <div className="min-w-[150px]">
          <EbookBuyButton
            ebookSlug={ebook.slug}
            label={approved ? "Read" : free ? "Read" : "Get ebook"}
            purchaseType="SOLO_EBOOK"
            alreadyUnlocked={approved}
            isFree={free}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
