import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "./ChatInterface";

const chatProviders = {
  "Sayar Gyi": {
    title: "Traditional Master",
    subtitle: "Authoritative Vedic-style guidance",
    symbol: "☀️",
    gradient: "from-amber-300 via-orange-500 to-rose-700",
  },
  "Daw Nilar": {
    title: "Compassionate Guide",
    subtitle: "Gentle emotional insight",
    symbol: "🌙",
    gradient: "from-fuchsia-300 via-pink-500 to-purple-800",
  },
  "Min Thet": {
    title: "Modern Strategist",
    subtitle: "Practical next-step advice",
    symbol: "✨",
    gradient: "from-cyan-300 via-blue-500 to-indigo-800",
  },
  "Ko Tar Yar": {
    title: "Cosmic Truth-Teller",
    subtitle: "Witty and direct readings",
    symbol: "🪐",
    gradient: "from-emerald-300 via-teal-500 to-slate-900",
  },
} as const;

type ChatProviderName = keyof typeof chatProviders;

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

function isChatProviderName(value: string): value is ChatProviderName {
  return value in chatProviders;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const { providerName: providerNameParam } = await params;
  const providerName = safeDecodeProviderName(providerNameParam);

  if (!isChatProviderName(providerName)) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      astrologicalProfile: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.astrologicalProfile) {
    redirect("/onboarding");
  }

  const provider = chatProviders[providerName];

  return (
    <ChatInterface
      providerName={providerName}
      providerTitle={provider.title}
      providerSubtitle={provider.subtitle}
      providerSymbol={provider.symbol}
      providerGradient={provider.gradient}
    />
  );
}
