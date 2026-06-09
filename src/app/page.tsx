"use client";

import Link from "next/link";
import { languageOptions, useLocalization } from "@/lib/localization";

export default function HomePage() {
  const { language, setLanguage, t } = useLocalization();

  return (
    <main className="cosmic-page">
      <div className="cosmic-shell flex flex-col">
        <header className="cosmic-header">
          <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />
          <div className="absolute -left-20 bottom-6 h-52 w-52 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <nav className="relative flex items-center justify-between gap-3">
            <Link href="/" className="text-lg font-black tracking-tight text-amber-100">
              Nat Khat AI
            </Link>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="home-language">
                {t("common.language")}
              </label>
              <select
                id="home-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value === "my" ? "my" : "en")}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
                aria-label={t("common.language")}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#160b2f] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <Link href="/login" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-white/20">
                {t("home.login")}
              </Link>
            </div>
          </nav>

          <section className="relative pt-12">
            <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.75rem] border border-amber-200/20 bg-white/10 text-3xl shadow-inner shadow-white/10">
              🔮
            </div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">{t("home.eyebrow")}</p>
            <h1 className="mt-4 text-[3rem] font-black leading-[0.95] tracking-tight text-white">
              {t("home.title")}
            </h1>
            <p className="mt-5 text-base leading-7 text-violet-100/80">
              {t("home.subtitle")}
            </p>
            <div className="mt-8 grid gap-3">
              <Link href="/register" className="rounded-[1.4rem] bg-gradient-to-r from-amber-200 via-fuchsia-300 to-violet-400 px-6 py-4 text-center font-black text-[#160b2f] shadow-xl shadow-fuchsia-950/30 transition hover:brightness-110">
                {t("home.startProfile")}
              </Link>
              <Link href="/login" className="rounded-[1.4rem] border border-white/15 bg-white/10 px-6 py-4 text-center font-black text-white backdrop-blur transition hover:bg-white/20">
                {t("home.haveAccount")}
              </Link>
            </div>
          </section>
        </header>

        <section className="-mt-6 flex-1 px-5 pb-8">
          <div className="cosmic-card">
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200/80">{t("home.insightEyebrow")}</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{t("home.insightTitle")}</h2>
              <p className="mt-3 text-sm leading-6 text-violet-100/70">
                {t("home.insightBody")}
              </p>
              <div className="mt-5 grid gap-3 text-sm font-bold text-violet-100/80">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">{t("home.freeCredits")}</div>
                <div className="rounded-2xl border border-fuchsia-200/20 bg-fuchsia-400/10 p-4 text-fuchsia-100">{t("home.purchasedCredits")}</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">{t("home.historyMetadata")}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
