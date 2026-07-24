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

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enroll before uploading a receipt." }, { status: 404 });
    }

    const receiptPath = await saveUploadedFile(receipt, "receipts");
    const payment = await prisma.payment.upsert({
      where: { enrollmentId: enrollment.id },
      update: {
        receiptPath,
        notes,
        status: PaymentStatus.PENDING,
      },
      create: {
        enrollmentId: enrollment.id,
        amount: course.priceNpr,
        receiptPath,
        notes,
        status: PaymentStatus.PENDING,
      },
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { paymentStatus: PaymentStatus.PENDING },
    });

    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: "Unable to upload receipt." }, { status: 500 });
  }
}
