"use client";

import type { CalculatorId } from "@/lib/calculators/catalog";
import { SipCalculator } from "@/components/tools/calculators/SipCalculator";
import {
  CompoundCalculator,
  EmiCalculator,
  EmergencyCalculator,
  FdVsSipCalculator,
  GoalCalculator,
  InflationCalculator,
  InsuranceCalculator,
  LumpsumVsSipCalculator,
  NetWorthCalculator,
  PrepayCalculator,
  RetirementCalculator,
  TaxCalculator,
} from "@/components/tools/calculators/OtherCalculators";

export function ActiveCalculator({ id }: { id: CalculatorId }) {
  switch (id) {
    case "sip":
      return <SipCalculator />;
    case "compound":
      return <CompoundCalculator />;
    case "retirement":
      return <RetirementCalculator />;
    case "emi":
      return <EmiCalculator />;
    case "prepay":
      return <PrepayCalculator />;
    case "inflation":
      return <InflationCalculator />;
    case "emergency":
      return <EmergencyCalculator />;
    case "net-worth":
      return <NetWorthCalculator />;
    case "goal":
      return <GoalCalculator />;
    case "insurance":
      return <InsuranceCalculator />;
    case "tax":
      return <TaxCalculator />;
    case "fd-vs-sip":
      return <FdVsSipCalculator />;
    case "lumpsum-vs-sip":
      return <LumpsumVsSipCalculator />;
    default:
      return null;
  }
}
