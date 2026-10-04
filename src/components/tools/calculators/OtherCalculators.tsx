"use client";

import { useMemo, useState } from "react";
import { CalculatorField } from "@/components/tools/CalculatorField";
import { ResultStat } from "@/components/tools/ResultStat";
import {
  compoundFutureValue,
  emergencyFund,
  fdVsSip,
  inflationAdjust,
  insuranceNeed,
  loanEmi,
  loanPrepayImpact,
  lumpsumVsSip,
  nepalIncomeTax,
  netWorth,
  retirementPlan,
  sipForGoal,
} from "@/lib/calculators/formulas";
import { formatRs } from "@/lib/money";

function Results({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-primary/10 via-white to-surface-container-low p-5 sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Result</p>
      {children}
    </div>
  );
}

export function CompoundCalculator() {
  const [principal, setPrincipal] = useState(100_000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);
  const result = useMemo(
    () => compoundFutureValue(principal, rate, years, 1),
    [principal, rate, years],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Principal" prefix="Rs." value={principal} step={1000} onChange={setPrincipal} />
        <CalculatorField label="Annual return" suffix="%" value={rate} min={0} max={30} step={0.5} onChange={setRate} />
        <CalculatorField label="Duration" suffix="years" value={years} min={1} max={50} onChange={setYears} />
      </div>
      <Results>
        <ResultStat label="Invested" value={formatRs(result.invested)} />
        <ResultStat label="Returns" value={formatRs(result.returns)} />
        <ResultStat label="Total" value={formatRs(result.total)} emphasize />
      </Results>
    </div>
  );
}

export function RetirementCalculator() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge, setRetireAge] = useState(60);
  const [expense, setExpense] = useState(50_000);
  const [inflation, setInflation] = useState(6);
  const [retReturn, setRetReturn] = useState(8);
  const [yearsInRet, setYearsInRet] = useState(25);

  const result = useMemo(
    () =>
      retirementPlan({
        currentAge,
        retireAge,
        monthlyExpenseToday: expense,
        inflationPct: inflation,
        returnPct: retReturn,
        yearsInRetirement: yearsInRet,
      }),
    [currentAge, retireAge, expense, inflation, retReturn, yearsInRet],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Current age" value={currentAge} min={18} max={70} onChange={setCurrentAge} />
        <CalculatorField label="Retirement age" value={retireAge} min={40} max={80} onChange={setRetireAge} />
        <CalculatorField label="Monthly expenses today" prefix="Rs." value={expense} step={1000} onChange={setExpense} />
        <CalculatorField label="Inflation" suffix="%" value={inflation} min={1} max={15} step={0.5} onChange={setInflation} />
        <CalculatorField label="Expected return" suffix="%" value={retReturn} min={1} max={15} step={0.5} onChange={setRetReturn} />
        <CalculatorField label="Years in retirement" value={yearsInRet} min={5} max={40} onChange={setYearsInRet} />
      </div>
      <Results>
        <ResultStat label="Years to retire" value={`${result.yearsToRetire}`} />
        <ResultStat label="Monthly expense at retirement" value={formatRs(result.expenseAtRetire)} />
        <ResultStat label="Corpus needed" value={formatRs(result.corpus)} />
        <ResultStat label="Suggested monthly SIP" value={formatRs(result.monthlySip)} emphasize />
      </Results>
    </div>
  );
}

export function EmiCalculator() {
  const [principal, setPrincipal] = useState(2_000_000);
  const [rate, setRate] = useState(11);
  const [years, setYears] = useState(15);
  const result = useMemo(() => loanEmi(principal, rate, years), [principal, rate, years]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Loan amount" prefix="Rs." value={principal} step={10000} onChange={setPrincipal} />
        <CalculatorField label="Interest rate" suffix="% p.a." value={rate} min={1} max={30} step={0.1} onChange={setRate} />
        <CalculatorField label="Tenure" suffix="years" value={years} min={1} max={40} onChange={setYears} />
      </div>
      <Results>
        <ResultStat label="Monthly EMI" value={formatRs(result.emi)} emphasize />
        <ResultStat label="Total interest" value={formatRs(result.totalInterest)} />
        <ResultStat label="Total payment" value={formatRs(result.totalPayment)} />
      </Results>
    </div>
  );
}

