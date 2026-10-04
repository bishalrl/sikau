"use client";

import { useMemo, useState } from "react";
import { CalculatorField } from "@/components/tools/CalculatorField";
import { ResultStat } from "@/components/tools/ResultStat";
import { sipFutureValue } from "@/lib/calculators/formulas";
import { formatRs } from "@/lib/money";

export function SipCalculator({ compact = false }: { compact?: boolean }) {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(20);

  const result = useMemo(
    () => sipFutureValue(monthly, rate, years),
    [monthly, rate, years],
  );

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        {!compact && <h2 className="font-headline-md text-on-background">SIP Calculator</h2>}
        <CalculatorField
          label="Monthly Investment"
          prefix="Rs."
          value={monthly}
          min={500}
          max={1_000_000}
          step={500}
          onChange={setMonthly}
        />
        <CalculatorField
          label="Expected Return"
          suffix="% p.a."
          value={rate}
          min={1}
          max={30}
          step={0.5}
          onChange={setRate}
        />
        <CalculatorField
          label="Duration"
          suffix="years"
          value={years}
          min={1}
          max={50}
          step={1}
          onChange={setYears}
        />
      </div>

      <div className="space-y-3 rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-primary/10 via-white to-surface-container-low p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Projection</p>
        <ResultStat label="Invested" value={formatRs(result.invested)} />
        <ResultStat label="Estimated Returns" value={formatRs(result.returns)} />
        <ResultStat label="Total" value={formatRs(result.total)} emphasize />
      </div>
    </div>
  );
}
