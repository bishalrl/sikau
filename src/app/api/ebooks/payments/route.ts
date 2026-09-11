import { EbookPurchaseType, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ebookHasCommunityOffer, resolvePurchaseAmount } from "@/lib/ebook-offer";
import { saveUploadedFile } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const ebookSlug = String(formData.get("ebookSlug") ?? "");
    const notes = String(formData.get("notes") ?? "");
    const purchaseTypeRaw = String(formData.get("purchaseType") ?? "SOLO_EBOOK").toUpperCase();
    const receipt = formData.get("receipt");

    if (!ebookSlug || !(receipt instanceof File)) {
      return NextResponse.json({ error: "Ebook and receipt are required." }, { status: 400 });
    }

    const purchaseType =
      purchaseTypeRaw === "COMMUNITY_BUNDLE"
        ? EbookPurchaseType.COMMUNITY_BUNDLE
        : EbookPurchaseType.SOLO_EBOOK;

    const ebook = await prisma.ebook.findUnique({
      where: { slug: ebookSlug },
      select: {
        id: true,
        slug: true,
        priceNpr: true,
        isFree: true,
        communityOfferEnabled: true,
        communityOfferName: true,
        communityOfferPriceNpr: true,
      },
    });
    if (!ebook) {
      return NextResponse.json({ error: "Ebook not found." }, { status: 404 });
    }

    if (purchaseType === EbookPurchaseType.COMMUNITY_BUNDLE && !ebookHasCommunityOffer(ebook)) {
      return NextResponse.json(
        { error: "Community offer is not available for this ebook." },
        { status: 400 },
      );
    }

    const amount = resolvePurchaseAmount(ebook, purchaseType);

    let order = await prisma.ebookOrder.findUnique({
      where: {
        userId_ebookId: {
          userId: session.user.id,
          ebookId: ebook.id,
        },
      },
    });

    if (order?.paymentStatus === PaymentStatus.APPROVED) {
      const upgradingToBundle =
        order.purchaseType === EbookPurchaseType.SOLO_EBOOK &&
        purchaseType === EbookPurchaseType.COMMUNITY_BUNDLE;
      if (!upgradingToBundle) {
        return NextResponse.json({ error: "You already have access." }, { status: 400 });
      }
    }

    if (!order) {
      order = await prisma.ebookOrder.create({
        data: {
          userId: session.user.id,
          ebookId: ebook.id,
          amount,
          purchaseType,
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    }

    const receiptPath = await saveUploadedFile(receipt, "receipts");
    const updated = await prisma.ebookOrder.update({
      where: { id: order.id },
      data: {
        receiptPath,
        notes,
        amount,
        purchaseType,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Unable to upload ebook receipt." }, { status: 500 });
  }
}
