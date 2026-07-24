import { MaterialIcon } from "./MaterialIcon";

const steps = [
  { icon: "visibility", title: "1. Understand", description: "Audit your current financial status", active: true },
  { icon: "calculate", title: "2. Budget", description: "Set strict spending boundaries" },
  { icon: "trending_up", title: "3. Invest", description: "Deploy capital into high-yield SIPs" },
  { icon: "shield", title: "4. Protect", description: "Secure life & health coverage" },
  { icon: "event_available", title: "5. Plan", description: "Long-term retirement goals" },
  { icon: "architecture", title: "6. Build Wealth", description: "Achieve compounding freedom" },
];

const delays = ["delay-100", "delay-150", "delay-200", "delay-250", "delay-300", "delay-350"];

export function RoadmapSection() {
  return (
    <section className="py-xl" id="goals">
      <div className="site-container">
        <div className="reveal active mb-xl text-center">
          <h2 className="font-display-md text-display-md text-on-background">Your Financial Freedom Roadmap</h2>
          <p className="mt-sm text-on-surface-variant">A 6-step journey to financial independence.</p>
        </div>
        <div className="relative pt-lg">
          <div className="absolute top-[88px] left-0 hidden h-1 w-full bg-outline-variant/30 lg:block" />
          <div className="relative grid grid-cols-1 gap-md md:grid-cols-3 lg:grid-cols-6">
            {steps.map((step, i) => (
              <div key={step.title} className={`reveal active group text-center ${delays[i]}`}>
                <div
                  className={`relative z-10 mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-white transition-transform group-hover:scale-110 ${
                    step.active ? "border-4 border-primary" : "border-4 border-outline"
                  }`}
                >
                  <MaterialIcon name={step.icon} className={step.active ? "text-primary" : "text-outline"} />
                </div>
                <h4 className="font-label-md text-on-background">{step.title}</h4>
                <p className="mt-xs px-sm text-xs text-on-surface-variant">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
