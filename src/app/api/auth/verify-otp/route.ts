import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/email-otp";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().trim().min(4).max(8),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await verifyEmailOtp(input.email, input.otp);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Email verified successfully. You can log in now.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("Verify OTP failed:", error);
    return NextResponse.json({ error: "Unable to verify code." }, { status: 500 });
  }
}
