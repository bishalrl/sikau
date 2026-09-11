import Link from "next/link";
import { getActiveNewsletterProduct } from "@/lib/newsletter";

export async function HomepageNewsletterSection() {
  try {
    const product = await getActiveNewsletterProduct();
    if (!product) return null;

    return (
      <section className="site-container py-xl">
        <div className="overflow-hidden rounded-[1.5rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-surface to-surface-container-low p-5 sm:rounded-[2rem] sm:p-8 md:p-12">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Newsletter</p>
          <h2 className="mt-3 max-w-2xl font-display-md text-display-md text-on-background">
            {product.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-on-surface-variant sm:text-base">
            {product.description}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-on-surface-variant">
            <li>• Private read-only community updates</li>
            <li>• Login → pay QR → upload receipt → unlock</li>
            <li>• NPR {product.priceNpr.toLocaleString()}</li>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Link
              href="/newsletter"
              className="emerald-gradient inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white"
            >
              Subscribe
            </Link>
            <Link
              href="/login?callbackUrl=%2Fnewsletter"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant/50 px-6 py-3 text-sm font-semibold text-on-background"
            >
              Login first
            </Link>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Homepage newsletter section failed:", error);
    return null;
  }
}
