import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { astrologers, mergeAstrologerDisplayConfig } from "@/lib/astrologers";
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
        astrologicalProfile: {
          select: { id: true },
        },
      },
    }),
    checkAndResetCredits(session.userId),
    prisma.providerConfig.findMany({
      where: { isActive: true },
      select: { name: true, displayName: true, description: true },
    }),
    getAdsEnabled(),
  ]);

  if (!user || !credits) {
    redirect("/login");
  }

  if (!user.astrologicalProfile) {
    redirect("/onboarding");
  }

  const activeProviderConfigByName = new Map(activeProviderConfigs.map((provider) => [provider.name, provider]));
  const availableAstrologers = astrologers
    .map((astrologer) => {
      const providerConfig = activeProviderConfigByName.get(astrologer.providerName);
      return providerConfig ? mergeAstrologerDisplayConfig(providerConfig) : null;
    })
    .filter((astrologer): astrologer is NonNullable<typeof astrologer> => Boolean(astrologer));
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
