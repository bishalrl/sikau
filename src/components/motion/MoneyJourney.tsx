"use client";

import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const STAGES = [
  { icon: "payments", title: "Earn", detail: "Build income with clarity" },
  { icon: "savings", title: "Save", detail: "Create a stable cash buffer" },
  { icon: "trending_up", title: "Invest", detail: "Put money to work with SIPs" },
  { icon: "park", title: "Grow", detail: "Compound patiently over years" },
  { icon: "account_balance", title: "Build Wealth", detail: "Protect and expand freedom" },
];

type Props = {
  title?: string;
  description?: string;
};

export function MoneyJourney({ title, description }: Props) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInViewOnce<HTMLElement>({ threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
  const playing = reduced || inView;

  return (
    <section
      ref={ref}
      className={`money-journey py-xl${playing ? " is-playing" : ""}`}
      id="money-journey"
    >
      <div className="site-container">
        <div className="money-journey__intro mx-auto mb-xl max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Money journey</p>
          <h2 className="mt-2 font-display-md text-display-md text-on-background">
            {title || "From earning to lasting wealth"}
          </h2>
          <p className="mt-sm text-on-surface-variant">
            {description || "A clear path Nepali earners can follow — one intentional stage at a time."}
          </p>
        </div>

        <div className="money-journey__track" aria-hidden="true">
          <div className="money-journey__rail" />
          <div className="money-journey__fill" />
        </div>

        <ol className="money-journey__stages">
          {STAGES.map((stage) => (
            <li key={stage.title} className="money-journey__stage">
              <div className="money-journey__icon">
                <MaterialIcon name={stage.icon} filled />
              </div>
              <h3>{stage.title}</h3>
              <p>{stage.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
