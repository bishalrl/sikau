import { ReviewType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

const typeSchema = z.enum(["COURSE", "NEWSLETTER", "EBOOK"]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const typeRaw = String(formData.get("type") ?? "").trim().toUpperCase();
    const image = formData.get("image");

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: "Please enter your name (2–80 characters)." }, { status: 400 });
    }
    if (body.length < 10 || body.length > 4000) {
      return NextResponse.json({ error: "Review must be between 10 and 4000 characters." }, { status: 400 });
    }

    const typeParsed = typeSchema.safeParse(typeRaw);
    if (!typeParsed.success) {
      return NextResponse.json({ error: "Choose a review type: Course, Newsletter, or E-book." }, { status: 400 });
    }

    let imagePath: string | null = null;
    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
      }
      if (image.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
      }
      imagePath = await saveUploadedFile(image, "reviews");
    }

    const review = await prisma.review.create({
      data: {
        name,
        body,
        type: typeParsed.data as ReviewType,
        imagePath,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Thank you — your review was submitted.",
        review: { id: review.id },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create review failed:", error);
    return NextResponse.json({ error: "Unable to submit review right now." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ reviews });
}
