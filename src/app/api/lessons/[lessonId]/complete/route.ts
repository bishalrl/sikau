import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lessonId } = await params;
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        lessonId,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json({ error: "Unable to update lesson progress." }, { status: 500 });
  }
}
