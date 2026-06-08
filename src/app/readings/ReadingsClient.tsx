"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocalization, type TranslationKey } from "@/lib/localization";
import type { ZodiacElement, ZodiacSign } from "@/lib/astrology";

type Blueprint = {
  sunSign: ZodiacSign;
  glyph: string;
  element: ZodiacElement;
  dateOfBirth: string;
  birthTime: string;
  birthLocation: string;
  overview: string;
  dailyGuidance: string;
  alignmentAdvice: string;
};

const dailyGuidanceKeys = [
  "readings.daily.0",
  "readings.daily.1",
  "readings.daily.2",
  "readings.daily.3",
  "readings.daily.4",
  "readings.daily.5",
  "readings.daily.6",
] as const satisfies readonly TranslationKey[];

const signTranslationKeys = {
  Aries: "readings.sign.Aries",
  Taurus: "readings.sign.Taurus",
  Gemini: "readings.sign.Gemini",
  Cancer: "readings.sign.Cancer",
  Leo: "readings.sign.Leo",
  Virgo: "readings.sign.Virgo",
  Libra: "readings.sign.Libra",
  Scorpio: "readings.sign.Scorpio",
  Sagittarius: "readings.sign.Sagittarius",
  Capricorn: "readings.sign.Capricorn",
  Aquarius: "readings.sign.Aquarius",
  Pisces: "readings.sign.Pisces",
} as const satisfies Record<ZodiacSign, TranslationKey>;

const elementTranslationKeys = {
  Fire: "readings.element.Fire",
  Earth: "readings.element.Earth",
  Air: "readings.element.Air",
  Water: "readings.element.Water",
} as const satisfies Record<ZodiacElement, TranslationKey>;

const overviewTranslationKeys = {
  Fire: "readings.overview.Fire",
  Earth: "readings.overview.Earth",
  Air: "readings.overview.Air",
  Water: "readings.overview.Water",
} as const satisfies Record<ZodiacElement, TranslationKey>;

const alignmentTranslationKeys = {
  Fire: "readings.alignment.Fire",
  Earth: "readings.alignment.Earth",
  Air: "readings.alignment.Air",
  Water: "readings.alignment.Water",
} as const satisfies Record<ZodiacElement, TranslationKey>;

function formatBirthDate(value: string, language: "en" | "my") {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "my" ? "my-MM" : "en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function ReadingPanel({ eyebrow, title, children }: Readonly<{ eyebrow: string; title: string; children: ReactNode }>) {
  return (
    <article className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.075] p-5 shadow-xl shadow-violet-950/20 backdrop-blur">
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-amber-200/10 blur-2xl" />
      <div className="relative">
        <p className="text-[0.66rem] font-black uppercase tracking-[0.32em] text-amber-100/70">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-white">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-violet-50/80">{children}</div>
      </div>
    </article>
  );
}

export function ReadingsClient() {
  const { language, t } = useLocalization();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBlueprint() {
      setError("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/astrology/blueprint");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(t("readings.loadError"));
        }

        if (isMounted) {
          setBlueprint(payload.blueprint);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : t("readings.loadError"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBlueprint();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const dailyGuidanceKey = dailyGuidanceKeys[new Date().getUTCDay()];
  const translatedElement = blueprint ? t(elementTranslationKeys[blueprint.element]) : "";
  const translatedBirthTime = blueprint?.birthTime || t("readings.recordedBirthTime");
  const translatedBirthLocation = blueprint?.birthLocation || t("readings.recordedBirthplace");

  return (
    <>
      <header className="cosmic-header pb-14">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">{t("readings.eyebrow")}</p>
          <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">{t("readings.title")}</h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">{t("readings.subtitle")}</p>
        </div>
      </header>

      <main className="-mt-7 space-y-5 px-5 pb-7">
        {isLoading ? (
          <section className="cosmic-card min-h-72 animate-pulse">
            <div className="relative space-y-5">
              <div className="h-5 w-36 rounded-full bg-white/15" />
              <div className="h-28 rounded-[1.75rem] bg-white/10" />
              <div className="h-20 rounded-[1.5rem] bg-white/10" />
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="cosmic-card">
            <div className="relative space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-100/80">{t("readings.unavailable")}</p>
              <h2 className="text-2xl font-black text-white">{t("readings.openError")}</h2>
              <p className="text-sm leading-6 text-violet-100/75">{error}</p>
              <Link href="/profile" className="inline-flex rounded-full bg-amber-200 px-4 py-3 text-sm font-black text-[#160b2f]">
                {t("readings.reviewProfile")}
              </Link>
            </div>
          </section>
        ) : null}

        {blueprint ? (
          <>
            <section className="relative overflow-hidden rounded-[2.25rem] border border-amber-100/25 bg-[#09051f] p-[1px] shadow-2xl shadow-amber-950/20">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/35 via-fuchsia-300/15 to-sky-300/20" />
              <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-[#24124c] via-[#12092e] to-[#071b34] p-5">
                <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-5 top-5 text-[0.64rem] tracking-[0.78rem] text-amber-100/35">✦ ✧ ✶ ✦ ✺</div>

                <div className="relative pt-7 text-center">
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.42em] text-amber-100/75">{t("readings.primarySunSign")}</p>
                  <div className="mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-full border border-amber-100/30 bg-amber-100/10 text-6xl text-amber-100 shadow-inner shadow-amber-50/10">
                    {blueprint.glyph}
                  </div>
                  <h2 className="mt-5 bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400 bg-clip-text text-5xl font-black leading-none tracking-tight text-transparent drop-shadow">
                    {t(signTranslationKeys[blueprint.sunSign])}
                  </h2>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.34em] text-violet-100/65">
                    {t("readings.elementLabel", { element: translatedElement })}
                  </p>

                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-violet-100/55">{t("readings.birthDate")}</p>
                      <p className="mt-1 text-sm font-black text-white">{formatBirthDate(blueprint.dateOfBirth, language)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-violet-100/55">{t("readings.birthTime")}</p>
                      <p className="mt-1 text-sm font-black text-white">{blueprint.birthTime}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-violet-100/55">{t("readings.location")}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-black text-white">{blueprint.birthLocation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <ReadingPanel eyebrow={t("readings.coreStrengths")} title={t("readings.elementExpression", { element: translatedElement })}>
                <p>{t(overviewTranslationKeys[blueprint.element])}</p>
              </ReadingPanel>

              <ReadingPanel eyebrow={t("readings.dailyInfluences")} title={t("readings.cosmicWeather")}>
                <p>{t(dailyGuidanceKey)}</p>
              </ReadingPanel>

              <ReadingPanel eyebrow={t("readings.alignmentAdvice")} title={t("readings.useBirthContext")}>
                <p>
                  {t(alignmentTranslationKeys[blueprint.element], {
                    birthTime: translatedBirthTime,
                    birthLocation: translatedBirthLocation,
                  })}
                </p>
              </ReadingPanel>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
