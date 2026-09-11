import { EbookPurchaseType, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { ebookHasCommunityOffer, resolvePurchaseAmount } from "@/lib/ebook-offer";
import { CANONICAL_NEPSE_EBOOK_SLUG, LEGACY_NEPSE_BUNDLE_SLUG } from "@/lib/ebooks";
import { prisma } from "@/lib/prisma";

const orderSchema = z.object({
  ebookSlug: z.string().min(1),
  purchaseType: z.enum(["SOLO_EBOOK", "COMMUNITY_BUNDLE"]).optional(),
});

async function findUserOrderForEbook(userId: string, ebookId: string, ebookSlug: string) {
  const direct = await prisma.ebookOrder.findUnique({
    where: { userId_ebookId: { userId, ebookId } },
    select: {
      id: true,
      paymentStatus: true,
      purchaseType: true,
      amount: true,
      receiptPath: true,
    },
  });
  if (direct) return direct;

  // Legacy buyers purchased the old community SKU — treat as access to the guide.
  if (ebookSlug === CANONICAL_NEPSE_EBOOK_SLUG) {
    const legacy = await prisma.ebook.findUnique({
      where: { slug: LEGACY_NEPSE_BUNDLE_SLUG },
      select: { id: true },
    });
    if (!legacy) return null;
    const legacyOrder = await prisma.ebookOrder.findUnique({
      where: { userId_ebookId: { userId, ebookId: legacy.id } },
      select: {
        id: true,
        paymentStatus: true,
        purchaseType: true,
        amount: true,
        receiptPath: true,
      },
    });
    if (!legacyOrder) return null;
    return {
      ...legacyOrder,
      // Legacy community SKU always meant bundle access.
      purchaseType:
        legacyOrder.purchaseType === EbookPurchaseType.SOLO_EBOOK
          ? EbookPurchaseType.COMMUNITY_BUNDLE
          : (legacyOrder.purchaseType ?? EbookPurchaseType.COMMUNITY_BUNDLE),
    };
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const input = orderSchema.parse(body);
    const purchaseType =
      input.purchaseType === "COMMUNITY_BUNDLE"
        ? EbookPurchaseType.COMMUNITY_BUNDLE
        : EbookPurchaseType.SOLO_EBOOK;

    const ebook = await prisma.ebook.findUnique({
      where: { slug: input.ebookSlug },
      select: {
        id: true,
        slug: true,
        filePath: true,
        priceNpr: true,
        isFree: true,
        status: true,
        communityOfferEnabled: true,
        communityOfferName: true,
        communityOfferPriceNpr: true,
      },
    });

    if (!ebook) {
      return NextResponse.json({ error: "Ebook not found." }, { status: 404 });
    }

    if (ebook.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This ebook is not published yet." },
        { status: 404 },
      );
    }

    if (purchaseType === EbookPurchaseType.COMMUNITY_BUNDLE && !ebookHasCommunityOffer(ebook)) {
      return NextResponse.json(
        { error: "Community offer is not available for this ebook." },
        { status: 400 },
      );
    }

    const existing = await findUserOrderForEbook(session.user.id, ebook.id, ebook.slug);
    const existingType = existing?.purchaseType ?? EbookPurchaseType.SOLO_EBOOK;

    if (existing?.paymentStatus === PaymentStatus.APPROVED) {
      const alreadyHasBundle = existingType === EbookPurchaseType.COMMUNITY_BUNDLE;
      // Solo (or open) request: any approved purchase unlocks reading.
      if (purchaseType === EbookPurchaseType.SOLO_EBOOK || alreadyHasBundle) {
        return NextResponse.json({
          paymentStatus: PaymentStatus.APPROVED,
          purchaseType: existingType,
          redirectTo: `/ebooks/${ebook.slug}/read`,
          downloadPath: ebook.filePath,
        });
      }
      // Requesting community bundle but only has solo → continue to upgrade pay flow.
    }

    const amount = resolvePurchaseAmount(ebook, purchaseType);
    const isFree = purchaseType === EbookPurchaseType.SOLO_EBOOK && amount <= 0;

    if (isFree) {
      const order = await prisma.ebookOrder.upsert({
        where: {
          userId_ebookId: {
            userId: session.user.id,
            ebookId: ebook.id,
          },
        },
        update: {
          paymentStatus: PaymentStatus.APPROVED,
          amount: 0,
          purchaseType: EbookPurchaseType.SOLO_EBOOK,
        },
        create: {
          userId: session.user.id,
          ebookId: ebook.id,
          amount: 0,
          purchaseType: EbookPurchaseType.SOLO_EBOOK,
          paymentStatus: PaymentStatus.APPROVED,
          notes: "Free ebook — auto approved.",
        },
      });

      return NextResponse.json({
        orderId: order.id,
        paymentStatus: PaymentStatus.APPROVED,
        purchaseType: order.purchaseType,
        redirectTo: `/ebooks/${ebook.slug}/read`,
        downloadPath: ebook.filePath,
      });
    }

    const payPath = `/ebooks/${ebook.slug}/pay?type=${
      purchaseType === EbookPurchaseType.COMMUNITY_BUNDLE ? "community" : "solo"
    }`;

    // Create/update a pending order so the pay page always has a checkout row.
    const order = await prisma.ebookOrder.upsert({
      where: {
        userId_ebookId: {
          userId: session.user.id,
          ebookId: ebook.id,
        },
      },
      update: {
        amount,
        purchaseType,
        ...(existing?.paymentStatus === PaymentStatus.APPROVED
          ? {}
          : { paymentStatus: PaymentStatus.PENDING }),
      },
      create: {
        userId: session.user.id,
        ebookId: ebook.id,
        amount,
        purchaseType,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      purchaseType,
      redirectTo: payPath,
      downloadPath: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("Unable to create ebook order:", error);
    const message =
      error instanceof Error && /purchaseType|communityOffer|column|P202[12]/i.test(error.message)
        ? "Ebook payment schema is out of date. Run `npx prisma db push` on the server, then restart."
        : "Unable to create ebook order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
