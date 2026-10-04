export type CalculatorId =
  | "sip"
  | "compound"
  | "retirement"
  | "emi"
  | "prepay"
  | "inflation"
  | "emergency"
  | "net-worth"
  | "goal"
  | "insurance"
  | "tax"
  | "fd-vs-sip"
  | "lumpsum-vs-sip";

export type CalculatorMeta = {
  id: CalculatorId;
  title: string;
  description: string;
  icon: string;
};

export const CALCULATORS: CalculatorMeta[] = [
  {
    id: "sip",
    title: "SIP Calculator",
    description: "Estimate wealth from monthly investments over time.",
    icon: "trending_up",
  },
  {
    id: "compound",
    title: "Compound Interest Calculator",
    description: "See how money grows with compounding.",
    icon: "savings",
  },
  {
    id: "retirement",
    title: "Retirement Calculator",
    description: "Plan the corpus and SIP needed for retirement.",
    icon: "elderly",
  },
  {
    id: "emi",
    title: "Loan EMI Calculator",
    description: "Calculate monthly EMI, interest, and total payable.",
    icon: "payments",
  },
  {
    id: "prepay",
    title: "Loan Prepayment Calculator",
    description: "See interest saved by making a lump-sum prepayment.",
    icon: "price_check",
  },
  {
    id: "inflation",
    title: "Inflation Calculator",
    description: "Understand future cost and purchasing power.",
    icon: "monitoring",
  },
  {
    id: "emergency",
    title: "Emergency Fund Calculator",
    description: "Know how much cash buffer you should keep.",
    icon: "health_and_safety",
  },
  {
    id: "net-worth",
    title: "Net Worth Calculator",
    description: "Add assets and liabilities for a clear net worth.",
    icon: "account_balance_wallet",
  },
  {
    id: "goal",
    title: "Goal Planner",
    description: "Find the monthly SIP needed for a money goal.",
    icon: "flag",
  },
  {
    id: "insurance",
    title: "Insurance Requirement Calculator",
    description: "Estimate life cover your family may need.",
    icon: "verified_user",
  },
  {
    id: "tax",
    title: "Salary / Income Tax Calculator",
    description: "Rough Nepal income tax estimate on annual income.",
    icon: "receipt_long",
  },
  {
    id: "fd-vs-sip",
    title: "FD vs SIP Comparison",
    description: "Compare fixed deposit growth with SIP investing.",
    icon: "compare_arrows",
  },
  {
    id: "lumpsum-vs-sip",
    title: "Lump Sum vs SIP",
    description: "Compare one-time investing with monthly SIP.",
    icon: "swap_horiz",
  },
];

export function getCalculator(id: string) {
  return CALCULATORS.find((item) => item.id === id) ?? null;
}
