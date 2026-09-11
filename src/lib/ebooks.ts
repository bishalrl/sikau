import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Canonical NEPSE guide slug (community is an offer on this ebook, not a second SKU). */
export const CANONICAL_NEPSE_EBOOK_SLUG = "nepse-trading-guide";
export const LEGACY_NEPSE_BUNDLE_SLUG = "nepse-trading-community";

/**
 * If the canonical NEPSE guide exists, keep it published.
 * Does not recreate deleted ebooks or force-draft other products
 * (that was breaking admin re-uploads / deletes).
 */
export async function ensureSiteEbooksPublished() {
  try {
    await prisma.ebook.updateMany({
      where: {
        slug: CANONICAL_NEPSE_EBOOK_SLUG,
        status: { not: ContentStatus.PUBLISHED },
      },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("ensureSiteEbooksPublished failed:", error);
  }
}

export function slugifyEbookTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** @deprecated Use CANONICAL_NEPSE_EBOOK_SLUG */
export const SITE_EBOOK_SLUGS = [CANONICAL_NEPSE_EBOOK_SLUG, LEGACY_NEPSE_BUNDLE_SLUG] as const;
