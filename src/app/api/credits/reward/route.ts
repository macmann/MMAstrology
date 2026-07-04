import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAdsEnabled } from "@/lib/ad-settings";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REWARDED_AD_REASON = "Rewarded Video Ad Completion";
const REWARDED_AD_CREDIT_AMOUNT = 1;
const MAX_REWARDED_ADS_PER_24_HOURS = 5;
const REWARDED_AD_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SERIALIZABLE_RETRIES = 3;

type RewardResult = {
  status: 200 | 429 | 404;
  payload: {
    error?: string;
    freeCredits?: number;
    purchasedCredits?: number;
    rewardedAdsRemaining?: number;
  };
};

async function grantRewardedCredit(userId: string, windowStart: Date): Promise<RewardResult> {
  return prisma.$transaction(
    async (tx) => {
      const rewardedAdCount = await tx.creditTransaction.count({
        where: {
          userId,
          reason: REWARDED_AD_REASON,
          createdAt: {
            gte: windowStart,
          },
        },
      });

      if (rewardedAdCount >= MAX_REWARDED_ADS_PER_24_HOURS) {
        return {
          status: 429,
          payload: {
            error: "You have already claimed the maximum rewarded ad credits for the last 24 hours.",
            rewardedAdsRemaining: 0,
          },
        };
      }

      const [user] = await Promise.all([
        tx.user.update({
          where: { id: userId },
          data: {
            purchasedCredits: {
              increment: REWARDED_AD_CREDIT_AMOUNT,
            },
          },
          select: {
            dailyFreeCredits: true,
            purchasedCredits: true,
          },
        }),
        tx.creditTransaction.create({
          data: {
            userId,
            amount: REWARDED_AD_CREDIT_AMOUNT,
            reason: REWARDED_AD_REASON,
          },
          select: { id: true },
        }),
      ]);

      return {
        status: 200,
        payload: {
          freeCredits: user.dailyFreeCredits,
          purchasedCredits: user.purchasedCredits,
          rewardedAdsRemaining: Math.max(0, MAX_REWARDED_ADS_PER_24_HOURS - rewardedAdCount - 1),
        },
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to claim rewarded ad credits." }, { status: 401 });
  }

  const isAdsEnabled = await getAdsEnabled();

  if (!isAdsEnabled) {
    return NextResponse.json({ error: "Rewarded ads are currently disabled." }, { status: 403 });
  }

  const windowStart = new Date(Date.now() - REWARDED_AD_WINDOW_MS);

  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      const result = await grantRewardedCredit(session.userId, windowStart);
      return NextResponse.json(result.payload, { status: result.status });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ error: "User was not found." }, { status: 404 });
      }

      const canRetry = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

      if (!canRetry || attempt === MAX_SERIALIZABLE_RETRIES) {
        throw error;
      }
    }
  }

  return NextResponse.json({ error: "Unable to claim rewarded ad credit right now." }, { status: 503 });
}
