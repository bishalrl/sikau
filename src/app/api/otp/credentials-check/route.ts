import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return NextResponse.json(
        {
          error: user
            ? "This account uses Google sign-in. Please continue with Google."
            : "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Seeded admin uses a non-mailbox address — skip OTP for ADMIN.
    if (!user.emailVerifiedAt && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          needsVerification: true,
          email,
          error: "Please verify your email with the OTP we sent you.",
        },
        { status: 403 },
      );
    }

    if (!user.emailVerifiedAt && user.role === "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          emailOtpHash: null,
          emailOtpExpiresAt: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to check credentials." }, { status: 500 });
  }
}
