import type { Ebook, EbookPurchaseType } from "@prisma/client";

export type CurriculumItem = {
  phase?: string;
  title: string;
  detail: string;
};

export const COMMUNITY_ACCESS_TYPES = [
  "LIFETIME",
  "MONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "YEARLY",
] as const;

export type CommunityAccessTypeValue = (typeof COMMUNITY_ACCESS_TYPES)[number];

export function parseJsonArray<T = string>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function parseCurriculum(raw: string | null | undefined): CurriculumItem[] {
  const items = parseJsonArray<Partial<CurriculumItem>>(raw, []);
  return items
    .filter((item) => Boolean(item?.title))
    .map((item, index) => ({
      phase: item.phase?.trim() || `Phase ${index + 1}`,
      title: String(item.title).trim(),
      detail: String(item.detail ?? "").trim(),
    }));
}

export function parseAudience(raw: string | null | undefined): string[] {
  return parseJsonArray<string>(raw, []).map((item) => String(item).trim()).filter(Boolean);
}

export function parseBenefits(raw: string | null | undefined): string[] {
  return parseJsonArray<string>(raw, []).map((item) => String(item).trim()).filter(Boolean);
}

export function accessTypeLabel(value?: string | null) {
  switch (value) {
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "3 Months";
    case "SEMIANNUAL":
      return "6 Months";
    case "YEARLY":
      return "1 Year";
    case "LIFETIME":
    default:
      return "Lifetime";
  }
}

export function ebookHasCommunityOffer(
  ebook: Pick<
    Ebook,
    "communityOfferEnabled" | "communityOfferPriceNpr" | "communityOfferName" | "isFree" | "priceNpr"
  >,
) {
  return (
    ebook.communityOfferEnabled &&
    Boolean(ebook.communityOfferName?.trim()) &&
    typeof ebook.communityOfferPriceNpr === "number" &&
    ebook.communityOfferPriceNpr > 0
  );
}

export function resolvePurchaseAmount(
  ebook: Pick<
    Ebook,
    "priceNpr" | "isFree" | "communityOfferEnabled" | "communityOfferPriceNpr" | "communityOfferName"
  >,
  purchaseType: EbookPurchaseType | "SOLO_EBOOK" | "COMMUNITY_BUNDLE",
) {
  if (purchaseType === "COMMUNITY_BUNDLE" && ebookHasCommunityOffer(ebook)) {
    return ebook.communityOfferPriceNpr as number;
  }
  if (ebook.isFree || ebook.priceNpr <= 0) return 0;
  return ebook.priceNpr;
}

export function fromPriceLabel(ebook: {
  isFree: boolean;
  priceNpr: number;
  communityOfferEnabled: boolean;
  communityOfferPriceNpr: number | null;
  communityOfferName: string | null;
}) {
  if (ebook.isFree || ebook.priceNpr <= 0) return "Free";
  if (ebookHasCommunityOffer(ebook)) {
    const solo = ebook.priceNpr;
    const bundle = ebook.communityOfferPriceNpr as number;
    const from = Math.min(solo, bundle);
    return `From Rs ${from.toLocaleString()}`;
  }
  return `Rs ${ebook.priceNpr.toLocaleString()}`;
}

export const DEFAULT_SOLO_FEATURES = [
  "Full ebook access",
  "Self-paced reading",
  "Lifetime reading access",
];
