import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const ebook = await prisma.ebook.findUnique({ where: { id } });
    if (!ebook) {
      return NextResponse.json({ error: "Ebook not found." }, { status: 404 });
    }

    // Clear related rows explicitly so delete works even if DB cascades differ.
    await prisma.$transaction([
      prisma.ebookOrder.deleteMany({ where: { ebookId: id } }),
      prisma.communityEbookLink.deleteMany({ where: { ebookId: id } }),
      prisma.ebook.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete ebook failed:", error);
    const message =
      error instanceof Error && error.message.includes("Foreign key")
        ? "This ebook is still linked to other data and could not be deleted."
        : "Unable to delete ebook.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
