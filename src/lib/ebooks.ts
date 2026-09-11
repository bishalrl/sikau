import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Canonical NEPSE guide slug (community is an offer on this ebook, not a second SKU). */
export const CANONICAL_NEPSE_EBOOK_SLUG = "nepse-trading-guide";
export const LEGACY_NEPSE_BUNDLE_SLUG = "nepse-trading-community";

/** Keep the primary NEPSE guide published. */
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

    // Hide legacy second SKU from the catalog once the offer lives on the guide.
    await prisma.ebook.updateMany({
      where: { slug: LEGACY_NEPSE_BUNDLE_SLUG },
      data: { status: ContentStatus.DRAFT },
    });
  } catch (error) {
    console.error("ensureSiteEbooksPublished failed:", error);
  }
}

/** @deprecated Use CANONICAL_NEPSE_EBOOK_SLUG */
export const SITE_EBOOK_SLUGS = [CANONICAL_NEPSE_EBOOK_SLUG, LEGACY_NEPSE_BUNDLE_SLUG] as const;
