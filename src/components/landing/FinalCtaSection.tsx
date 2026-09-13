import Link from "next/link";

type Props = {
  title?: string;
  description?: string;
  primaryCta?: string;
  primaryHref?: string;
  secondaryCta?: string;
  secondaryHref?: string;
};

export function FinalCtaSection({
  title,
  description,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
}: Props = {}) {
  return (
    <section className="relative overflow-hidden bg-primary py-xl">
      <div className="relative z-10 site-container text-center">
        <h2 className="reveal active font-display-lg text-display-lg text-white">
          {title || "Your Financial Future Starts Today"}
        </h2>
        <p className="reveal active mt-md mx-auto max-w-2xl font-body-lg text-primary-fixed-dim delay-100">
          {description || "Join Raju and 45,000+ others in the mission to make Nepal financially literate and wealthy."}
        </p>
        <div className="reveal active mt-lg flex flex-col justify-center gap-md delay-200 sm:flex-row">
          <Link
            href={primaryHref || "/newsletter"}
            className="rounded-xl bg-white px-xl py-md font-bold text-primary shadow-2xl transition-transform hover:scale-105"
          >
            {primaryCta || "Subscribe to Newsletter"}
          </Link>
          <Link
            href={secondaryHref || "/ebooks"}
            className="rounded-xl border border-white px-xl py-md font-bold text-white transition-all hover:bg-white/10"
          >
            {secondaryCta || "Get the NEPSE Ebook"}
          </Link>
        </div>
      </div>
    </section>
  );
}
