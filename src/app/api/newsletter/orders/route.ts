import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  getActiveNewsletterProduct,
  getNewsletterPlanByCode,
} from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  planCode: z.string().trim().min(1).max(32).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json().catch(() => ({}));
    const { planCode } = bodySchema.parse(json);

    const product = await getActiveNewsletterProduct();
    if (!product) {
      return NextResponse.json({ error: "Newsletter is not available." }, { status: 404 });
    }

    const code = (planCode ?? "MONTHLY").toUpperCase();
    const plan = await getNewsletterPlanByCode(product.id, code);
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Selected plan is not available." }, { status: 400 });
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

    if (existing) {
      await prisma.newsletterOrder.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          amount: plan.priceNpr,
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    } else {
      await prisma.newsletterOrder.create({
        data: {
          userId: session.user.id,
          productId: product.id,
          planId: plan.id,
          amount: plan.priceNpr,
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    }

    return NextResponse.json({
      paymentStatus: PaymentStatus.PENDING,
      redirectTo: `/newsletter/pay?plan=${encodeURIComponent(plan.code)}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to start newsletter order." }, { status: 500 });
  }
}
