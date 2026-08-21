import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/local-storage";
import { getActiveNewsletterProduct } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const notes = String(formData.get("notes") ?? "");
    const receipt = formData.get("receipt");

    if (!(receipt instanceof File)) {
      return NextResponse.json({ error: "Receipt is required." }, { status: 400 });
    }

    const product = await getActiveNewsletterProduct();
    if (!product) {
      return NextResponse.json({ error: "Newsletter is not available." }, { status: 404 });
    }

    let order = await prisma.newsletterOrder.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: product.id,
        },
      },
    });

    if (!order) {
      order = await prisma.newsletterOrder.create({
        data: {
          userId: session.user.id,
          productId: product.id,
          amount: product.priceNpr,
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    }

    if (order.paymentStatus === PaymentStatus.APPROVED) {
      return NextResponse.json({ error: "You already have access." }, { status: 400 });
    }

    const receiptPath = await saveUploadedFile(receipt, "receipts");
    const updated = await prisma.newsletterOrder.update({
      where: { id: order.id },
      data: {
        receiptPath,
        notes,
        amount: product.priceNpr,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Unable to upload newsletter receipt." }, { status: 500 });
  }
}
