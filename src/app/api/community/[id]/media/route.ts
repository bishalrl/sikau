import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  CommunityAccessError,
  assertCommunityMember,
} from "@/lib/community-access";
import { contentTypeForFileName, readUploadedFile, UPLOAD_FOLDERS } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * Membership-gated media for community attachments (newsletter PDFs).
 * Served inline — no Content-Disposition: attachment.
 */
export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: communityId } = await params;
  const url = new URL(request.url);
  const folder = url.searchParams.get("folder") ?? "";
  const fileName = url.searchParams.get("file") ?? "";

  if (!UPLOAD_FOLDERS.includes(folder as (typeof UPLOAD_FOLDERS)[number])) {
    return NextResponse.json({ error: "Invalid folder." }, { status: 400 });
  }
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return NextResponse.json({ error: "Invalid file." }, { status: 400 });
  }

  try {
    if (session.user.role !== "ADMIN") {
      await assertCommunityMember(session.user.id, communityId);
    } else {
      // Ensure admin can open even if not yet a member row.
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { id: true },
      });
      if (!community) {
        return NextResponse.json({ error: "Community not found." }, { status: 404 });
      }
    }
  } catch (error) {
    if (error instanceof CommunityAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const file = await readUploadedFile(folder, fileName);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const contentType = contentTypeForFileName(fileName);
  const isPdf = contentType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.data.byteLength),
      "Cache-Control": "private, no-store",
      "Content-Disposition": isPdf
        ? `inline; filename="${fileName.replace(/"/g, "")}"`
        : `inline; filename="${fileName.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
