"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";

type Blueprint = {
  sunSign: string;
  glyph: string;
  element: string;
  dateOfBirth: string;
  birthTime: string;
  birthLocation: string;
  overview: string;
  dailyGuidance: string;
  alignmentAdvice: string;
};

function formatBirthDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
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
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBlueprint() {
      try {
        const response = await fetch("/api/astrology/blueprint");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load your automated reading.");
        }

        if (isMounted) {
          setBlueprint(payload.blueprint);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load your automated reading.");
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
  }, []);

  return (
    <>
      <header className="cosmic-header pb-14">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">Automated Readings</p>
          <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">Your cosmic blueprint</h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">
            A personalized static overview generated from your saved birth profile and classic Western sun-sign math.
          </p>
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
              <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-100/80">Reading unavailable</p>
              <h2 className="text-2xl font-black text-white">We could not open your blueprint.</h2>
              <p className="text-sm leading-6 text-violet-100/75">{error}</p>
              <Link href="/profile" className="inline-flex rounded-full bg-amber-200 px-4 py-3 text-sm font-black text-[#160b2f]">
                Review birth profile
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
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.42em] text-amber-100/75">Primary Sun Sign</p>
                  <div className="mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-full border border-amber-100/30 bg-amber-100/10 text-6xl text-amber-100 shadow-inner shadow-amber-50/10">
                    {blueprint.glyph}
                  </div>
                  <h2 className="mt-5 bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400 bg-clip-text text-5xl font-black leading-none tracking-tight text-transparent drop-shadow">
                    {blueprint.sunSign}
                  </h2>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.34em] text-violet-100/65">{blueprint.element} element</p>

                  <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-violet-100/55">Birth date</p>
                      <p className="mt-1 text-sm font-black text-white">{formatBirthDate(blueprint.dateOfBirth)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-violet-100/55">Birth time</p>
                      <p className="mt-1 text-sm font-black text-white">{blueprint.birthTime}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-violet-100/55">Location</p>
                      <p className="mt-1 line-clamp-2 text-sm font-black text-white">{blueprint.birthLocation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <ReadingPanel eyebrow="Core strengths" title={`${blueprint.element} expression`}>
                <p>{blueprint.overview}</p>
              </ReadingPanel>

              <ReadingPanel eyebrow="Daily influences" title="Cosmic weather">
                <p>{blueprint.dailyGuidance}</p>
              </ReadingPanel>

              <ReadingPanel eyebrow="Alignment advice" title="Use your birth context">
                <p>{blueprint.alignmentAdvice}</p>
              </ReadingPanel>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
