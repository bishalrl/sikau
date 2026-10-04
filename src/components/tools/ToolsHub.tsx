import Link from "next/link";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { SipCalculator } from "@/components/tools/calculators/SipCalculator";
import { CALCULATORS } from "@/lib/calculators/catalog";

export function ToolsHub() {
  const others = CALCULATORS;

  return (
    <div className="site-container py-lg">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Tools</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">
          Financial calculators
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Plan SIPs, loans, goals, and tax with simple Nepal-friendly tools. Start with the SIP
          calculator, then explore the rest.
        </p>
      </div>

      <section className="mt-8 rounded-[2rem] border border-outline-variant/30 bg-white p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Featured</p>
            <h2 className="mt-1 font-headline-md text-on-background">SIP Calculator</h2>
          </div>
          <Link href="/tools/sip" className="text-sm font-semibold text-primary hover:underline">
            Open full page →
          </Link>
        </div>
        <SipCalculator compact />
      </section>

      <section className="mt-10">
        <h2 className="font-headline-md text-on-background">Other calculators</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Every tool below is interactive and free to use.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="group rounded-3xl border border-outline-variant/30 bg-white p-5 transition hover:border-primary/40 hover:bg-primary-container/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
                <MaterialIcon name={tool.icon} />
              </div>
              <h3 className="mt-4 font-semibold text-on-background group-hover:text-primary">
                {tool.title}
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
