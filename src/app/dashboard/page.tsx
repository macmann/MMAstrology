import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { mergeAstrologerDisplayConfig } from "@/lib/astrologers";
import { checkAndResetCredits } from "@/lib/credits";
import { getAdsEnabled } from "@/lib/ad-settings";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const [user, credits, activeProviderConfigs, isAdsEnabled] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        email: true,
        name: true,
        isPro: true,
        astrologicalProfile: {
          select: { id: true },
        },
      },
    }),
    checkAndResetCredits(session.userId),
    prisma.providerConfig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { name: true, displayName: true, description: true, isProProvider: true },
    }),
    getAdsEnabled(),
  ]);

  if (!user || !credits) {
    redirect("/login");
  }

  if (!user.astrologicalProfile) {
    redirect("/onboarding");
  }

  const availableAstrologers = activeProviderConfigs.map((provider) =>
    mergeAstrologerDisplayConfig(provider, provider.isProProvider && !user.isPro),
  );
  const displayName = user.name?.trim() || user.email;
  const profileInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <DashboardClient
      availableAstrologers={[...availableAstrologers]}
      displayName={displayName}
      profileInitials={profileInitials}
      initialFreeCredits={credits.dailyFreeCredits}
      initialPurchasedCredits={credits.purchasedCredits}
      dailyFreeCreditAllowance={credits.dailyFreeCreditAllowance}
      isAdsEnabled={isAdsEnabled}
    />
  );
}
