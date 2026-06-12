"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RewardedAdButtonProps = {
  dailyFreeCredits: number;
};

type RewardResponse = {
  error?: string;
  freeCredits?: number;
  purchasedCredits?: number;
  rewardedAdsRemaining?: number;
};

const COUNTDOWN_SECONDS = 15;

export function RewardedAdButton({ dailyFreeCredits }: Readonly<RewardedAdButtonProps>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isClaiming, setIsClaiming] = useState(false);
  const isClaimingRef = useRef(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isOpen || isClaiming || countdown <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => setCountdown((currentCountdown) => currentCountdown - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [countdown, isClaiming, isOpen]);

  useEffect(() => {
    if (!isOpen || countdown !== 0 || isClaimingRef.current) {
      return;
    }

    let isMounted = true;

    async function claimReward() {
      isClaimingRef.current = true;
      setIsClaiming(true);
      setError("");

      try {
        const response = await fetch("/api/credits/reward", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const payload = (await response.json()) as RewardResponse;

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setError(payload.error ?? "Unable to claim this rewarded ad credit.");
          return;
        }

        const remainingText =
          typeof payload.rewardedAdsRemaining === "number"
            ? ` ${payload.rewardedAdsRemaining} rewarded ad claim${payload.rewardedAdsRemaining === 1 ? "" : "s"} left in this 24-hour window.`
            : "";
        setToast(`Success! 1 purchased credit was added.${remainingText}`);
        setIsOpen(false);
        router.refresh();
      } catch {
        if (isMounted) {
          setError("Network error while claiming this rewarded ad credit. Please try again.");
        }
      } finally {
        isClaimingRef.current = false;

        if (isMounted) {
          setIsClaiming(false);
        }
      }
    }

    claimReward();

    return () => {
      isMounted = false;
    };
  }, [countdown, isOpen, router]);

  if (dailyFreeCredits > 0) {
    return null;
  }

  function openRewardedAd() {
    setCountdown(COUNTDOWN_SECONDS);
    setError("");
    isClaimingRef.current = false;
    setIsClaiming(false);
    setIsOpen(true);
  }

  function closeCompletedAd() {
    if (isClaiming || countdown > 0) {
      return;
    }

    setIsOpen(false);
  }

  const progressPercentage = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;

  return (
    <>
      {toast ? (
        <div className="fixed left-1/2 top-5 z-50 w-[min(calc(100%-2rem),390px)] -translate-x-1/2 rounded-2xl border border-emerald-200/30 bg-emerald-300/15 px-4 py-3 text-sm font-bold text-emerald-50 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl" role="status">
          {toast}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openRewardedAd}
        disabled={isOpen}
        className="group relative w-full overflow-hidden rounded-[1.6rem] border border-amber-200/30 bg-gradient-to-r from-amber-200 via-fuchsia-300 to-violet-400 p-[1px] text-left shadow-2xl shadow-fuchsia-950/25 transition hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="flex items-center justify-between gap-3 rounded-[1.55rem] bg-[#160b2f]/88 px-4 py-4 text-white backdrop-blur">
          <span>
            <span className="block text-[0.7rem] font-black uppercase tracking-[0.24em] text-amber-200/80">Daily credits depleted</span>
            <span className="mt-1 block text-lg font-black text-white">Watch Ad for 1 Credit</span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-2xl shadow-lg shadow-amber-950/20 transition group-hover:rotate-3">
            ▶️
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#050314]/95 p-5 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="rewarded-ad-title">
          <div className="w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#120b2d] shadow-2xl shadow-black/50">
            <div className="relative aspect-video overflow-hidden bg-black">
              <video className="h-full w-full object-cover opacity-80" aria-label="Mock rewarded video advertisement" muted playsInline autoPlay loop>
                <track kind="captions" label="English" />
              </video>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(250,204,21,0.28),transparent_9rem),radial-gradient(circle_at_75%_80%,rgba(217,70,239,0.25),transparent_10rem)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <p className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.24em] text-amber-100 backdrop-blur">Sponsored message</p>
                <h2 id="rewarded-ad-title" className="mt-4 text-3xl font-black tracking-tight text-white">Mystic insights are loading</h2>
                <p className="mt-2 text-sm font-semibold text-violet-100/75">Stay until the timer finishes to earn 1 purchased credit.</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-100/60">Reward unlocks in</p>
                  <p className="mt-1 text-2xl font-black text-white">{isClaiming ? "Claiming…" : `${countdown}s`}</p>
                </div>
                <div className="rounded-2xl border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-center text-amber-100">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.18em]">Reward</p>
                  <p className="mt-1 text-lg font-black">+1 credit</p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-200 via-fuchsia-300 to-violet-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200/25 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100" role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={closeCompletedAd}
                disabled={countdown > 0 || isClaiming}
                className="w-full rounded-[1.25rem] border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-violet-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {countdown > 0 ? "Ad is unskippable during countdown" : isClaiming ? "Adding credit…" : "Close"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
