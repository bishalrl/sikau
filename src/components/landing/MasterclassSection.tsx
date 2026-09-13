import Link from "next/link";
import { CmsImage } from "@/components/cms/CmsImage";
import { SITE_ASSETS } from "@/lib/site-assets";
import { MaterialIcon } from "./MaterialIcon";

type Props = {
  badge?: string;
  title?: string;
  image?: string;
  imageAlt?: string;
  listPrice?: string;
  price?: string;
  cta?: string;
  ctaHref?: string;
  features?: string[];
};

export function MasterclassSection({
  badge,
  title,
  image,
  imageAlt,
  listPrice,
  price,
  cta,
  ctaHref,
  features = [
    "4+ Hours of On-Demand HD Video",
    "Lifetime Access & Free Updates",
    "Exclusive Community Networking",
    "Ready-to-use Wealth Calculators",
  ],
}: Props = {}) {
  return (
    <section className="py-xl" id="learn">
      <div className="site-container">
        <div className="reveal active flex flex-col overflow-hidden rounded-3xl bg-secondary lg:flex-row">
          <div className="relative min-h-[220px] sm:min-h-[280px] lg:min-h-[400px] lg:w-1/2">
            <CmsImage
              src={image || SITE_ASSETS.raju3}
              alt={imageAlt || "Financial charts on tablet"}
              fill
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-110 sm:h-20 sm:w-20"
              >
                <MaterialIcon name="play_arrow" size={36} filled />
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-md p-6 sm:p-8 lg:w-1/2 lg:p-xl">
            <div className="flex flex-wrap items-center gap-xs">
              <span className="rounded bg-tertiary-container/20 px-sm py-1 font-label-sm uppercase tracking-widest text-tertiary-container">
                {badge || "Premium Course"}
              </span>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <MaterialIcon key={i} name="star" filled />
                ))}
              </div>
            </div>
            <h2 className="font-display-md text-display-md text-white">{title || "Personal Finance Masterclass"}</h2>
            <ul className="space-y-sm">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-sm font-body-md text-secondary-fixed-dim">
                  <MaterialIcon name="check_circle" className="text-primary-fixed" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-4 pt-md sm:flex-row sm:items-center sm:gap-lg">
              <div>
                <span className="block text-label-sm text-secondary-fixed-dim line-through">{listPrice || "NPR 4,999"}</span>
                <span className="text-2xl font-bold text-white sm:text-display-md">{price || "NPR 1,999"}</span>
              </div>
              <Link
                href={ctaHref || "/ebooks"}
                className="emerald-gradient rounded-xl py-3 text-center font-label-md text-white transition-all hover:brightness-110 sm:flex-1 sm:py-md"
              >
                {cta || "Get the Ebook"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
