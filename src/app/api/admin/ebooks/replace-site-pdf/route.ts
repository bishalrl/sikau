import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { readUploadedFileByPublicPath } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";
import { writeSiteAsset } from "@/lib/site-files";
import { SITE_ASSET_FILES } from "@/lib/site-assets";

const replacePdfSchema = z.object({
  filePath: z.string().min(1),
  syncNepseEbooks: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = replacePdfSchema.parse(await request.json());

    if (
      input.filePath === SITE_ASSET_FILES.pdf ||
      input.filePath.endsWith("/e-book.pdf")
    ) {
      return NextResponse.json(
        { error: "Upload a new PDF first, then replace the site copy." },
        { status: 400 },
      );
    }

    if (!input.filePath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Only uploaded PDF paths are supported." }, { status: 400 });
    }

    const file = await readUploadedFileByPublicPath(input.filePath);
    if (!file) {
      return NextResponse.json({ error: "Uploaded PDF not found." }, { status: 404 });
    }

    const ok = await writeSiteAsset("e-book.pdf", file.data);
    if (!ok) {
      return NextResponse.json({ error: "Unable to write site PDF." }, { status: 500 });
    }

    if (input.syncNepseEbooks) {
      await prisma.ebook.updateMany({
        where: {
          slug: { in: ["nepse-trading-guide", "nepse-trading-community"] },
        },
        data: { filePath: SITE_ASSET_FILES.pdf },
      });
    }

    return NextResponse.json({
      ok: true,
      sitePdf: SITE_ASSET_FILES.pdf,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to replace site PDF." }, { status: 500 });
  }
}
