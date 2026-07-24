import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { EnrollButton } from "@/components/learn/EnrollButton";
import { Button } from "@/components/ui/Button";
import { SITE_ASSETS } from "@/lib/site-assets";

const MASTERCLASS_IMAGE = SITE_ASSETS.cover;

const features = [
  "4+ Hours of On-Demand HD Video",
  "Lifetime Access & Free Updates",
  "Exclusive Community Networking",
  "Ready-to-use Wealth Calculators",
];

type Props = {
  courseSlug?: string;
  priceNpr?: number;
  paymentStatus?: string | null;
  previewHref?: string | null;
};

export function LearnMasterclassFeatured({
  courseSlug = "personal-finance-masterclass",
  priceNpr = 1999,
  paymentStatus,
  previewHref,
}: Props) {
  const approved = paymentStatus === "APPROVED";
  const playHref = approved
    ? `/study/${courseSlug}`
    : previewHref ?? `/login?callbackUrl=${encodeURIComponent(`/study/${courseSlug}`)}`;

  return (
    <section className="bg-background py-xl" id="masterclass">
      <div className="site-container">
        <div className="mb-md">
          <span className="hero-badge">Featured Masterclass</span>
          <h1 className="mt-md font-display-md text-display-md text-on-background">
            Personal Finance Masterclass
          </h1>
          <p className="mt-sm font-body-lg text-body-lg text-on-surface-variant">
            by Raju Khatiwada · राजु खतिवडाको पूर्ण वित्तीय मास्टरक्लास
          </p>
        </div>

        <div className="flex flex-col overflow-hidden rounded-3xl bg-secondary lg:flex-row">
          <div className="relative min-h-[320px] lg:min-h-[400px] lg:w-1/2">
            <Image
              src={MASTERCLASS_IMAGE}
              alt="Financial charts and learning materials"
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                href={playHref}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-110"
                aria-label={approved ? "Continue learning" : "Preview lesson"}
              >
                <MaterialIcon name="play_arrow" size={40} filled />
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-md p-xl lg:w-1/2">
            <div className="flex flex-wrap items-center gap-sm">
              <span className="rounded bg-tertiary-container/20 px-sm py-1 font-label-sm uppercase tracking-widest text-tertiary-container">
                Premium Course
              </span>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <MaterialIcon key={i} name="star" filled />
                ))}
              </div>
              <span className="font-label-sm text-secondary-fixed-dim">4.9 · 5,240 students</span>
            </div>

            <p className="font-body-md text-secondary-fixed-dim">
              Money mindset, portfolio building, real estate, side hustles, and retirement planning —
              tailored for the Nepali context.
            </p>

            <ul className="space-y-sm">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-sm font-body-md text-secondary-fixed-dim">
                  <MaterialIcon name="check_circle" className="text-primary-fixed" filled />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-md pt-md sm:flex-row sm:items-center">
              <div>
                <span className="block font-label-sm text-secondary-fixed-dim line-through">NPR 4,999</span>
                <span className="font-display-md text-display-md font-bold text-white">
                  NPR {priceNpr.toLocaleString()}
                </span>
              </div>
              {approved ? (
                <Button variant="primary" size="lg" className="flex-1 sm:flex-none" href={`/study/${courseSlug}`}>
                  Continue Learning
                </Button>
              ) : (
                <EnrollButton
                  courseSlug={courseSlug}
                  label="Enroll Now"
                  size="lg"
                  className="flex-1 sm:flex-none"
                />
              )}
              {previewHref && !approved ? (
                <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" href={previewHref}>
                  <MaterialIcon name="play_circle" />
                  Free preview
                </Button>
              ) : (
                !approved && (
                  <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" href={`/payment/${courseSlug}`}>
                    <MaterialIcon name="qr_code_2" />
                    Pay / Upload Receipt
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
