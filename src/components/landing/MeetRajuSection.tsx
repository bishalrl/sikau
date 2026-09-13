import Link from "next/link";
import { CmsImage } from "@/components/cms/CmsImage";
import { SITE_ASSETS } from "@/lib/site-assets";
import { MaterialIcon } from "./MaterialIcon";

type Props = {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  quote?: string;
  cta?: string;
  ctaHref?: string;
  timeline?: Array<{ title: string; description: string }>;
};

const fallbackTimeline = [
  {
    title: "The Beginning",
    description: "Navigating the complexities of first-time saving.",
  },
  {
    title: "Mastering the Market",
    description: "Years of learning institutional-grade investment strategies.",
  },
  {
    title: "Sikau Paisa Launch",
    description: "Creating a platform for democratized financial literacy.",
    last: true,
  },
];

export function MeetRajuSection({
  title,
  description,
  image,
  imageAlt,
  quote,
  cta,
  ctaHref,
  timeline = fallbackTimeline,
}: Props = {}) {
  return (
    <section className="bg-surface-container-low py-xl" id="community">
      <div className="site-container">
        <div className="grid grid-cols-1 items-center gap-xl lg:grid-cols-2">
          <div className="reveal active order-2 lg:order-1">
            <div className="relative inline-block">
              <CmsImage
                src={image || SITE_ASSETS.raju2}
                alt={imageAlt || "Raju Khatiwada teaching"}
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -right-8 -bottom-8 max-w-[200px] rounded-2xl bg-tertiary-container p-lg text-on-tertiary-container shadow-xl">
                <MaterialIcon name="format_quote" className="mb-xs text-display-md" filled />
                <p className="font-label-md italic">&quot;{quote || "Financial freedom isn't a dream, it's a calculated plan."}&quot;</p>
              </div>
            </div>
          </div>
          <div className="reveal active order-1 space-y-md lg:order-2">
            <h2 className="font-display-md text-display-md text-on-background">{title || "Meet Raju Khatiwada"}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {description ||
                "With over a decade of experience in financial markets and education, Raju has simplified complex investing for thousands of Nepalis worldwide."}
            </p>
            <div className="space-y-md pt-md">
              {timeline.map((item, index) => (
                <div key={item.title} className="flex gap-md">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-primary ring-4 ring-primary/20" />
                    {index < timeline.length - 1 && <div className="h-12 w-0.5 bg-outline-variant" />}
                  </div>
                  <div>
                    <h4 className="font-label-md text-primary">{item.title}</h4>
                    <p className="text-sm text-on-surface-variant">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {ctaHref ? (
              <Link href={ctaHref} className="mt-md inline-flex items-center gap-xs rounded-xl border border-primary px-xl py-md font-label-md text-primary transition-all hover:bg-primary hover:text-white">
                {cta || "Watch My Story"} <MaterialIcon name="arrow_forward" />
              </Link>
            ) : (
              <button type="button" className="mt-md flex items-center gap-xs rounded-xl border border-primary px-xl py-md font-label-md text-primary transition-all hover:bg-primary hover:text-white">
                {cta || "Watch My Story"} <MaterialIcon name="arrow_forward" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
