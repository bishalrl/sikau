import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { NEWSLETTER_COMMUNITY_PERMISSIONS } from "@/lib/community-access";
import { ensureNewsletterProduct } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/local-storage";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  priceNpr: z.number().int().min(0),
  paymentInstructions: z.string().trim().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const product = await ensureNewsletterProduct(session.user.id);
  return NextResponse.json({ product });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const product = await ensureNewsletterProduct(session.user.id);
      const title = String(formData.get("title") ?? product.title);
      const description = String(formData.get("description") ?? product.description);
      const priceNpr = Number(formData.get("priceNpr") ?? product.priceNpr);
      const paymentInstructions = String(formData.get("paymentInstructions") ?? "");
      const isActive = String(formData.get("isActive") ?? "true") === "true";
      const qr = formData.get("paymentQr");

      let paymentQrPath = product.paymentQrPath;
      if (qr instanceof File && qr.size > 0) {
        paymentQrPath = await saveUploadedFile(qr, "payment-qr");
      }

      const updated = await prisma.newsletterProduct.update({
        where: { id: product.id },
        data: {
          title,
          description,
          priceNpr: Number.isFinite(priceNpr) ? priceNpr : product.priceNpr,
          paymentInstructions: paymentInstructions || null,
          isActive,
          paymentQrPath,
        },
        include: { community: true },
      });

      await prisma.community.update({
        where: { id: updated.communityId },
        data: {
          name: title,
          description: description || "Paid newsletter updates — members can read only.",
          permissions: NEWSLETTER_COMMUNITY_PERMISSIONS,
        },
      });

      return NextResponse.json({ product: updated });
    }

    const input = updateSchema.parse(await request.json());
    const product = await ensureNewsletterProduct(session.user.id);

    const updated = await prisma.newsletterProduct.update({
      where: { id: product.id },
      data: {
        title: input.title,
        description: input.description ?? "",
        priceNpr: input.priceNpr,
        paymentInstructions: input.paymentInstructions ?? null,
        isActive: input.isActive ?? true,
      },
      include: { community: true },
    });

    await prisma.community.update({
      where: { id: updated.communityId },
      data: {
        name: input.title,
        description: input.description || "Paid newsletter updates — members can read only.",
        permissions: NEWSLETTER_COMMUNITY_PERMISSIONS,
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    console.error("Update newsletter product failed:", error);
    return NextResponse.json({ error: "Unable to update newsletter product." }, { status: 500 });
  }
}
