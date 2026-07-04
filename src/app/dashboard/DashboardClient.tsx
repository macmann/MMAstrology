"use client";

import Link from "next/link";
import type { AstrologerProfile } from "@/lib/astrologers";
import { DashboardCreditBalance } from "@/app/dashboard/DashboardCreditBalance";
import { RewardedAdButton } from "@/components/RewardedAdButton";
import { useLocalization } from "@/lib/localization";

type DashboardClientProps = {
  availableAstrologers: AstrologerProfile[];
  displayName: string;
  profileInitials: string;
  initialFreeCredits: number;
  initialPurchasedCredits: number;
  dailyFreeCreditAllowance: number;
  isAdsEnabled: boolean;
};

export function DashboardClient({
  availableAstrologers,
  displayName,
  profileInitials,
  initialFreeCredits,
  initialPurchasedCredits,
  dailyFreeCreditAllowance,
  isAdsEnabled,
}: Readonly<DashboardClientProps>) {
  const { t } = useLocalization();

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
              <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">NatKhat AI</p>
              <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">
                {t("dashboard.title")}
              </h1>
            </div>
          </div>
          <Link
            href="/profile/settings"
            aria-label={t("dashboard.openProfile")}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-amber-200/20 bg-amber-200 text-sm font-black text-[#160b2f] shadow-lg shadow-amber-950/20 transition hover:scale-105 hover:bg-amber-100 active:scale-95"
          >
            {profileInitials}
          </Link>
        </div>

        <p className="relative mt-5 line-clamp-2 text-sm leading-6 text-violet-100/80">
          {t("dashboard.welcome", { name: displayName })}
        </p>
      </header>

      <section className="-mt-6 space-y-3 px-5 pb-2">
        <DashboardCreditBalance
          key={`${initialFreeCredits}-${initialPurchasedCredits}`}
          initialFreeCredits={initialFreeCredits}
          initialPurchasedCredits={initialPurchasedCredits}
          dailyFreeCreditAllowance={dailyFreeCreditAllowance}
        />
        <RewardedAdButton dailyFreeCredits={initialFreeCredits} isAdsEnabled={isAdsEnabled} />
      </section>

      <section className="px-5 pb-6 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-violet-100/65">{t("dashboard.available")}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-100">{t("dashboard.astrologers")}</h2>
          </div>
          <p className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-amber-100 shadow-sm">{t("dashboard.creditPerMessage")}</p>
        </div>

        <div className="mt-4 space-y-4">
          {availableAstrologers.length === 0 ? (
            <div className="rounded-[1.7rem] border border-white/15 bg-white/[0.08] p-5 text-sm leading-6 text-violet-100/70">
              {t("dashboard.none")}
            </div>
          ) : null}
          {availableAstrologers.map((astrologer) => (
            <Link
              key={astrologer.providerName}
              href={`/chat/${encodeURIComponent(astrologer.providerName)}`}
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
                {t("dashboard.chat")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
