import Image from "next/image";

const ANIL_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA2cT1UNITrbeT3Tm-WJuoszMyy8QW7X0bb_x2Q-ETCPSnMINX0Ah6qPWmjvpNRbqVDRo_-G8-j-vb5iYQP-pAjv-Rlw7j-Yx4ISf38Zkb-WKcHMwDNrTf7z0qzu2PhWgSitpOdFcj00xNlDImuAeVV-eGjQypBmGj2EeR8i8EGdUQb55U9CjkNqBwC0T7gHzq4aCZGIISwXLmUCXXDepTx8wyxqvm3hYtCq20vtbH05tNLQRA2jk5PAr11-tuKlxHViHKPPQYkYbU";

const SUNITA_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXgvPct0stMicL_YgSPmwBOpj1wh17GSH0yeCt0uV7VnreAj1FfrscE1Z6xiPYodiAN8Dx0VwbUjCi86O615QGES_hQxhl1-TvMPrpXqTM69GEodwN0IlQB18O5hawaKNY1Y5Rlp9kFCAqi80STLRVP87HytOFc1f7Fwtk7315eBazFb258HY2wy14lWIdTcyWOZVDqQ0blx4n207C7xRl4mdPWuxq5rozjXJyP5SVjgweF1XP7-UVNDClU8eL8kYMt_pVsSkZY7c";

export function TransformationSection() {
  return (
    <section className="overflow-hidden bg-surface-container-low py-xl">
      <div className="site-container">
        <div className="reveal active mb-xl text-center">
          <h2 className="font-display-md text-display-md text-on-background">Transformation Stories</h2>
          <p className="mt-sm text-on-surface-variant">See the real-world impact of disciplined financial education.</p>
        </div>
        <div className="grid grid-cols-1 gap-xl md:grid-cols-2">
          <div className="reveal active group rounded-3xl bg-white p-lg shadow-lg delay-100">
            <div className="mb-lg flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <Image src={ANIL_IMAGE} alt="Anil Sharma" width={48} height={48} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="font-label-md">Anil Sharma</h4>
                  <p className="text-xs text-on-surface-variant">Software Engineer</p>
                </div>
              </div>
              <div className="rounded-full bg-primary/10 px-sm py-1 text-xs font-bold text-primary">After 12 Months</div>
            </div>
            <div className="relative grid grid-cols-2 gap-md">
              <div className="space-y-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-error">Before</span>
                <div className="rounded-xl bg-surface-container p-md">
                  <p className="text-sm font-bold text-on-surface">Random Spending</p>
                  <p className="text-xs text-on-surface-variant">Zero savings at month end</p>
                </div>
                <div className="rounded-xl bg-surface-container p-md">
                  <p className="text-sm font-bold text-on-surface">No Insurance</p>
                  <p className="text-xs text-on-surface-variant">High risk for family</p>
                </div>
              </div>
              <div className="space-y-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">After</span>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-md">
                  <p className="text-sm font-bold text-primary">NPR 15k Monthly SIP</p>
                  <p className="text-xs text-on-surface-variant">Consistent wealth building</p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-md">
                  <p className="text-sm font-bold text-primary">Fully Insured</p>
                  <p className="text-xs text-on-surface-variant">Peace of mind secured</p>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal active group rounded-3xl bg-white p-lg shadow-lg delay-200">
            <div className="mb-lg flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <Image src={SUNITA_IMAGE} alt="Sunita Tamang" width={48} height={48} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="font-label-md">Sunita Tamang</h4>
                  <p className="text-xs text-on-surface-variant">Banker</p>
                </div>
              </div>
              <div className="rounded-full bg-primary/10 px-sm py-1 text-xs font-bold text-primary">After 6 Months</div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-error">Before</span>
                <div className="rounded-xl bg-surface-container p-md">
                  <p className="text-sm font-bold text-on-surface">Loan Trap</p>
                  <p className="text-xs text-on-surface-variant">Struggling with EMI</p>
                </div>
              </div>
              <div className="space-y-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">After</span>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-md">
                  <p className="text-sm font-bold text-primary">Debt Free</p>
                  <p className="text-xs text-on-surface-variant">Optimized portfolio growth</p>
                </div>
              </div>
            </div>
            <div className="mt-md rounded-xl border border-primary/10 bg-primary-container/10 p-md text-sm italic">
              &quot;Raju&apos;s Masterclass changed how I look at my salary. I used to think I didn&apos;t earn
              enough to save, now I have a portfolio!&quot;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
