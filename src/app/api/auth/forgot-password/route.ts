import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const resetSchema = z
  .object({
    email: z.string().email(),
    newPassword: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetSchema.parse(body);
    const email = parsed.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(parsed.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true, message: "Password updated. You can log in now." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("DATABASE_URL") ||
      message.includes("ECONNREFUSED") ||
      message.includes("password authentication")
    ) {
      return NextResponse.json(
        { error: "Database is not configured. Check DATABASE_URL in .env." },
        { status: 503 },
      );
    }

    console.error("Forgot password failed:", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
