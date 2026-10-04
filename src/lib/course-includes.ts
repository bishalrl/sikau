/** Per-course "What you'll get" / offer highlights. */

export const DEFAULT_COURSE_INCLUDES = [
  "4+ Hours of On-Demand HD Video",
  "Lifetime Access & Free Updates",
  "Exclusive Community Networking",
  "Ready-to-use Wealth Calculators",
];

export const DEFAULT_COURSE_DESCRIPTION =
  "Savings, Budgeting, Emergency Fund, Insurances, Investing, Money mindset and retirement planning tailored for Nepal.";

export function parseCourseIncludes(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
}

export function includesToText(raw?: string | null) {
  const items = parseCourseIncludes(raw);
  return items.length ? items.join("\n") : DEFAULT_COURSE_INCLUDES.join("\n");
}

export function textToIncludes(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
