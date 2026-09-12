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
      let coverImage = product.coverImage;
      let samplePdfPath = product.samplePdfPath;
      let previewImages: string[] = [];
      try {
        const parsed = JSON.parse(product.previewImagesJson || "[]") as unknown;
        previewImages = Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        previewImages = [];
      }

      if (qr instanceof File && qr.size > 0) {
        paymentQrPath = await saveUploadedFile(qr, "payment-qr");
      }

      const cover = formData.get("coverImage");
      if (cover instanceof File && cover.size > 0) {
        coverImage = await saveUploadedFile(cover, "newsletter");
      }

      const samplePdf = formData.get("samplePdf");
      if (samplePdf instanceof File && samplePdf.size > 0) {
        const name = samplePdf.name.toLowerCase();
        if (!name.endsWith(".pdf")) {
          return NextResponse.json({ error: "Sample report must be a PDF." }, { status: 400 });
        }
        samplePdfPath = await saveUploadedFile(samplePdf, "newsletter");
      }

      const previewFiles = formData.getAll("previewImages").filter((item) => item instanceof File && item.size > 0);
      if (previewFiles.length > 0) {
        const uploaded: string[] = [];
        for (const file of previewFiles) {
          if (!(file instanceof File)) continue;
          uploaded.push(await saveUploadedFile(file, "newsletter"));
        }
        previewImages = uploaded.slice(0, 6);
      }

      const plansRaw = String(formData.get("plans") ?? "");
      if (plansRaw) {
        try {
          const plans = JSON.parse(plansRaw) as Array<{
            id: string;
            priceNpr: number;
            listPriceNpr?: number | null;
            discountPercent?: number | null;
            perDayNpr?: number | null;
            badge?: string | null;
          }>;
          for (const plan of plans) {
            if (!plan.id) continue;
            await prisma.newsletterPlan.update({
              where: { id: plan.id },
              data: {
                priceNpr: Number.isFinite(plan.priceNpr) ? plan.priceNpr : undefined,
                listPriceNpr:
                  plan.listPriceNpr == null || Number.isNaN(Number(plan.listPriceNpr))
                    ? null
                    : Number(plan.listPriceNpr),
                discountPercent:
                  plan.discountPercent == null || Number.isNaN(Number(plan.discountPercent))
                    ? null
                    : Number(plan.discountPercent),
                perDayNpr:
                  plan.perDayNpr == null || Number.isNaN(Number(plan.perDayNpr))
                    ? null
                    : Number(plan.perDayNpr),
                badge: plan.badge || null,
              },
            });
          }
        } catch {
          return NextResponse.json({ error: "Invalid plans payload." }, { status: 400 });
        }
      }

      const monthlyPlan = await prisma.newsletterPlan.findUnique({
        where: { productId_code: { productId: product.id, code: "MONTHLY" } },
      });

      const updated = await prisma.newsletterProduct.update({
        where: { id: product.id },
        data: {
          title,
          description,
          priceNpr: monthlyPlan?.priceNpr ?? (Number.isFinite(priceNpr) ? priceNpr : product.priceNpr),
          paymentInstructions: paymentInstructions || null,
          isActive,
          paymentQrPath,
          coverImage,
          samplePdfPath,
          previewImagesJson: JSON.stringify(previewImages),
        },
        include: {
          community: true,
          plans: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      });

      await prisma.community.update({
        where: { id: updated.communityId },
        data: {
          name: title,
          description: description || "Paid newsletter updates — members can read only.",
          permissions: NEWSLETTER_COMMUNITY_PERMISSIONS,
          coverImage: coverImage || null,
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
