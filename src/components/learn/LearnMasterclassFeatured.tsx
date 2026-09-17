import Link from "next/link";
import { CmsImage } from "@/components/cms/CmsImage";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { SITE_ASSETS } from "@/lib/site-assets";

type Props = {
  courseSlug: string;
  title: string;
  titleNe?: string | null;
  subtitle?: string;
  description: string;
  image?: string | null;
  badge?: string;
  rating?: number;
  students?: number;
  priceNpr: number;
  listPrice?: string;
  cta?: string;
  features?: string[];
  paymentStatus?: string | null;
  previewHref?: string | null;
};

function moneyLabel(priceNpr: number) {
  return priceNpr <= 0 ? "Free" : `NPR ${priceNpr.toLocaleString()}`;
}

export function LearnMasterclassFeatured({
  courseSlug,
  title,
  titleNe,
  subtitle,
  description,
  image,
  badge,
  rating = 0,
  students = 0,
  priceNpr,
  listPrice,
  cta = "View course",
  features = [],
  paymentStatus,
  previewHref,
}: Props) {
  const approved = paymentStatus === "APPROVED";
  const playHref = approved
    ? `/study/${courseSlug}`
    : previewHref ?? `/learn/${courseSlug}`;

  return (
    <section className="bg-background py-xl" id="masterclass">
      <div className="site-container">
        <div className="mb-md">
          <span className="hero-badge">{badge || "Featured course"}</span>
          <h1 className="mt-md font-display-md text-display-md text-on-background">{title}</h1>
          {(subtitle || titleNe) && (
            <p className="mt-sm font-body-lg text-body-lg text-on-surface-variant">
              {subtitle || titleNe}
            </p>
          )}
        </div>

        <div className="flex flex-col overflow-hidden rounded-3xl bg-secondary lg:flex-row">
          <div className="relative min-h-[320px] lg:min-h-[400px] lg:w-1/2">
            <CmsImage
              src={image || SITE_ASSETS.cover}
              alt={title}
              fill
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                href={playHref}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-110"
                aria-label={approved ? "Continue learning" : "Open course"}
              >
                <MaterialIcon name="play_arrow" size={40} filled />
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-md p-xl lg:w-1/2">
            <div className="flex flex-wrap items-center gap-sm">
              <span className="rounded bg-tertiary-container/20 px-sm py-1 font-label-sm uppercase tracking-widest text-tertiary-container">
                {priceNpr <= 0 ? "Free course" : "Premium course"}
              </span>
              {rating > 0 && (
                <>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MaterialIcon key={i} name="star" filled />
                    ))}
                  </div>
                  <span className="font-label-sm text-secondary-fixed-dim">
                    {rating}
                    {students > 0 ? ` · ${students.toLocaleString()} students` : ""}
                  </span>
                </>
              )}
            </div>

            <p className="font-body-md text-secondary-fixed-dim">{description}</p>

            {features.length > 0 && (
              <ul className="space-y-sm">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-sm font-body-md text-secondary-fixed-dim">
                    <MaterialIcon name="check_circle" className="text-primary-fixed" filled />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-md pt-md sm:flex-row sm:items-center">
              <div>
                {listPrice ? (
                  <span className="block font-label-sm text-secondary-fixed-dim line-through">{listPrice}</span>
                ) : null}
                <span className="font-display-md text-display-md font-bold text-white">{moneyLabel(priceNpr)}</span>
              </div>
              {approved ? (
                <Button variant="primary" size="lg" className="flex-1 sm:flex-none" href={`/study/${courseSlug}`}>
                  Continue Learning
                </Button>
              ) : (
                <Button variant="primary" size="lg" className="flex-1 sm:flex-none" href={`/learn/${courseSlug}`}>
                  {cta}
                </Button>
              )}
              {previewHref && !approved ? (
                <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" href={previewHref}>
                  <MaterialIcon name="play_circle" />
                  Free preview
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