export function PrepayCalculator() {
  const [principal, setPrincipal] = useState(2_000_000);
  const [rate, setRate] = useState(11);
  const [years, setYears] = useState(15);
  const [monthsPaid, setMonthsPaid] = useState(24);
  const [prepay, setPrepay] = useState(200_000);
  const result = useMemo(
    () =>
      loanPrepayImpact({
        principal,
        annualRatePct: rate,
        years,
        monthsPaid,
        prepayAmount: prepay,
      }),
    [principal, rate, years, monthsPaid, prepay],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Loan amount" prefix="Rs." value={principal} step={10000} onChange={setPrincipal} />
        <CalculatorField label="Interest rate" suffix="%" value={rate} min={1} max={30} step={0.1} onChange={setRate} />
        <CalculatorField label="Original tenure" suffix="years" value={years} min={1} max={40} onChange={setYears} />
        <CalculatorField label="EMIs already paid" value={monthsPaid} min={0} max={480} onChange={setMonthsPaid} />
        <CalculatorField label="Prepayment amount" prefix="Rs." value={prepay} step={5000} onChange={setPrepay} />
      </div>
      <Results>
        <ResultStat label="Balance before prepay" value={formatRs(result.balanceBefore)} />
        <ResultStat label="Balance after prepay" value={formatRs(result.balanceAfter)} />
        <ResultStat label="Months saved" value={`${Math.max(0, result.monthsLeftBefore - result.monthsLeftAfter)}`} />
        <ResultStat label="Interest saved" value={formatRs(result.interestSaved)} emphasize />
      </Results>
    </div>
  );
}

export function InflationCalculator() {
  const [amount, setAmount] = useState(100_000);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(10);
  const result = useMemo(() => inflationAdjust(amount, rate, years), [amount, rate, years]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Today's amount" prefix="Rs." value={amount} step={1000} onChange={setAmount} />
        <CalculatorField label="Inflation rate" suffix="%" value={rate} min={1} max={20} step={0.5} onChange={setRate} />
        <CalculatorField label="Years" value={years} min={1} max={50} onChange={setYears} />
      </div>
      <Results>
        <ResultStat label="Future cost of same lifestyle" value={formatRs(result.futureCost)} emphasize />
        <ResultStat label="Today's money will feel like" value={formatRs(result.purchasingPower)} />
      </Results>
    </div>
  );
}

export function EmergencyCalculator() {
  const [expenses, setExpenses] = useState(40_000);
  const [months, setMonths] = useState(6);
  const result = useMemo(() => emergencyFund(expenses, months), [expenses, months]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Monthly expenses" prefix="Rs." value={expenses} step={1000} onChange={setExpenses} />
        <CalculatorField label="Months of cover" value={months} min={3} max={24} onChange={setMonths} />
      </div>
      <Results>
        <ResultStat label="Emergency fund target" value={formatRs(result.target)} emphasize />
        <ResultStat label="Coverage" value={`${result.months} months`} />
      </Results>
    </div>
  );
}

export function NetWorthCalculator() {
  const [assets, setAssets] = useState(1_500_000);
  const [liabilities, setLiabilities] = useState(400_000);
  const result = useMemo(() => netWorth(assets, liabilities), [assets, liabilities]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Total assets" prefix="Rs." value={assets} step={10000} onChange={setAssets} />
        <CalculatorField label="Total liabilities" prefix="Rs." value={liabilities} step={10000} onChange={setLiabilities} />
      </div>
      <Results>
        <ResultStat label="Assets" value={formatRs(result.assets)} />
        <ResultStat label="Liabilities" value={formatRs(result.liabilities)} />
        <ResultStat label="Net worth" value={formatRs(result.net)} emphasize />
      </Results>
    </div>
  );
}

