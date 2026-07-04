import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { mergeAstrologerDisplayConfig } from "@/lib/astrologers";
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "./ChatInterface";

type ChatPageProps = {
  params: Promise<{
    providerName: string;
  }>;
};

function safeDecodeProviderName(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const { providerName: providerNameParam } = await params;
  const providerName = safeDecodeProviderName(providerNameParam);

  const [user, providerConfig] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        isPro: true,
        astrologicalProfile: {
          select: { id: true },
        },
      },
    }),
    prisma.providerConfig.findUnique({
      where: { name: providerName },
      select: {
        name: true,
        isActive: true,
        isProProvider: true,
        displayName: true,
        description: true,
      },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (!user.astrologicalProfile) {
    redirect("/onboarding");
  }

  if (!providerConfig?.isActive) {
    notFound();
  }

  if (providerConfig.isProProvider && !user.isPro) {
    redirect("/dashboard");
  }

  const provider = mergeAstrologerDisplayConfig(providerConfig);

  return (
    <ChatInterface
      providerName={providerName}
      providerDisplayName={provider.name}
      providerTitle={provider.honorific}
      providerSubtitle={provider.tagline}
      providerSymbol={provider.symbol}
      providerGradient={provider.accent}
    />
  );
}
