import { NextResponse } from "next/server";
import { z } from "zod";
import { issueEmailOtp } from "@/lib/email-otp";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ error: "This email is already verified. Please log in." }, { status: 400 });
    }

    try {
      await issueEmailOtp(user.id, email);
    } catch (mailError) {
      console.error("Resend OTP failed:", mailError);
      return NextResponse.json(
        { error: "Unable to send verification email. Check SMTP settings." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "A new verification code was sent to your email.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to resend code." }, { status: 500 });
  }
}
