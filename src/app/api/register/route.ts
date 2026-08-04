import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { issueEmailOtp } from "@/lib/email-otp";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["LEARNER", "INSTRUCTOR"]).default("LEARNER"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);
    const email = parsed.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.emailVerifiedAt) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: parsed.name,
            passwordHash,
            role: parsed.role,
            authProvider: "email",
          },
          select: { id: true, email: true, role: true },
        })
      : await prisma.user.create({
          data: {
            name: parsed.name,
            email,
            passwordHash,
            role: parsed.role,
            authProvider: "email",
          },
          select: { id: true, email: true, role: true },
        });

    try {
      await issueEmailOtp(user.id, email);
    } catch (mailError) {
      console.error("OTP email failed:", mailError);
      return NextResponse.json(
        {
          error:
            "Account created, but we could not send the verification email. Check SMTP settings and try resending the code.",
          needsVerification: true,
          email,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        needsVerification: true,
        email,
        message: "We sent a 6-digit verification code to your email.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "";
    if (message.includes("DATABASE_URL") || message.includes("ECONNREFUSED") || message.includes("password authentication")) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Add a working DATABASE_URL to .env, then run prisma:push and prisma:seed.",
        },
        { status: 503 },
      );
    }

    console.error("Register failed:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
