import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { ensureCommunityMembershipsForEbookOrder } from "@/lib/community-access";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = reviewSchema.parse(await request.json());
    const { orderId } = await params;

    const order = await prisma.ebookOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: input.status === "APPROVED" ? PaymentStatus.APPROVED : PaymentStatus.REJECTED,
        notes: input.notes,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    if (input.status === "APPROVED") {
      await ensureCommunityMembershipsForEbookOrder(order.id);
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid review payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to review ebook order." }, { status: 500 });
  }
}
