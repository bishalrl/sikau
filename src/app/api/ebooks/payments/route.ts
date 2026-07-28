import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const receipt = formData.get("receipt");

    if (!ebookSlug || !(receipt instanceof File)) {
      return NextResponse.json({ error: "Ebook and receipt are required." }, { status: 400 });
    }

    const ebook = await prisma.ebook.findUnique({
      where: { slug: ebookSlug },
      select: {
        id: true,
        slug: true,
        priceNpr: true,
      },
    });
    if (!ebook) {
      return NextResponse.json({ error: "Ebook not found." }, { status: 404 });
    }

    let order = await prisma.ebookOrder.findUnique({
      where: {
        userId_ebookId: {
          userId: session.user.id,
          ebookId: ebook.id,
        },
      },
    });

    if (!order) {
      order = await prisma.ebookOrder.create({
        data: {
          userId: session.user.id,
          ebookId: ebook.id,
          amount: ebook.priceNpr,
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
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Unable to upload ebook receipt." }, { status: 500 });
  }
}
