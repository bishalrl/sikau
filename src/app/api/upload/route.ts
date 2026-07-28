import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveUploadedFile, type UploadFolder } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

const adminFolders = new Set(["course-assets", "payment-qr", "ebooks", "blog-covers"]);
const memberFolders = new Set(["community-media"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const folder = String(formData.get("folder") ?? "");
    const file = formData.get("file");
    const communityId = String(formData.get("communityId") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    }

    const isAdmin = ["ADMIN", "INSTRUCTOR"].includes(session.user.role);

    if (adminFolders.has(folder)) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (memberFolders.has(folder)) {
      if (!communityId) {
        return NextResponse.json({ error: "communityId required." }, { status: 400 });
      }
      if (session.user.role === "ADMIN") {
        await prisma.communityMember.upsert({
          where: {
            communityId_userId: {
              communityId,
              userId: session.user.id,
            },
          },
          update: { role: "ADMIN", bannedAt: null, mutedUntil: null },
          create: {
            communityId,
            userId: session.user.id,
            role: "ADMIN",
          },
        });
      } else {
        const membership = await prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId,
              userId: session.user.id,
            },
          },
        });
        if (!membership || membership.bannedAt) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (membership.mutedUntil && membership.mutedUntil.getTime() > Date.now()) {
          return NextResponse.json({ error: "You are muted." }, { status: 403 });
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid upload folder." }, { status: 400 });
    }

    const path = await saveUploadedFile(file, folder as UploadFolder);
    return NextResponse.json({
      path,
      mime: file.type || "application/octet-stream",
      size: file.size,
      name: file.name,
    });
  } catch {
    return NextResponse.json({ error: "Unable to upload file." }, { status: 500 });
  }
}
