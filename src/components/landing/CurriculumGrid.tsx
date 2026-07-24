import { MaterialIcon } from "./MaterialIcon";

const modules = [
  { icon: "payments", title: "Budgeting", description: "Master the 50-30-20 rule and optimize expenses." },
  { icon: "monitoring", title: "SIP Strategy", description: "Consistent wealth building through Mutual Funds." },
  { icon: "health_and_safety", title: "Insurance", description: "Protecting your family from life's uncertainties." },
  { icon: "savings", title: "Retirement", description: "Early retirement planning for a peaceful future." },
  { icon: "account_balance", title: "Tax Planning", description: "Legal ways to maximize your tax savings." },
  { icon: "real_estate_agent", title: "Real Estate", description: "Investing in land and properties wisely." },
  { icon: "currency_exchange", title: "Stock Market", description: "Fundamental analysis for the long term." },
  { icon: "credit_score", title: "Debt Management", description: "Escaping the trap of high-interest loans." },
  { icon: "diversity_3", title: "Estate Planning", description: "Ensuring wealth transfers to your next generation." },
  { icon: "diamond", title: "Wealth Creation", description: "The psychology and habit of the top 1%." },
];

const delays = ["delay-100", "delay-150", "delay-200", "delay-250", "delay-300"];

export function CurriculumGrid() {
  return (
    <section className="bg-surface py-xl">
      <div className="site-container">
        <div className="reveal active mb-xl text-center">
          <h2 className="font-display-md text-display-md text-on-background">A Comprehensive Curriculum</h2>
          <p className="mx-auto mt-sm max-w-2xl text-on-surface-variant">
            Master every facet of personal finance with structured, jargon-free modules designed for
            practical execution.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-5">
          {modules.map((mod, i) => (
            <div
              key={mod.title}
              className={`reveal active group rounded-2xl border border-outline-variant/30 bg-white p-md transition-all hover:border-primary/50 hover:shadow-xl ${delays[i % 5]}`}
            >
              <div className="mb-md flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10 text-primary transition-transform group-hover:scale-110">
                <MaterialIcon name={mod.icon} />
              </div>
              <h3 className="font-headline-md mb-xs text-[18px]">{mod.title}</h3>
              <p className="text-sm text-on-surface-variant">{mod.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
