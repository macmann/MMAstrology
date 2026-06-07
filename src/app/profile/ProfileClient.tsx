"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AstrologicalProfile = {
  id: string;
  userId: string;
  dob: string;
  birthTime: string;
  birthLocation: string;
};

type CreditTransaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

type ProfilePayload = {
  user: {
    id: string;
    email: string;
    role: string;
    dailyFreeCredits: number;
    purchasedCredits: number;
    lastCreditReset: string;
    createdAt: string;
    updatedAt: string;
    astrologicalProfile: AstrologicalProfile | null;
    creditTransactions: CreditTransaction[];
  };
};

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function formatLedgerDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProfileClient() {
  const [profileData, setProfileData] = useState<ProfilePayload | null>(null);
  const [dob, setDob] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/user/profile", { cache: "no-store" });
      const payload = await response.json();

      if (!isMounted) {
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "Unable to load your profile.");
        setIsLoading(false);
        return;
      }

      const nextData = payload as ProfilePayload;
      setProfileData(nextData);
      setDob(toDateInputValue(nextData.user.astrologicalProfile?.dob));
      setBirthTime(nextData.user.astrologicalProfile?.birthTime ?? "");
      setBirthLocation(nextData.user.astrologicalProfile?.birthLocation ?? "");
      setIsLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const hasChanges = useMemo(() => {
    const currentProfile = profileData?.user.astrologicalProfile;

    return (
      dob !== toDateInputValue(currentProfile?.dob) ||
      birthTime !== (currentProfile?.birthTime ?? "") ||
      birthLocation !== (currentProfile?.birthLocation ?? "")
    );
  }, [birthLocation, birthTime, dob, profileData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setToast("");
    setIsSaving(true);

    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dob, birthTime, birthLocation }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Unable to update your profile.");
      setIsSaving(false);
      return;
    }

    setProfileData((current) =>
      current
        ? {
            user: {
              ...current.user,
              astrologicalProfile: payload.profile,
            },
          }
        : current,
    );
    setToast("Birth details updated successfully.");
    setIsSaving(false);
  }

  const user = profileData?.user;
  const ledger = user?.creditTransactions ?? [];

  return (
    <div className="relative min-h-full overflow-hidden pb-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.18),transparent_13rem),radial-gradient(circle_at_85%_24%,rgba(192,132,252,0.26),transparent_14rem),linear-gradient(180deg,rgba(42,20,92,0.98),rgba(15,10,41,0.98)_48%,rgba(8,18,48,0.98))]" />
      <div className="pointer-events-none absolute left-8 top-8 text-[0.65rem] tracking-[0.85rem] text-amber-100/35">✦ ✧ ✶ ✦ ✺</div>

      {toast ? (
        <div className="fixed left-1/2 top-5 z-50 w-[min(calc(100%-2rem),390px)] -translate-x-1/2 rounded-2xl border border-emerald-200/30 bg-emerald-300/15 px-4 py-3 text-sm font-bold text-emerald-50 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl">
          {toast}
        </div>
      ) : null}

      <div className="relative space-y-5 px-5 py-6">
        <header className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">Profile</p>
          <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">Your cosmic account</h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">
            Manage your birth profile and review every manual purchased-credit addition recorded on your account.
          </p>
        </header>

        {error ? <p className="rounded-2xl border border-rose-200/30 bg-rose-400/15 p-3 text-sm font-semibold text-rose-50">{error}</p> : null}

        <section className="cosmic-card space-y-4">
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-200 via-fuchsia-300 to-violet-500 text-3xl shadow-lg shadow-fuchsia-950/30">
              ☾
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/60">Registered email</p>
              <h2 className="truncate text-xl font-black text-amber-100">{isLoading ? "Loading..." : user?.email}</h2>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-100/55">Free</p>
              <p className="mt-2 text-3xl font-black text-white">{isLoading ? "—" : user?.dailyFreeCredits}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-100/55">Purchased</p>
              <p className="mt-2 text-3xl font-black text-white">{isLoading ? "—" : user?.purchasedCredits}</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="cosmic-form">
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-100/70">Birth details</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Astrological profile</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">Update your saved natal information anytime.</p>
          </div>

          <label className="relative block text-sm font-bold text-slate-300">
            Date of birth
            <input value={dob} onChange={(event) => setDob(event.target.value)} name="dob" type="date" required disabled={isLoading || isSaving} className="cosmic-input" />
          </label>

          <label className="relative block text-sm font-bold text-slate-300">
            Birth time
            <input value={birthTime} onChange={(event) => setBirthTime(event.target.value)} name="birthTime" type="time" required disabled={isLoading || isSaving} className="cosmic-input" />
          </label>

          <label className="relative block text-sm font-bold text-slate-300">
            Birth location
            <input
              value={birthLocation}
              onChange={(event) => setBirthLocation(event.target.value)}
              name="birthLocation"
              type="text"
              autoComplete="address-level2"
              placeholder="City, state or country"
              required
              disabled={isLoading || isSaving}
              className="cosmic-input"
            />
          </label>

          <button type="submit" disabled={isLoading || isSaving || !hasChanges} className="cosmic-button">
            {isSaving ? "Saving changes..." : hasChanges ? "Save birth details" : "Birth details are current"}
          </button>
        </form>

        <section className="cosmic-card h-[31rem]">
          <div className="relative mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-100/70">Transaction Ledger</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Credit additions</h2>
            </div>
            <span className="cosmic-chip">{ledger.length} logs</span>
          </div>

          <div className="absolute inset-x-5 bottom-5 top-28 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#07051a]/45 p-3 shadow-inner shadow-black/30">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-violet-100/65">Loading ledger...</div>
            ) : ledger.length ? (
              <ol className="space-y-3">
                {ledger.map((transaction) => (
                  <li key={transaction.id} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">+{transaction.amount} purchased credits</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/65">{formatLedgerDate(transaction.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">Added</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-violet-100/75">{transaction.reason}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold leading-6 text-violet-100/65">
                No purchased-credit additions have been recorded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
