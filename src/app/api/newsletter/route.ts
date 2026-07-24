import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(200),
  source: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.parse(body);
    const email = parsed.email.toLowerCase();

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {
        source: parsed.source ?? "footer",
      },
      create: {
        email,
        source: parsed.source ?? "footer",
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Subscribed successfully.",
      subscriber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid email." }, { status: 400 });
    }

    console.error("Newsletter subscribe failed:", error);
    return NextResponse.json({ error: "Unable to subscribe right now." }, { status: 500 });
  }
}
