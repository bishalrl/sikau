import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/local-storage";

const allowedFolders = new Set(["course-assets", "payment-qr", "ebooks", "blog-covers"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const folder = String(formData.get("folder") ?? "");
    const file = formData.get("file");

    if (!(file instanceof File) || !allowedFolders.has(folder)) {
      return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    }

    const path = await saveUploadedFile(
      file,
      folder as "course-assets" | "payment-qr" | "ebooks" | "blog-covers",
    );
    return NextResponse.json({ path });
  } catch {
    return NextResponse.json({ error: "Unable to upload file." }, { status: 500 });
  }
}
