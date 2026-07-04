import { prisma } from "@/lib/prisma";

export const DAILY_FREE_CREDIT_ALLOWANCE_KEY = "daily-free-credit-allowance";
export const DEFAULT_DAILY_FREE_CREDIT_ALLOWANCE = 4;

export function parseDailyFreeCreditAllowance(value: string | null | undefined) {
  const allowance = Number(String(value ?? "").trim());

  if (!Number.isSafeInteger(allowance) || allowance < 0) {
    return DEFAULT_DAILY_FREE_CREDIT_ALLOWANCE;
  }

  return allowance;
}

export function serializeDailyFreeCreditAllowance(allowance: number) {
  return String(allowance);
}

export async function getDailyFreeCreditAllowance() {
  const config = await prisma.promptConfig.findUnique({
    where: { key: DAILY_FREE_CREDIT_ALLOWANCE_KEY },
    select: { prompt: true },
  });

  return parseDailyFreeCreditAllowance(config?.prompt);
}
