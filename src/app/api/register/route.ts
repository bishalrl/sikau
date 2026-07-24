import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
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

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email,
        passwordHash,
        role: parsed.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
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
