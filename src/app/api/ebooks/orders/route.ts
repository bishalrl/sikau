import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const orderSchema = z.object({
  ebookSlug: z.string().min(1),
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
      },
    });

    if (!ebook || ebook.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Ebook not found." }, { status: 404 });
    }

    const isFree = ebook.isFree || ebook.priceNpr <= 0;
    const paymentStatus = isFree ? PaymentStatus.APPROVED : PaymentStatus.PENDING;

    const order = await prisma.ebookOrder.upsert({
      where: {
        userId_ebookId: {
          userId: session.user.id,
          ebookId: ebook.id,
        },
      },
      update: isFree ? { paymentStatus: PaymentStatus.APPROVED, amount: 0 } : {},
      create: {
        userId: session.user.id,
        ebookId: ebook.id,
        amount: ebook.priceNpr,
        paymentStatus,
        notes: isFree ? "Free ebook — auto approved." : null,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      paymentStatus,
      redirectTo: isFree ? `/ebooks/${ebook.slug}/read` : `/ebooks/${ebook.slug}/pay`,
      downloadPath: isFree ? ebook.filePath : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create ebook order." }, { status: 500 });
  }
}
