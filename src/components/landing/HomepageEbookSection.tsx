import Link from "next/link";
import { CmsImage } from "@/components/cms/CmsImage";
import { SITE_ASSETS } from "@/lib/site-assets";
import { MaterialIcon } from "./MaterialIcon";

type Props = {
  badge?: string;
  title?: string;
  description?: string;
  image?: string;
  listPrice?: string;
  price?: string;
  cta?: string;
  href?: string;
};

export function HomepageEbookSection({
  badge,
  title,
  description,
  image,
  listPrice,
  price,
  cta,
  href,
}: Props) {
  if (!href) return null;

  return (
    <section className="pb-xl" id="ebook">
      <div className="site-container">
        <div className="reveal active overflow-hidden rounded-3xl border border-outline-variant/30 bg-white">
          <div className="grid items-stretch lg:grid-cols-[280px_1fr]">
            <div className="relative min-h-[220px] bg-surface-container">
              <CmsImage
                src={image || SITE_ASSETS.cover}
                alt={title || "Ebook cover"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center gap-md p-6 sm:p-8 lg:p-xl">
              <span className="w-fit rounded bg-primary/10 px-sm py-1 font-label-sm uppercase tracking-widest text-primary">
                {badge || "Ebook"}
              </span>
              <h2 className="font-display-md text-display-md text-on-background">{title || "Featured ebook"}</h2>
              {description && <p className="max-w-2xl text-on-surface-variant">{description}</p>}
              <div className="flex flex-col gap-4 pt-sm sm:flex-row sm:items-center">
                <div>
                  {listPrice && (
                    <span className="block text-label-sm text-on-surface-variant line-through">{listPrice}</span>
                  )}
                  <span className="text-2xl font-bold text-on-background">{price || "Free"}</span>
                </div>
                <Link
                  href={href}
                  className="emerald-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-center font-label-md text-white transition-all hover:brightness-110"
                >
                  {cta || "Get the ebook"}
                  <MaterialIcon name="arrow_forward" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
