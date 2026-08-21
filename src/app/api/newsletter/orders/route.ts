import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveNewsletterProduct } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const product = await getActiveNewsletterProduct();
    if (!product) {
      return NextResponse.json({ error: "Newsletter is not available." }, { status: 404 });
    }

    const existing = await prisma.newsletterOrder.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: product.id,
        },
      },
    });

    if (existing?.paymentStatus === PaymentStatus.APPROVED) {
      return NextResponse.json({
        paymentStatus: PaymentStatus.APPROVED,
        redirectTo: `/community/${product.community.slug}`,
      });
    }

    return NextResponse.json({
      paymentStatus: existing?.paymentStatus ?? null,
      redirectTo: "/newsletter/pay",
    });
  } catch {
    return NextResponse.json({ error: "Unable to start newsletter order." }, { status: 500 });
  }
}