export function GoalCalculator() {
  const [goal, setGoal] = useState(1_000_000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(5);
  const monthly = useMemo(() => sipForGoal(goal, rate, years), [goal, rate, years]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Goal amount" prefix="Rs." value={goal} step={10000} onChange={setGoal} />
        <CalculatorField label="Expected return" suffix="%" value={rate} min={1} max={25} step={0.5} onChange={setRate} />
        <CalculatorField label="Years to goal" value={years} min={1} max={40} onChange={setYears} />
      </div>
      <Results>
        <ResultStat label="Monthly SIP needed" value={formatRs(monthly)} emphasize />
        <ResultStat label="Total you may invest" value={formatRs(monthly * years * 12)} />
      </Results>
    </div>
  );
}

export function InsuranceCalculator() {
  const [income, setIncome] = useState(800_000);
  const [years, setYears] = useState(15);
  const [cover, setCover] = useState(1_000_000);
  const [liabilities, setLiabilities] = useState(500_000);
  const [assets, setAssets] = useState(300_000);
  const result = useMemo(
    () =>
      insuranceNeed({
        annualIncome: income,
        years,
        existingCover: cover,
        liabilities,
        assets,
      }),
    [income, years, cover, liabilities, assets],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Annual income" prefix="Rs." value={income} step={10000} onChange={setIncome} />
        <CalculatorField label="Years of income to replace" value={years} min={5} max={40} onChange={setYears} />
        <CalculatorField label="Existing life cover" prefix="Rs." value={cover} step={50000} onChange={setCover} />
        <CalculatorField label="Liabilities" prefix="Rs." value={liabilities} step={10000} onChange={setLiabilities} />
        <CalculatorField label="Liquid assets" prefix="Rs." value={assets} step={10000} onChange={setAssets} />
      </div>
      <Results>
        <ResultStat label="Human life value" value={formatRs(result.humanLifeValue)} />
        <ResultStat label="Recommended additional cover" value={formatRs(result.recommendedCover)} emphasize />
      </Results>
    </div>
  );
}

export function TaxCalculator() {
  const [income, setIncome] = useState(900_000);
  const result = useMemo(() => nepalIncomeTax(income), [income]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Annual taxable income" prefix="Rs." value={income} step={10000} onChange={setIncome} />
        <p className="text-xs text-on-surface-variant">
          Simplified illustrative slabs for resident individuals. Confirm with current IRD rules before filing.
        </p>
      </div>
      <Results>
        <ResultStat label="Estimated tax" value={formatRs(result.tax)} emphasize />
        <ResultStat label="Take-home (annual)" value={formatRs(result.netIncome)} />
        <ResultStat label="Effective rate" value={`${(result.effectiveRate * 100).toFixed(1)}%`} />
      </Results>
    </div>
  );
}

export function FdVsSipCalculator() {
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [sipRate, setSipRate] = useState(12);
  const [fdRate, setFdRate] = useState(7);
  const result = useMemo(
    () => fdVsSip({ monthly, years, sipRatePct: sipRate, fdRatePct: fdRate }),
    [monthly, years, sipRate, fdRate],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Monthly amount" prefix="Rs." value={monthly} step={500} onChange={setMonthly} />
        <CalculatorField label="Duration" suffix="years" value={years} min={1} max={40} onChange={setYears} />
        <CalculatorField label="SIP expected return" suffix="%" value={sipRate} min={1} max={25} step={0.5} onChange={setSipRate} />
        <CalculatorField label="FD interest rate" suffix="%" value={fdRate} min={1} max={15} step={0.1} onChange={setFdRate} />
      </div>
      <Results>
        <ResultStat label="SIP total" value={formatRs(result.sip.total)} emphasize />
        <ResultStat label="FD-style total" value={formatRs(result.fd.total)} />
        <ResultStat label="SIP advantage" value={formatRs(result.sip.total - result.fd.total)} />
      </Results>
    </div>
  );
}

export function LumpsumVsSipCalculator() {
  const [lumpsum, setLumpsum] = useState(200_000);
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const result = useMemo(
    () => lumpsumVsSip({ lumpsum, monthly, years, ratePct: rate }),
    [lumpsum, monthly, years, rate],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-5 sm:p-6">
        <CalculatorField label="Lump sum amount" prefix="Rs." value={lumpsum} step={5000} onChange={setLumpsum} />
        <CalculatorField label="Monthly SIP" prefix="Rs." value={monthly} step={500} onChange={setMonthly} />
        <CalculatorField label="Duration" suffix="years" value={years} min={1} max={40} onChange={setYears} />
        <CalculatorField label="Expected return" suffix="%" value={rate} min={1} max={25} step={0.5} onChange={setRate} />
      </div>
      <Results>
        <ResultStat label="Lump sum total" value={formatRs(result.lump.total)} />
        <ResultStat label="SIP total" value={formatRs(result.sip.total)} emphasize />
        <ResultStat
          label="Difference (SIP − lump sum)"
          value={formatRs(result.sip.total - result.lump.total)}
        />
      </Results>
    </div>
  );
}
