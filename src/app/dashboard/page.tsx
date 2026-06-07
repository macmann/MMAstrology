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
    tagline: "Ancient Myanmar wisdom delivered with calm authority and precise timing.",
    accent: "from-amber-300 via-orange-500 to-rose-700",
    glow: "shadow-orange-950/40",
    symbol: "☀️",
  },
  {
    name: "Daw Nilar",
    honorific: "Compassionate Guide",
    tagline: "Gentle, emotionally aware readings for love, healing, and self-trust.",
    accent: "from-fuchsia-300 via-pink-500 to-purple-800",
    glow: "shadow-fuchsia-950/40",
    symbol: "🌙",
  },
  {
    name: "Min Thet",
    honorific: "Modern Strategist",
    tagline: "Practical star-powered advice for decisions, work, and next steps.",
    accent: "from-cyan-300 via-blue-500 to-indigo-800",
    glow: "shadow-blue-950/40",
    symbol: "✨",
  },
  {
    name: "Ko Tar Yar",
    honorific: "Cosmic Truth-Teller",
    tagline: "Witty, direct insights that cut through confusion without losing heart.",
    accent: "from-emerald-300 via-teal-500 to-slate-900",
    glow: "shadow-emerald-950/40",
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
    <main className="min-h-screen overflow-hidden bg-[#050314] px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.35)_0,transparent_34%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.22)_0,transparent_28%),radial-gradient(circle_at_bottom,rgba(244,114,182,0.18)_0,transparent_34%)]" />

      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-200">MMAstrology Dashboard</p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Choose your astrologer
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Welcome back, {user.email}. Select a cosmic advisor below and start a personalized consultation based on your astrological profile.
              </p>
            </div>

            <DashboardCreditBalance initialFreeCredits={credits.dailyFreeCredits} initialPurchasedCredits={credits.purchasedCredits} />
          </div>
        </header>

        <section aria-labelledby="astrologer-grid-heading" className="pb-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Available consultations</p>
              <h2 id="astrologer-grid-heading" className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Four paths through the stars
              </h2>
            </div>
            <p className="text-sm text-slate-400">1 credit per message</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {astrologers.map((astrologer) => (
              <Link
                key={astrologer.name}
                href={`/chat/${encodeURIComponent(astrologer.name)}`}
                className={`group relative flex min-h-[25rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl ${astrologer.glow} transition duration-300 hover:-translate-y-1 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:ring-offset-2 focus:ring-offset-[#050314]`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${astrologer.accent} opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-95`} />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                <div className="absolute right-5 top-5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
                  Online
                </div>

                <article className="relative z-10 flex h-full w-full flex-col justify-between">
                  <div>
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/25 bg-white/20 text-3xl shadow-lg backdrop-blur">
                      {astrologer.symbol}
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">{astrologer.honorific}</p>
                    <h3 className="mt-3 text-3xl font-black tracking-tight text-white">{astrologer.name}</h3>
                  </div>

                  <div>
                    <p className="mb-6 text-base leading-7 text-slate-100/90">{astrologer.tagline}</p>
                    <span className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-slate-950/20 transition group-hover:bg-violet-100">
                      Consult Now
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
