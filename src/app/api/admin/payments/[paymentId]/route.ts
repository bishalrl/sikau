import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = reviewSchema.parse(await request.json());
    const { paymentId } = await params;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: input.status,
        notes: input.notes,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    await prisma.enrollment.update({
      where: { id: payment.enrollmentId },
      data: {
        paymentStatus: input.status === "APPROVED" ? PaymentStatus.APPROVED : PaymentStatus.REJECTED,
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid review payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to review payment." }, { status: 500 });
  }
}
