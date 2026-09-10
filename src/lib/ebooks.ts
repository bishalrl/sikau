import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SITE_EBOOK_SLUGS = ["nepse-trading-guide", "nepse-trading-community"] as const;

/** Keep the live /ebooks packages buyable even if an admin save left them as Draft. */
export async function ensureSiteEbooksPublished() {
  try {
    await prisma.ebook.updateMany({
      where: {
        slug: { in: [...SITE_EBOOK_SLUGS] },
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
