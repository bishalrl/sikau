import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveCalculator } from "@/components/tools/ActiveCalculator";
import { CalculatorShell } from "@/components/tools/CalculatorShell";
import { CALCULATORS, getCalculator, type CalculatorId } from "@/lib/calculators/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CALCULATORS.map((item) => ({ slug: item.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getCalculator(slug);
  if (!tool) return { title: { absolute: "Tools | Sikau Paisa" } };
  return {
    title: { absolute: `${tool.title} | Sikau Paisa` },
    description: tool.description,
  };
}

export default async function CalculatorPage({ params }: Props) {
  const { slug } = await params;
  const tool = getCalculator(slug);
  if (!tool) notFound();

  return (
    <CalculatorShell title={tool.title} description={tool.description}>
      <ActiveCalculator id={tool.id as CalculatorId} />
    </CalculatorShell>
  );
}
