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
    const courseSlug = String(formData.get("courseSlug") ?? "");
    const notes = String(formData.get("notes") ?? "");
    const receipt = formData.get("receipt");

    if (!courseSlug || !(receipt instanceof File)) {
      return NextResponse.json({ error: "Course and receipt are required." }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (course.priceNpr <= 0) {
      return NextResponse.json({ error: "This course is free — no payment needed." }, { status: 400 });
    }

    const receiptPath = await saveUploadedFile(receipt, "receipts");

    // Create enrollment + payment only when the learner finishes by uploading a receipt.
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
      update: {
        paymentStatus: PaymentStatus.PENDING,
      },
      create: {
        userId: session.user.id,
        courseId: course.id,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    const payment = await prisma.payment.upsert({
      where: { enrollmentId: enrollment.id },
      update: {
        amount: course.priceNpr,
        receiptPath,
        notes: notes || null,
        status: PaymentStatus.PENDING,
      },
      create: {
        enrollmentId: enrollment.id,
        amount: course.priceNpr,
        receiptPath,
        notes: notes || null,
        status: PaymentStatus.PENDING,
      },
    });

    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: "Unable to upload receipt." }, { status: 500 });
  }
}
