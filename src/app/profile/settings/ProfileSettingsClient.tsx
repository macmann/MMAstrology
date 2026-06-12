"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdBanner } from "@/components/AdBanner";
import { LogoutButton } from "@/components/LogoutButton";
import { languageOptions, useLocalization, type Language } from "@/lib/localization";

type ProfileTab = "account" | "credits";

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
    name: string | null;
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

const FREE_CREDIT_ALLOWANCE = 4;

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

export function ProfileSettingsClient() {
  const { language, setLanguage, t } = useLocalization();
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [profileData, setProfileData] = useState<ProfilePayload | null>(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
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
      setName(nextData.user.name ?? "");
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

  const accountHasChanges = useMemo(() => {
    const currentProfile = profileData?.user.astrologicalProfile;

    return (
      name !== (profileData?.user.name ?? "") ||
      dob !== toDateInputValue(currentProfile?.dob) ||
      birthTime !== (currentProfile?.birthTime ?? "") ||
      birthLocation !== (currentProfile?.birthLocation ?? "")
    );
  }, [birthLocation, birthTime, dob, name, profileData]);

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setToast("");
    setIsSavingAccount(true);

    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, dob, birthTime, birthLocation }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Unable to update your profile.");
      setIsSavingAccount(false);
      return;
    }

    setProfileData((current) =>
      current
        ? {
            user: {
              ...current.user,
              name: payload.user.name,
              updatedAt: payload.user.updatedAt,
              astrologicalProfile: payload.profile,
            },
          }
        : current,
    );
    setName(payload.user.name ?? "");
    setToast(t("profile.updated"));
    setIsSavingAccount(false);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setToast("");

    if (newPassword !== confirmPassword) {
      setError(t("profile.passwordMismatch"));
      return;
    }

    setIsSavingPassword(true);
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Unable to update your password.");
      setIsSavingPassword(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setToast(t("profile.passwordUpdated"));
    setIsSavingPassword(false);
  }

  const user = profileData?.user;
  const ledger = user?.creditTransactions ?? [];
  const totalCredits = (user?.dailyFreeCredits ?? 0) + (user?.purchasedCredits ?? 0);
  const displayName = user?.name?.trim() || user?.email || "Your profile";

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
    const selectedLanguage = languageOptions.find((option) => option.value === nextLanguage)?.label ?? nextLanguage;
    setToast(t("profile.languageSaved", { language: selectedLanguage }));
  }

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
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">{t("profile.eyebrow")}</p>
              <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">{t("profile.title")}</h1>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-amber-200/20 bg-amber-200 text-sm font-black text-[#160b2f]">
              {isLoading ? "…" : displayName.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">
            {t("profile.subtitle")}
          </p>
        </header>

        {error ? <p className="rounded-2xl border border-rose-200/30 bg-rose-400/15 p-3 text-sm font-semibold text-rose-50">{error}</p> : null}

        <div className="grid grid-cols-2 gap-2 rounded-[1.6rem] border border-white/10 bg-[#07051a]/45 p-2 shadow-inner shadow-black/20">
          {(["account", "credits"] as ProfileTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-[1.15rem] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition ${
                activeTab === tab ? "bg-amber-200 text-[#160b2f] shadow-lg shadow-amber-950/20" : "text-violet-100/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab === "account" ? t("profile.account") : t("profile.credits")}
            </button>
          ))}
        </div>

        {activeTab === "account" ? (
          <div className="space-y-5">
            <section className="cosmic-card space-y-4">
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-200 via-fuchsia-300 to-violet-500 text-3xl font-black text-[#160b2f] shadow-lg shadow-fuchsia-950/30">
                    {isLoading ? "…" : displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/60">{t("profile.signedInAs")}</p>
                    <h2 className="truncate text-xl font-black text-amber-100">{isLoading ? t("common.loading") : displayName}</h2>
                    <p className="mt-1 truncate text-sm font-semibold text-violet-100/60">{user?.email}</p>
                  </div>
                </div>
                <LogoutButton
                  label={t("profile.logout")}
                  pendingLabel={t("profile.loggingOut")}
                  className="relative w-full rounded-full border border-rose-200/30 bg-rose-400/15 px-5 py-3 text-sm font-black text-rose-50 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                />
              </div>
            </section>

            <section className="cosmic-card space-y-4">
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-100/70">{t("profile.languageEyebrow")}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("profile.languageTitle")}</h2>
                <p className="mt-2 text-sm leading-6 text-violet-100/70">{t("profile.languageDescription")}</p>
              </div>
              <div className="relative grid grid-cols-2 gap-2 rounded-[1.35rem] border border-white/10 bg-[#07051a]/45 p-2">
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleLanguageChange(option.value)}
                    aria-pressed={language === option.value}
                    className={`rounded-[1rem] px-4 py-3 text-sm font-black transition ${
                      language === option.value ? "bg-amber-200 text-[#160b2f] shadow-lg shadow-amber-950/20" : "text-violet-100/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <form onSubmit={handleAccountSubmit} className="cosmic-form">
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-100/70">{t("profile.accountDetails")}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("profile.nameBirthTitle")}</h2>
                <p className="mt-2 text-sm leading-6 text-violet-100/70">{t("profile.accountDescription")}</p>
              </div>

              <label className="relative block text-sm font-bold text-slate-300">
                {t("profile.name")}
                <input value={name} onChange={(event) => setName(event.target.value)} name="name" type="text" autoComplete="name" placeholder={t("profile.namePlaceholder")} disabled={isLoading || isSavingAccount} className="cosmic-input" />
              </label>

              <label className="relative block text-sm font-bold text-slate-300">
                {t("profile.dob")}
                <input value={dob} onChange={(event) => setDob(event.target.value)} name="dob" type="date" required disabled={isLoading || isSavingAccount} className="cosmic-input" />
              </label>

              <label className="relative block text-sm font-bold text-slate-300">
                {t("profile.birthTime")}
                <input value={birthTime} onChange={(event) => setBirthTime(event.target.value)} name="birthTime" type="time" required disabled={isLoading || isSavingAccount} className="cosmic-input" />
              </label>

              <label className="relative block text-sm font-bold text-slate-300">
                {t("profile.birthLocation")}
                <input
                  value={birthLocation}
                  onChange={(event) => setBirthLocation(event.target.value)}
                  name="birthLocation"
                  type="text"
                  autoComplete="address-level2"
                  placeholder={t("profile.birthLocationPlaceholder")}
                  required
                  disabled={isLoading || isSavingAccount}
                  className="cosmic-input"
                />
              </label>

              <button type="submit" disabled={isLoading || isSavingAccount || !accountHasChanges} className="cosmic-button">
                {isSavingAccount ? t("profile.savingChanges") : accountHasChanges ? t("profile.saveProfile") : t("profile.current")}
              </button>
            </form>

            <form onSubmit={handlePasswordSubmit} className="cosmic-form">
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-100/70">{t("profile.security")}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("profile.changePassword")}</h2>
                <p className="mt-2 text-sm leading-6 text-violet-100/70">{t("profile.changePasswordDescription")}</p>
              </div>

              <label className="relative block text-sm font-bold text-slate-300">
                {t("profile.currentPassword")}
                <input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} name="currentPassword" type="password" autoComplete="current-password" required disabled={isSavingPassword} className="cosmic-input" />
              </label>

              <label className="relative block text-sm font-bold text-slate-300">
                {t("profile.newPassword")}
                <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} name="newPassword" type="password" autoComplete="new-password" minLength={8} required disabled={isSavingPassword} className="cosmic-input" />
              </label>

              <label className="relative block text-sm font-bold text-slate-300">
                {t("profile.confirmPassword")}
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required disabled={isSavingPassword} className="cosmic-input" />
              </label>

              <button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword} className="cosmic-button">
                {isSavingPassword ? t("profile.updatingPassword") : t("profile.updatePassword")}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="cosmic-card">
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-200/25 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200/80">{t("profile.creditBalance")}</p>
                  <p className="mt-2 text-4xl font-black leading-none tracking-tight text-white">{isLoading ? "—" : totalCredits}</p>
                  <p className="mt-2 text-xs font-semibold text-violet-100/60">{t("profile.ready")}</p>
                </div>
                <div className="rounded-[1.4rem] border border-amber-200/20 bg-amber-100/10 p-3 text-center text-white">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-amber-200">{t("profile.daily")}</p>
                  <p className="mt-1 text-lg font-black">{isLoading ? "—" : `${user?.dailyFreeCredits ?? 0}/${FREE_CREDIT_ALLOWANCE}`}</p>
                </div>
              </div>
              <div className="relative mt-5 grid grid-cols-2 gap-3 text-sm font-bold">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-violet-100/80">
                  <span className="block text-xs uppercase tracking-[0.16em] text-violet-100/50">{t("profile.free")}</span>
                  {isLoading ? "—" : user?.dailyFreeCredits} {t("profile.creditsWord")}
                </div>
                <div className="rounded-2xl border border-fuchsia-200/20 bg-fuchsia-400/10 p-3 text-fuchsia-100">
                  <span className="block text-xs uppercase tracking-[0.16em] text-fuchsia-200/70">{t("profile.purchased")}</span>
                  {isLoading ? "—" : user?.purchasedCredits} {t("profile.creditsWord")}
                </div>
              </div>
            </section>

            <section className="cosmic-card h-[31rem]">
              <div className="relative mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-100/70">{t("profile.transactionLedger")}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("profile.creditAdditions")}</h2>
                </div>
                <span className="cosmic-chip">{t("profile.logs", { count: ledger.length })}</span>
              </div>

              <div className="absolute inset-x-5 bottom-5 top-28 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#07051a]/45 p-3 shadow-inner shadow-black/30">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-violet-100/65">{t("profile.loadingLedger")}</div>
                ) : ledger.length ? (
                  <ol className="space-y-3">
                    {ledger.map((transaction) => (
                      <li key={transaction.id} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">{t("profile.purchasedCredits", { amount: transaction.amount })}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/65">{formatLedgerDate(transaction.createdAt)}</p>
                          </div>
                          <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">{t("common.added")}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-violet-100/75">{transaction.reason}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold leading-6 text-violet-100/65">
                    {t("profile.noLedger")}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        <AdBanner className="mb-3" />
      </div>
    </div>
  );
}
