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

  return (
    <div className="rounded-3xl border border-violet-200/20 bg-slate-950/80 p-5 text-left shadow-2xl shadow-slate-950/30 backdrop-blur sm:min-w-80">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">Credit balance</p>
      <p className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
        Free Credits: {credits.freeCredits}/{FREE_CREDIT_ALLOWANCE} | Purchased Credits: {credits.purchasedCredits}
      </p>
      <p className="mt-2 text-sm text-slate-400">{isRefreshing ? "Refreshing your balance…" : "Balance updated for this session."}</p>
    </div>
  );
}
