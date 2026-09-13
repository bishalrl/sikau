import { CmsImage } from "@/components/cms/CmsImage";

export type Story = {
  name: string;
  role: string;
  image: string;
  badge: string;
  quote: string;
  beforeTitle: string;
  beforeDetail: string;
  beforeTitle2: string;
  beforeDetail2: string;
  afterTitle: string;
  afterDetail: string;
  afterTitle2: string;
  afterDetail2: string;
};

const ANIL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA2cT1UNITrbeT3Tm-WJuoszMyy8QW7X0bb_x2Q-ETCPSnMINX0Ah6qPWmjvpNRbqVDRo_-G8-j-vb5iYQP-pAjv-Rlw7j-Yx4ISf38Zkb-WKcHMwDNrTf7z0qzu2PhWgSitpOdFcj00xNlDImuAeVV-eGjQypBmGj2EeR8i8EGdUQb55U9CjkNqBwC0T7gHzq4aCZGIISwXLmUCXXDepTx8wyxqvm3hYtCq20vtbH05tNLQRA2jk5PAr11-tuKlxHViHKPPQYkYbU";
const SUNITA =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXgvPct0stMicL_YgSPmwBOpj1wh17GSH0yeCt0uV7VnreAj1FfrscE1Z6xiPYodiAN8Dx0VwbUjCi86O615QGES_hQxhl1-TvMPrpXqTM69GEodwN0IlQB18O5hawaKNY1Y5Rlp9kFCAqi80STLRVP87HytOFc1f7Fwtk7315eBazFb258HY2wy14lWIdTcyWOZVDqQ0blx4n207C7xRl4mdPWuxq5rozjXJyP5SVjgweF1XP7-UVNDClU8eL8kYMt_pVsSkZY7c";

const fallbackStories: Story[] = [
  {
    name: "Anil Sharma",
    role: "Software Engineer",
    image: ANIL,
    badge: "After 12 Months",
    quote: "",
    beforeTitle: "Random Spending",
    beforeDetail: "Zero savings at month end",
    beforeTitle2: "No Insurance",
    beforeDetail2: "High risk for family",
    afterTitle: "NPR 15k Monthly SIP",
    afterDetail: "Consistent wealth building",
    afterTitle2: "Fully Insured",
    afterDetail2: "Peace of mind secured",
  },
  {
    name: "Sunita Tamang",
    role: "Banker",
    image: SUNITA,
    badge: "After 6 Months",
    quote: "Raju's Masterclass changed how I look at my salary. I used to think I didn't earn enough to save, now I have a portfolio!",
    beforeTitle: "Loan Trap",
    beforeDetail: "Struggling with EMI",
    beforeTitle2: "",
    beforeDetail2: "",
    afterTitle: "Debt Free",
    afterDetail: "Optimized portfolio growth",
    afterTitle2: "",
    afterDetail2: "",
  },
];

type Props = {
  title?: string;
  description?: string;
  stories?: Story[];
};

export function TransformationSection({ title, description, stories = fallbackStories }: Props = {}) {
  return (
    <section className="overflow-hidden bg-surface-container-low py-xl">
      <div className="site-container">
        <div className="reveal active mb-xl text-center">
          <h2 className="font-display-md text-display-md text-on-background">{title || "Transformation Stories"}</h2>
          <p className="mt-sm text-on-surface-variant">
            {description || "See the real-world impact of disciplined financial education."}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-xl md:grid-cols-2">
          {stories.map((story, index) => (
            <article key={story.name} className={`reveal active group rounded-3xl bg-white p-lg shadow-lg ${index % 2 ? "delay-200" : "delay-100"}`}>
              <div className="mb-lg flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <CmsImage src={story.image} alt={story.name} width={48} height={48} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-label-md">{story.name}</h4>
                    <p className="text-xs text-on-surface-variant">{story.role}</p>
                  </div>
                </div>
                {story.badge && (
                  <div className="rounded-full bg-primary/10 px-sm py-1 text-xs font-bold text-primary">{story.badge}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-error">Before</span>
                  {story.beforeTitle && (
                    <div className="rounded-xl bg-surface-container p-md">
                      <p className="text-sm font-bold text-on-surface">{story.beforeTitle}</p>
                      <p className="text-xs text-on-surface-variant">{story.beforeDetail}</p>
                    </div>
                  )}
                  {story.beforeTitle2 && (
                    <div className="rounded-xl bg-surface-container p-md">
                      <p className="text-sm font-bold text-on-surface">{story.beforeTitle2}</p>
                      <p className="text-xs text-on-surface-variant">{story.beforeDetail2}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">After</span>
                  {story.afterTitle && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-md">
                      <p className="text-sm font-bold text-primary">{story.afterTitle}</p>
                      <p className="text-xs text-on-surface-variant">{story.afterDetail}</p>
                    </div>
                  )}
                  {story.afterTitle2 && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-md">
                      <p className="text-sm font-bold text-primary">{story.afterTitle2}</p>
                      <p className="text-xs text-on-surface-variant">{story.afterDetail2}</p>
                    </div>
                  )}
                </div>
              </div>
              {story.quote && (
                <div className="mt-md rounded-xl border border-primary/10 bg-primary-container/10 p-md text-sm italic">
                  &quot;{story.quote}&quot;
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
