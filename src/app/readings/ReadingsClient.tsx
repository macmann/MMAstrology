"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { useLocalization, type TranslationKey } from "@/lib/localization";
import type { ZodiacElement, ZodiacSign } from "@/lib/astrology";

type Blueprint = {
  sunSign: ZodiacSign;
  glyph: string;
  element: ZodiacElement;
  dateOfBirth: string;
  birthTime: string;
  birthLocation: string;
  overallReading: {
    en: string | null;
    my: string | null;
  };
  dailyReading: {
    en: string | null;
    my: string | null;
  };
  dailyReadingDate: string | null;
  lifeReadingGeneratedAt: string | null;
};

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

const dailyAspectDefinitions = [
  { key: "love", labelKey: "readings.aspectLove", icon: "💗", aliases: ["Love"] },
  { key: "business", labelKey: "readings.aspectBusiness", icon: "💼", aliases: ["Business", "Career", "Work"] },
  { key: "health", labelKey: "readings.aspectHealth", icon: "🌿", aliases: ["Health", "Wellness"] },
  { key: "dos", labelKey: "readings.aspectDos", icon: "✨", aliases: ["Dos", "Do"] },
  { key: "donts", labelKey: "readings.aspectDonts", icon: "🌘", aliases: ["Don'ts", "Donts", "Do not", "Don’ts"] },
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDailyAspectCards(reading: string) {
  const trimmedReading = reading.trim();

  if (!trimmedReading) {
    return dailyAspectDefinitions.map((definition) => ({ ...definition, body: "" }));
  }

  const aliasToKey = new Map<string, (typeof dailyAspectDefinitions)[number]["key"]>();
  for (const definition of dailyAspectDefinitions) {
    for (const alias of definition.aliases) {
      aliasToKey.set(alias.toLowerCase(), definition.key);
    }
  }

  const aliases = dailyAspectDefinitions.flatMap((definition) => definition.aliases).sort((a, b) => b.length - a.length);
  const labelPattern = new RegExp(`(?:^|[\\n.!?။])\\s*(${aliases.map(escapeRegExp).join("|")})\\s*(?:[:：—–-])`, "gi");
  const matches = [...trimmedReading.matchAll(labelPattern)].map((match) => ({
    key: aliasToKey.get(match[1].toLowerCase()),
    start: match.index ?? 0,
    contentStart: (match.index ?? 0) + match[0].length,
  }));

  const bodies = new Map<(typeof dailyAspectDefinitions)[number]["key"], string>();

  matches.forEach((match, index) => {
    if (!match.key) {
      return;
    }

    const nextMatch = matches[index + 1];
    const body = trimmedReading.slice(match.contentStart, nextMatch?.start).trim();

    if (body) {
      bodies.set(match.key, body);
    }
  });

  if (bodies.size < 2) {
    const fallbackPieces = trimmedReading
      .split(/(?:\n{2,}|(?<=[.!?။])\s+)/)
      .map((piece) => piece.trim())
      .filter(Boolean);

    return dailyAspectDefinitions.map((definition, index) => ({
      ...definition,
      body: fallbackPieces[index] || trimmedReading,
    }));
  }

  return dailyAspectDefinitions.map((definition) => ({
    ...definition,
    body: bodies.get(definition.key) || trimmedReading,
  }));
}

type ReadingView = "life" | "daily";

type ReadingsClientProps = {
  view?: ReadingView;
};

export function ReadingsClient({ view = "life" }: Readonly<ReadingsClientProps>) {
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

  const translatedElement = blueprint ? t(elementTranslationKeys[blueprint.element]) : "";
  const overallReading = blueprint?.overallReading[language] || blueprint?.overallReading.en || blueprint?.overallReading.my || "";
  const dailyReading = blueprint?.dailyReading[language] || blueprint?.dailyReading.en || blueprint?.dailyReading.my || "";
  const pageCopy =
    view === "daily"
      ? { eyebrow: t("readings.dailyEyebrow"), title: t("readings.dailyTitle"), subtitle: t("readings.dailySubtitle") }
      : { eyebrow: t("readings.lifeEyebrow"), title: t("readings.lifeTitle"), subtitle: t("readings.lifeSubtitle") };
  const dailyAspectCards = buildDailyAspectCards(dailyReading);

  return (
    <>
      <header className="cosmic-header pb-14">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">{pageCopy.eyebrow}</p>
          <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">{pageCopy.title}</h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">{pageCopy.subtitle}</p>
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
              <Link href="/profile/settings" className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#160b2f]">
                {t("readings.reviewProfile")}
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && !error && blueprint ? (
          <>
            {view === "life" ? (
              <section className="cosmic-card">
                <div className="relative flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-violet-100/60">{t("readings.primarySunSign")}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-amber-200 via-fuchsia-300 to-violet-500 text-5xl shadow-lg shadow-fuchsia-950/30">
                        {blueprint.glyph}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white">{t(signTranslationKeys[blueprint.sunSign])}</h2>
                        <p className="mt-1 text-sm font-bold text-amber-100/80">
                          {t("readings.elementLabel", { element: translatedElement })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-6 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-violet-100/50">{t("readings.birthDate")}</p>
                    <p className="mt-2 font-bold text-white">{formatBirthDate(blueprint.dateOfBirth, language)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-violet-100/50">{t("readings.birthTime")}</p>
                    <p className="mt-2 font-bold text-white">{blueprint.birthTime}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.24em] text-violet-100/50">{t("readings.location")}</p>
                    <p className="mt-2 font-bold text-white">{blueprint.birthLocation}</p>
                  </div>
                </div>
              </section>
            ) : null}

            {view === "life" ? (
              <ReadingPanel eyebrow={t("readings.lifeReading")} title={t("readings.yourReading")}>
                <p className="whitespace-pre-line">{overallReading}</p>
                {blueprint.lifeReadingGeneratedAt ? (
                  <p className="mt-4 text-xs font-bold text-violet-100/50">
                    {t("readings.savedOnce", {
                      date: new Intl.DateTimeFormat(language === "my" ? "my-MM" : "en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(blueprint.lifeReadingGeneratedAt)),
                    })}
                  </p>
                ) : null}
              </ReadingPanel>
            ) : null}

            {view === "daily" ? (
              <section className="space-y-4">
                <div className="rounded-[1.75rem] border border-amber-100/15 bg-amber-100/[0.08] p-5 shadow-xl shadow-violet-950/20 backdrop-blur">
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.32em] text-amber-100/70">{t("readings.todayEyebrow")}</p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-white">{t("readings.dailyReading")}</h2>
                  <p className="mt-3 text-sm font-bold leading-6 text-amber-100/85">{t("readings.todayLoveBusinessHealth")}</p>
                  {blueprint.dailyReadingDate ? (
                    <p className="mt-3 text-xs font-bold text-violet-100/50">
                      {t("readings.generatedToday", {
                        date: new Intl.DateTimeFormat(language === "my" ? "my-MM" : "en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(blueprint.dailyReadingDate)),
                      })}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {dailyAspectCards.map((aspect) => (
                    <article
                      key={aspect.key}
                      className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.075] p-5 shadow-xl shadow-violet-950/20 backdrop-blur"
                    >
                      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-fuchsia-300/10 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl shadow-inner shadow-white/10">
                            {aspect.icon}
                          </span>
                          <h3 className="text-lg font-black text-white">{t(aspect.labelKey)}</h3>
                        </div>
                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-violet-50/80">{aspect.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        <AdBanner className="mb-3" />
      </main>
    </>
  );
}
