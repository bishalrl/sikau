import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const enrollSchema = z.object({
  courseSlug: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const input = enrollSchema.parse(await request.json());
    const course = await prisma.course.findUnique({
      where: { slug: input.courseSlug },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const isFree = course.priceNpr <= 0;

    // Paid courses: no DB rows until receipt is uploaded on the payment page.
    if (!isFree) {
      return NextResponse.json({
        paymentStatus: null,
        redirectTo: `/payment/${course.slug}`,
      });
    }

    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
      update: {
        paymentStatus: PaymentStatus.APPROVED,
      },
      create: {
        userId: session.user.id,
        courseId: course.id,
        paymentStatus: PaymentStatus.APPROVED,
      },
    });

    await prisma.payment.upsert({
      where: { enrollmentId: enrollment.id },
      update: {
        amount: 0,
        status: PaymentStatus.APPROVED,
        notes: "Free course — auto approved.",
      },
      create: {
        enrollmentId: enrollment.id,
        amount: 0,
        status: PaymentStatus.APPROVED,
        notes: "Free course — auto approved.",
      },
    });

    await prisma.course.update({
      where: { id: course.id },
      data: { studentsCount: { increment: 1 } },
    });

    return NextResponse.json({
      enrollmentId: enrollment.id,
      paymentStatus: PaymentStatus.APPROVED,
      redirectTo: `/study/${course.slug}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create enrollment." }, { status: 500 });
  }
}
