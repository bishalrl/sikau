import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mail";

const OTP_TTL_MS = 10 * 60 * 1000;

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueEmailOtp(userId: string, email: string) {
  const otp = generateOtpCode();
  const emailOtpHash = await bcrypt.hash(otp, 10);
  const emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailOtpHash,
      emailOtpExpiresAt,
      emailVerifiedAt: null,
    },
  });

  await sendOtpEmail(email, otp);
  return { expiresAt: emailOtpExpiresAt };
}

export async function verifyEmailOtp(email: string, otp: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user?.emailOtpHash || !user.emailOtpExpiresAt) {
    return { ok: false as const, error: "No verification code found. Please request a new one." };
  }

  if (user.emailOtpExpiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "Verification code expired. Please request a new one." };
  }

  const matches = await bcrypt.compare(otp.trim(), user.emailOtpHash);
  if (!matches) {
    return { ok: false as const, error: "Invalid verification code." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailOtpHash: null,
      emailOtpExpiresAt: null,
    },
  });

  return { ok: true as const, userId: user.id };
}
