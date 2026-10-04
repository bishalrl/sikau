import Link from "next/link";
import type { ReactNode } from "react";
import { BackNav } from "@/components/ui/BackNav";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export function CalculatorShell({ title, description, children }: Props) {
  return (
    <div className="site-container py-lg">
      <BackNav href="/tools" label="All tools" className="text-sm font-semibold text-primary" />
      <div className="mt-4 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Financial tools</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">{title}</h1>
        <p className="mt-2 text-on-surface-variant">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
      <p className="mt-8 text-xs text-on-surface-variant">
        Estimates only — not financial advice. Returns and tax rules can change.{" "}
        <Link href="/learn" className="font-semibold text-primary">
          Learn money skills
        </Link>
      </p>
    </div>
  );
}
