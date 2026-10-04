import type { Metadata } from "next";
import { ToolsHub } from "@/components/tools/ToolsHub";

export const metadata: Metadata = {
  title: { absolute: "Financial Tools | Sikau Paisa" },
  description:
    "Free SIP, EMI, retirement, tax, and money calculators tailored for Nepal.",
};

export default function ToolsPage() {
  return <ToolsHub />;
}
