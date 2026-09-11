import { EbookPurchaseType, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { ebookHasCommunityOffer, resolvePurchaseAmount } from "@/lib/ebook-offer";
import { prisma } from "@/lib/prisma";

const orderSchema = z.object({
  ebookSlug: z.string().min(1),
  purchaseType: z.nativeEnum(EbookPurchaseType).default(EbookPurchaseType.SOLO_EBOOK),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = orderSchema.parse(await request.json());
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

    let purchaseType = input.purchaseType;
    if (purchaseType === EbookPurchaseType.COMMUNITY_BUNDLE && !ebookHasCommunityOffer(ebook)) {
      return NextResponse.json(
        { error: "Community offer is not available for this ebook." },
        { status: 400 },
      );
    }

    const existing = await prisma.ebookOrder.findUnique({
      where: {
        userId_ebookId: {
          userId: session.user.id,
          ebookId: ebook.id,
        },
      },
    });

    if (
      existing?.paymentStatus === PaymentStatus.APPROVED &&
      existing.purchaseType === EbookPurchaseType.COMMUNITY_BUNDLE
    ) {
      return NextResponse.json({
        paymentStatus: PaymentStatus.APPROVED,
        purchaseType: existing.purchaseType,
        redirectTo: `/ebooks/${ebook.slug}/read`,
        downloadPath: ebook.filePath,
      });
    }

    if (
      existing?.paymentStatus === PaymentStatus.APPROVED &&
      existing.purchaseType === EbookPurchaseType.SOLO_EBOOK &&
      purchaseType === EbookPurchaseType.SOLO_EBOOK
    ) {
      return NextResponse.json({
        paymentStatus: PaymentStatus.APPROVED,
        purchaseType: existing.purchaseType,
        redirectTo: `/ebooks/${ebook.slug}/read`,
        downloadPath: ebook.filePath,
      });
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

    const payPath = `/ebooks/${ebook.slug}/pay?type=${purchaseType === EbookPurchaseType.COMMUNITY_BUNDLE ? "community" : "solo"}`;

    return NextResponse.json({
      paymentStatus: existing?.paymentStatus ?? null,
      purchaseType,
      redirectTo: payPath,
      downloadPath: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create ebook order." }, { status: 500 });
  }
}
