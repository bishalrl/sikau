import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/roles";

export async function userHasLearnerAccess(userId: string, role?: string | null) {
  if (isElevatedRole(role)) {
    return true;
  }

  const [enrollment, ebookOrder] = await Promise.all([
    prisma.enrollment.findFirst({
      where: { userId, paymentStatus: PaymentStatus.APPROVED },
      select: { id: true },
    }),
    prisma.ebookOrder.findFirst({
      where: { userId, paymentStatus: PaymentStatus.APPROVED },
      select: { id: true },
    }),
  ]);

  return Boolean(enrollment || ebookOrder);
}

export function canJoinLiveByTime(scheduledAt: Date, now = new Date()) {
  return now.getTime() >= scheduledAt.getTime();
}

export function canAdminStartLive(scheduledAt: Date, status: string, now = new Date()) {
  return status === "SCHEDULED" && now.getTime() >= scheduledAt.getTime();
}
