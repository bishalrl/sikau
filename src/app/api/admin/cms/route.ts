import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createCmsItem, deleteCmsItem, saveCmsRecords } from "@/lib/cms/store";

const saveSchema = z.object({
  entries: z
    .array(
      z.object({
        key: z.string().min(1),
        enabled: z.boolean(),
        sortOrder: z.number().int().optional(),
        label: z.string().optional(),
        data: z.record(z.string(), z.string()),
      }),
    )
    .min(1),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return null;
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json()) as { action?: string; parentKey?: string; key?: string };
    if (body.action === "create-item") {
      const parentKey = z.string().min(1).parse(body.parentKey);
      const item = await createCmsItem(parentKey, session.user.id);
      return NextResponse.json({ item });
    }
    if (body.action === "delete-item") {
      const key = z.string().min(1).parse(body.key);
      await deleteCmsItem(key);
      return NextResponse.json({ ok: true });
    }

    const input = saveSchema.parse(body);
    await saveCmsRecords(input.entries, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid content." }, { status: 400 });
    }
    console.error("CMS save failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save content." }, { status: 500 });
  }
}
