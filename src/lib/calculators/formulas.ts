import { clampNumber } from "@/lib/money";

/** Monthly SIP future value (investment at beginning of month). */
export function sipFutureValue(monthly: number, annualRatePct: number, years: number) {
  const P = Math.max(0, monthly);
  const n = Math.max(0, Math.round(years * 12));
  const i = annualRatePct / 12 / 100;
  if (n === 0) return { invested: 0, returns: 0, total: 0 };
  if (i === 0) {
    const invested = P * n;
    return { invested, returns: 0, total: invested };
  }
  const total = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
  const invested = P * n;
  return { invested, returns: Math.max(0, total - invested), total };
}

export function compoundFutureValue(
  principal: number,
  annualRatePct: number,
  years: number,
  compoundsPerYear = 1,
) {
  const P = Math.max(0, principal);
  const r = annualRatePct / 100;
  const t = Math.max(0, years);
  const n = Math.max(1, compoundsPerYear);
  const total = P * Math.pow(1 + r / n, n * t);
  return { invested: P, returns: Math.max(0, total - P), total };
}

export function loanEmi(principal: number, annualRatePct: number, years: number) {
  const P = Math.max(0, principal);
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 12 / 100;
  if (r === 0) {
    const emi = P / n;
    return { emi, totalPayment: P, totalInterest: 0, months: n };
  }
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  return { emi, totalPayment, totalInterest: totalPayment - P, months: n };
}

export function loanPrepayImpact(input: {
  principal: number;
  annualRatePct: number;
  years: number;
  monthsPaid: number;
  prepayAmount: number;
}) {
  const base = loanEmi(input.principal, input.annualRatePct, input.years);
  const r = input.annualRatePct / 12 / 100;
  let balance = input.principal;
  const paid = clampNumber(input.monthsPaid, 0, base.months - 1);

  for (let m = 0; m < paid; m += 1) {
    const interest = balance * r;
    const principalPart = Math.min(balance, base.emi - interest);
    balance = Math.max(0, balance - principalPart);
  }

  const afterPrepay = Math.max(0, balance - Math.max(0, input.prepayAmount));
  if (afterPrepay <= 0) {
    return {
      balanceBefore: balance,
      balanceAfter: 0,
      monthsLeftBefore: base.months - paid,
      monthsLeftAfter: 0,
      interestBefore: base.emi * (base.months - paid) - balance,
      interestAfter: 0,
      interestSaved: Math.max(0, base.emi * (base.months - paid) - balance),
    };
  }

  let monthsLeft = 0;
  let interestAfter = 0;
  let temp = afterPrepay;
  while (temp > 1 && monthsLeft < 600) {
    const interest = temp * r;
    interestAfter += interest;
    const principalPart = Math.min(temp, base.emi - interest);
    temp -= principalPart;
    monthsLeft += 1;
  }

  const interestBefore = base.emi * (base.months - paid) - balance;
  return {
    balanceBefore: balance,
    balanceAfter: afterPrepay,
    monthsLeftBefore: base.months - paid,
    monthsLeftAfter: monthsLeft,
    interestBefore: Math.max(0, interestBefore),
    interestAfter,
    interestSaved: Math.max(0, interestBefore - interestAfter),
  };
}

export function inflationAdjust(amount: number, inflationPct: number, years: number) {
  const factor = Math.pow(1 + inflationPct / 100, Math.max(0, years));
  const futureCost = amount * factor;
  const purchasingPower = amount / factor;
  return { futureCost, purchasingPower, factor };
}

export function emergencyFund(monthlyExpenses: number, months: number) {
  const target = Math.max(0, monthlyExpenses) * Math.max(0, months);
  return { target, months: Math.max(0, months), monthlyExpenses: Math.max(0, monthlyExpenses) };
}

export function netWorth(assets: number, liabilities: number) {
  return {
    assets: Math.max(0, assets),
    liabilities: Math.max(0, liabilities),
    net: Math.max(0, assets) - Math.max(0, liabilities),
  };
}

