"use client";

import { useEffect, useState } from "react";

type CreditBalance = {
  freeCredits: number;
  purchasedCredits: number;
};

type DashboardCreditBalanceProps = {
  initialFreeCredits: number;
  initialPurchasedCredits: number;
};

const FREE_CREDIT_ALLOWANCE = 4;

export function DashboardCreditBalance({ initialFreeCredits, initialPurchasedCredits }: DashboardCreditBalanceProps) {
  const [credits, setCredits] = useState<CreditBalance>({
    freeCredits: initialFreeCredits,
    purchasedCredits: initialPurchasedCredits,
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

        if (isMounted && typeof data.freeCredits === "number" && typeof data.purchasedCredits === "number") {
          setCredits({
            freeCredits: data.freeCredits,
            purchasedCredits: data.purchasedCredits,
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
    <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-slate-300/60">
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-200/70 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Credit balance</p>
          <p className="mt-2 text-4xl font-black leading-none tracking-tight text-[#0b1f3f]">{totalCredits}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            {isRefreshing ? "Refreshing balance…" : "Ready for this session."}
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-[#0b1f3f] p-3 text-center text-white">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-emerald-300">Daily</p>
          <p className="mt-1 text-lg font-black">
            {credits.freeCredits}/{FREE_CREDIT_ALLOWANCE}
          </p>
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3 text-sm font-bold">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
          <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Free</span>
          {credits.freeCredits} credits
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
          <span className="block text-xs uppercase tracking-[0.16em] text-emerald-500">Purchased</span>
          {credits.purchasedCredits} credits
        </div>
      </div>
    </div>
  );
}
