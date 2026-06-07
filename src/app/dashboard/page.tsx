import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { checkAndResetCredits } from "@/lib/credits";
import { astrologers } from "@/lib/astrologers";
import { prisma } from "@/lib/prisma";
import { DashboardCreditBalance } from "./DashboardCreditBalance";

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
    <>
      <header className="cosmic-header">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.75rem] border border-amber-200/20 bg-white/10 text-3xl shadow-inner shadow-white/10">
              🔮
            </div>
            <div className="min-w-0 pt-1">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">MMAstrology</p>
              <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">
                Choose your cosmic guide
              </h1>
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-amber-200/20 bg-amber-200 text-sm font-black text-[#160b2f]">
            AI
          </div>
        </div>

        <p className="relative mt-5 line-clamp-2 text-sm leading-6 text-violet-100/80">
          Welcome back, {user.email}. Start a personalized consultation based on your birth profile.
        </p>
      </header>

      <section className="-mt-6 px-5 pb-6">
        <DashboardCreditBalance initialFreeCredits={credits.dailyFreeCredits} initialPurchasedCredits={credits.purchasedCredits} />

        <div className="mt-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-violet-100/65">Available now</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-100">Astrologers</h2>
          </div>
          <p className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-amber-100 shadow-sm">1 credit / msg</p>
        </div>

        <div className="mt-4 space-y-4">
          {astrologers.map((astrologer) => (
            <Link
              key={astrologer.name}
              href={`/chat/${encodeURIComponent(astrologer.name)}`}
              className="group grid grid-cols-[1fr_auto] items-center gap-3 rounded-[1.7rem] border border-white/15 bg-white/[0.08] p-3 shadow-xl shadow-violet-950/20 backdrop-blur transition hover:border-amber-200/40 hover:bg-white/[0.12] active:scale-[0.99]"
            >
              <article className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${astrologer.accent} text-2xl shadow-lg ${astrologer.glow}`}>
                    {astrologer.symbol}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-slate-50">{astrologer.name}</h3>
                    <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-violet-100/65">{astrologer.honorific}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-5 text-violet-100/65">{astrologer.tagline}</p>
              </article>
              <span className="rounded-full bg-amber-100/10 px-3 py-2 text-xs font-black text-amber-200 transition group-hover:bg-amber-200 group-hover:text-[#160b2f]">
                Chat
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