/** Monthly SIP required to reach a future goal. */
export function sipForGoal(goalAmount: number, annualRatePct: number, years: number) {
  const FV = Math.max(0, goalAmount);
  const n = Math.max(1, Math.round(years * 12));
  const i = annualRatePct / 12 / 100;
  if (i === 0) return FV / n;
  return FV / ((((Math.pow(1 + i, n) - 1) / i) * (1 + i)));
}

export function retirementPlan(input: {
  currentAge: number;
  retireAge: number;
  monthlyExpenseToday: number;
  inflationPct: number;
  returnPct: number;
  yearsInRetirement: number;
}) {
  const yearsToRetire = Math.max(0, input.retireAge - input.currentAge);
  const expenseAtRetire =
    input.monthlyExpenseToday * Math.pow(1 + input.inflationPct / 100, yearsToRetire);
  const annualExpense = expenseAtRetire * 12;
  const r = input.returnPct / 100;
  const t = Math.max(1, input.yearsInRetirement);
  // Corpus that can sustain withdrawals for t years (simplified).
  const corpus =
    r === 0 ? annualExpense * t : (annualExpense * (1 - Math.pow(1 + r, -t))) / r;
  const monthlySip = sipForGoal(corpus, input.returnPct, yearsToRetire || 1);
  return { yearsToRetire, expenseAtRetire, corpus, monthlySip };
}

export function insuranceNeed(input: {
  annualIncome: number;
  years: number;
  existingCover: number;
  liabilities: number;
  assets: number;
}) {
  const humanLifeValue = Math.max(0, input.annualIncome) * Math.max(1, input.years);
  const need = humanLifeValue + Math.max(0, input.liabilities) - Math.max(0, input.assets) - Math.max(0, input.existingCover);
  return { humanLifeValue, recommendedCover: Math.max(0, need) };
}

/** Simplified Nepal progressive tax estimate (illustrative). */
export function nepalIncomeTax(annualIncome: number) {
  const income = Math.max(0, annualIncome);
  const slabs = [
    { upTo: 500_000, rate: 0.01 },
    { upTo: 700_000, rate: 0.1 },
    { upTo: 1_000_000, rate: 0.2 },
    { upTo: 2_000_000, rate: 0.3 },
    { upTo: Infinity, rate: 0.36 },
  ];

  let tax = 0;
  let prev = 0;
  const breakdown: Array<{ band: string; taxable: number; tax: number; rate: number }> = [];

  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upTo) - prev;
    const slabTax = taxable * slab.rate;
    tax += slabTax;
    breakdown.push({
      band: prev === 0 ? `Up to ${slab.upTo === Infinity ? "∞" : slab.upTo}` : `${prev + 1} – ${slab.upTo === Infinity ? "above" : slab.upTo}`,
      taxable,
      tax: slabTax,
      rate: slab.rate,
    });
    prev = slab.upTo;
  }

  const effective = income > 0 ? tax / income : 0;
  return { tax, netIncome: income - tax, effectiveRate: effective, breakdown };
}

export function fdVsSip(input: {
  monthly: number;
  years: number;
  sipRatePct: number;
  fdRatePct: number;
}) {
  const sip = sipFutureValue(input.monthly, input.sipRatePct, input.years);
  const lumpsumEquivalent = input.monthly * input.years * 12;
  // Approximate FD as depositing the same total as SIP invested amount at FD rate for half period average,
  // plus a cleaner comparison: yearly deposits into FD.
  const months = Math.round(input.years * 12);
  const monthlyFdRate = input.fdRatePct / 12 / 100;
  let fdTotal = 0;
  for (let m = 0; m < months; m += 1) {
    fdTotal = (fdTotal + input.monthly) * (1 + monthlyFdRate);
  }
  return {
    sip,
    fd: {
      invested: lumpsumEquivalent,
      total: fdTotal,
      returns: Math.max(0, fdTotal - lumpsumEquivalent),
    },
  };
}

export function lumpsumVsSip(input: {
  lumpsum: number;
  monthly: number;
  years: number;
  ratePct: number;
}) {
  const sip = sipFutureValue(input.monthly, input.ratePct, input.years);
  const lump = compoundFutureValue(input.lumpsum, input.ratePct, input.years, 1);
  return { sip, lump };
}
