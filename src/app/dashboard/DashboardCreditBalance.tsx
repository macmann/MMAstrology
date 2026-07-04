"use client";

import { useEffect, useState } from "react";

type CreditBalance = {
  freeCredits: number;
  purchasedCredits: number;
  dailyFreeCreditAllowance: number;
};

type DashboardCreditBalanceProps = {
  initialFreeCredits: number;
  initialPurchasedCredits: number;
  dailyFreeCreditAllowance: number;
};


export function DashboardCreditBalance({
  initialFreeCredits,
  initialPurchasedCredits,
  dailyFreeCreditAllowance,
}: DashboardCreditBalanceProps) {
  const [credits, setCredits] = useState<CreditBalance>({
    freeCredits: initialFreeCredits,
    purchasedCredits: initialPurchasedCredits,
    dailyFreeCreditAllowance,
  });
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function refreshCredits() {
      try {
        const response = await fetch("/api/credits", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Partial<CreditBalance>;

        if (isMounted && typeof data.freeCredits === "number" &&
          typeof data.purchasedCredits === "number" &&
          typeof data.dailyFreeCreditAllowance === "number") {
          setCredits({
            freeCredits: data.freeCredits,
            purchasedCredits: data.purchasedCredits,
            dailyFreeCreditAllowance: data.dailyFreeCreditAllowance,
          });
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }

    refreshCredits();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCredits = credits.freeCredits + credits.purchasedCredits;

  return (
    <div className="cosmic-card">
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-200/25 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200/80">Credit balance</p>
          <p className="mt-2 text-4xl font-black leading-none tracking-tight text-white">{totalCredits}</p>
          <p className="mt-2 text-xs font-semibold text-violet-100/60">
            {isRefreshing ? "Refreshing balance…" : "Ready for this session."}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-amber-200/20 bg-amber-100/10 p-3 text-center text-white">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-amber-200">Daily</p>
          <p className="mt-1 text-lg font-black">
            {credits.freeCredits}/{credits.dailyFreeCreditAllowance}
          </p>
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3 text-sm font-bold">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-violet-100/80">
          <span className="block text-xs uppercase tracking-[0.16em] text-violet-100/50">Free</span>
          {credits.freeCredits} credits
        </div>
        <div className="rounded-2xl border border-fuchsia-200/20 bg-fuchsia-400/10 p-3 text-fuchsia-100">
          <span className="block text-xs uppercase tracking-[0.16em] text-fuchsia-200/70">Purchased</span>
          {credits.purchasedCredits} credits
        </div>
      </div>
    </div>
  );
}
