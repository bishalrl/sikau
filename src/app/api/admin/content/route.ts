import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upsertWebsiteContent } from "@/lib/repositories";

const contentSchema = z.object({
  key: z.string().min(1),
  locale: z.string().default("en"),
  title: z.string().min(1),
  markdown: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = contentSchema.parse(await request.json());
    const record = await upsertWebsiteContent({
      ...input,
      userId: session.user.id,
    });

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save content." }, { status: 500 });
  }
}
