"use client";

import Link from "next/link";
import { languageOptions, useLocalization } from "@/lib/localization";

export default function HomePage() {
  const { language, setLanguage, t } = useLocalization();

  return (
    <main className="cosmic-page cosmic-home-page">
      <div className="cosmic-shell cosmic-home-shell flex flex-col">
        <header className="cosmic-header cosmic-home-header">
          <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute -left-20 bottom-6 h-52 w-52 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <nav className="relative flex items-center justify-between gap-2">
            <Link href="/" className="shrink-0 text-base font-black tracking-tight text-amber-100 sm:text-lg">
              NatKhat AI
            </Link>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="home-language">
                {t("common.language")}
              </label>
              <select
                id="home-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value === "my" ? "my" : "en")}
                className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-black text-white backdrop-blur transition hover:bg-white/20 sm:px-3 sm:py-2 sm:text-sm"
                aria-label={t("common.language")}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#160b2f] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <Link href="/login" className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-white backdrop-blur transition hover:bg-white/20 sm:px-4 sm:py-2 sm:text-sm">
                {t("home.login")}
              </Link>
            </div>
          </nav>

          <section className="relative pt-7 sm:pt-12">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-amber-200/20 bg-white/10 text-2xl shadow-inner shadow-white/10 sm:mb-5 sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-[1.75rem] sm:text-3xl">
              🔮
            </div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.28em] text-amber-200 sm:text-[0.7rem] sm:tracking-[0.42em]">{t("home.eyebrow")}</p>
            <h1 className="mt-3 text-[clamp(2.15rem,11vw,3rem)] font-black leading-[0.95] tracking-tight text-white sm:mt-4">
              {t("home.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-violet-100/80 sm:mt-5 sm:text-base sm:leading-7">
              {t("home.subtitle")}
            </p>
            <div className="mt-5 grid gap-2.5 sm:mt-8 sm:gap-3">
              <Link href="/register" className="rounded-[1.2rem] bg-gradient-to-r from-amber-200 via-fuchsia-300 to-violet-400 px-5 py-3 text-center text-sm font-black text-[#160b2f] shadow-xl shadow-fuchsia-950/30 transition hover:brightness-110 sm:rounded-[1.4rem] sm:px-6 sm:py-4 sm:text-base">
                {t("home.startProfile")}
              </Link>
              <Link href="/login" className="rounded-[1.2rem] border border-white/15 bg-white/10 px-5 py-3 text-center text-sm font-black text-white backdrop-blur transition hover:bg-white/20 sm:rounded-[1.4rem] sm:px-6 sm:py-4 sm:text-base">
                {t("home.haveAccount")}
              </Link>
            </div>
          </section>
        </header>

        <section className="-mt-4 flex-1 px-4 pb-5 sm:-mt-6 sm:px-5 sm:pb-8">
          <div className="cosmic-card">
            <div className="relative">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-amber-200/80 sm:text-xs sm:tracking-[0.28em]">{t("home.insightEyebrow")}</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:mt-3 sm:text-2xl">{t("home.insightTitle")}</h2>
              <p className="mt-2 text-sm leading-5 text-violet-100/70 sm:mt-3 sm:leading-6">
                {t("home.insightBody")}
              </p>
              <div className="mt-4 grid gap-2 text-sm font-bold text-violet-100/80 sm:mt-5 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4">{t("home.freeCredits")}</div>
                <div className="rounded-2xl border border-fuchsia-200/20 bg-fuchsia-400/10 p-3 text-fuchsia-100 sm:p-4">{t("home.purchasedCredits")}</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 sm:p-4">{t("home.historyMetadata")}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
