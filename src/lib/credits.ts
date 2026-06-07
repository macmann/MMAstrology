import { prisma } from "@/lib/prisma";

const DAILY_FREE_CREDIT_ALLOWANCE = 4;

export function getUtcStartOfToday(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function checkAndResetCredits(userId: string, now = new Date()) {
  const todayUtc = getUtcStartOfToday(now);

  await prisma.user.updateMany({
    where: {
      id: userId,
      lastCreditReset: {
        lt: todayUtc,
      },
    },
    data: {
      dailyFreeCredits: DAILY_FREE_CREDIT_ALLOWANCE,
      lastCreditReset: todayUtc,
    },
  });

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      dailyFreeCredits: true,
      purchasedCredits: true,
      lastCreditReset: true,
    },
  });
}
