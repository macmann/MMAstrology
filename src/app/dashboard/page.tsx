import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { astrologers } from "@/lib/astrologers";
import { checkAndResetCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const [user, credits, activeProviderConfigs] = await Promise.all([
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
      select: { name: true },
    }),
  ]);

  if (!user || !credits) {
    redirect("/login");
  }

  if (!user.astrologicalProfile) {
    redirect("/onboarding");
  }

  const activeProviderNames = new Set(activeProviderConfigs.map((provider) => provider.name));
  const availableAstrologers = astrologers.filter((astrologer) => activeProviderNames.has(astrologer.name));
  const displayName = user.name?.trim() || user.email;
  const profileInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <DashboardClient
      availableAstrologers={[...availableAstrologers]}
      displayName={displayName}
      profileInitials={profileInitials}
      initialFreeCredits={credits.dailyFreeCredits}
      initialPurchasedCredits={credits.purchasedCredits}
    />
  );
}
