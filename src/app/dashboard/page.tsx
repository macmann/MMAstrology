import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { checkAndResetCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { DashboardCreditBalance } from "./DashboardCreditBalance";

const astrologers = [
  {
    name: "Sayar Gyi",
    honorific: "Traditional Master",
    tagline: "Ancient Myanmar wisdom with clear timing and grounded answers.",
    accent: "from-amber-300 via-orange-500 to-rose-700",
    glow: "shadow-orange-950/30",
    symbol: "☀️",
  },
  {
    name: "Daw Nilar",
    honorific: "Compassionate Guide",
    tagline: "Gentle readings for love, healing, and emotional clarity.",
    accent: "from-fuchsia-300 via-pink-500 to-purple-800",
    glow: "shadow-fuchsia-950/30",
    symbol: "🌙",
  },
  {
    name: "Min Thet",
    honorific: "Modern Strategist",
    tagline: "Practical star-powered advice for decisions and next steps.",
    accent: "from-cyan-300 via-blue-500 to-indigo-800",
    glow: "shadow-blue-950/30",
    symbol: "✨",
  },
  {
    name: "Ko Tar Yar",
    honorific: "Cosmic Truth-Teller",
    tagline: "Witty, direct insights that cut through confusion with heart.",
    accent: "from-emerald-300 via-teal-500 to-slate-900",
    glow: "shadow-emerald-950/30",
    symbol: "🪐",
  },
] as const;

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const [credits, user] = await Promise.all([
    checkAndResetCredits(session.userId),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        email: true,
        astrologicalProfile: {
          select: { id: true },
        },
      },
    }),
  ]);

  if (!user || !credits) {
    redirect("/login");
  }

  if (!user.astrologicalProfile) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-slate-200 text-slate-950 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] overflow-hidden bg-[#eef3f8] shadow-2xl shadow-slate-400/40 sm:min-h-[calc(100vh-3rem)] sm:rounded-[2.25rem]">
        <header className="relative overflow-hidden bg-[#0b1f3f] px-6 pb-10 pt-7 text-white">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/10 text-3xl shadow-inner shadow-white/10">
                🔮
              </div>
              <div className="min-w-0 pt-1">
                <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-emerald-300">MMAstrology</p>
                <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">
                  Choose your cosmic guide
                </h1>
              </div>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-[#19375f] bg-emerald-300 text-sm font-black text-[#0b1f3f]">
              AI
            </div>
          </div>

          <p className="relative mt-5 line-clamp-2 text-sm leading-6 text-slate-300">
            Welcome back, {user.email}. Start a personalized consultation based on your birth profile.
          </p>
        </header>

        <section className="-mt-6 px-5 pb-28">
          <DashboardCreditBalance initialFreeCredits={credits.dailyFreeCredits} initialPurchasedCredits={credits.purchasedCredits} />

          <div className="mt-7 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-slate-500">Available now</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0b1f3f]">Astrologers</h2>
            </div>
            <p className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm">1 credit / msg</p>
          </div>

          <div className="mt-4 space-y-4">
            {astrologers.map((astrologer, index) => (
              <Link
                key={astrologer.name}
                href={`/chat/${encodeURIComponent(astrologer.name)}`}
                className="group grid grid-cols-[2.9rem_1fr_auto] items-center gap-3 rounded-[1.7rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-300/40 transition active:scale-[0.99]"
              >
                <div className="text-center text-lg font-black text-[#0b1f3f]">{index + 1}</div>
                <article className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${astrologer.accent} text-2xl shadow-lg ${astrologer.glow}`}>
                      {astrologer.symbol}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-slate-950">{astrologer.name}</h3>
                      <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{astrologer.honorific}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">{astrologer.tagline}</p>
                </article>
                <span className="rounded-full bg-[#e7fff4] px-3 py-2 text-xs font-black text-emerald-700 transition group-hover:bg-emerald-300 group-hover:text-[#0b1f3f]">
                  Chat
                </span>
              </Link>
            ))}
          </div>
        </section>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] px-4 pb-4">
          <div className="grid grid-cols-4 rounded-[2rem] border border-slate-200 bg-white/95 p-2 text-center text-[0.68rem] font-black text-slate-500 shadow-2xl shadow-slate-400/50 backdrop-blur">
            <Link href="/dashboard" className="rounded-[1.5rem] bg-emerald-100 px-2 py-2 text-emerald-800">
              <span className="block text-xl">⌂</span>
              Home
            </Link>
            <span className="px-2 py-2">
              <span className="block text-xl">☾</span>
              Readings
            </span>
            <span className="px-2 py-2">
              <span className="block text-xl">✦</span>
              Profile
            </span>
            <span className="px-2 py-2">
              <span className="block text-xl">↺</span>
              History
            </span>
          </div>
        </nav>
      </div>
    </main>
  );
}
