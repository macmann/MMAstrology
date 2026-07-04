import { getDailyFreeCreditAllowance } from "@/lib/credit-settings";
import { prisma } from "@/lib/prisma";

export function getUtcStartOfToday(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function checkAndResetCredits(userId: string, now = new Date()) {
  const todayUtc = getUtcStartOfToday(now);
  const dailyFreeCreditAllowance = await getDailyFreeCreditAllowance();

  await prisma.user.updateMany({
    where: {
      id: userId,
      lastCreditReset: {
        lt: todayUtc,
      },
    },
    data: {
      dailyFreeCredits: dailyFreeCreditAllowance,
      lastCreditReset: todayUtc,
    },
  });

  const credits = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      dailyFreeCredits: true,
      purchasedCredits: true,
      isPro: true,
      lastCreditReset: true,
    },
  });

  return credits ? { ...credits, dailyFreeCreditAllowance } : null;
}
