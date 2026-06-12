"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAstrologerProfile } from "@/lib/astrologers";

type HistorySummary = {
  providerName: string;
  providerDisplayName?: string;
  providerDescription?: string | null;
  snippet: string;
  role: "user" | "assistant";
  createdAt: string;
};

function formatHistoryDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function HistoryClient() {
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [deletingProviderName, setDeletingProviderName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetch("/api/chat/history-summary", {
          credentials: "same-origin",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Could not load chat history.");
        }

        if (isMounted) {
          setHistory(Array.isArray(data.history) ? data.history : []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load chat history.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDeleteHistory(providerName: string, providerDisplayName: string) {
    const shouldDelete = window.confirm(`Delete your consultation history with ${providerDisplayName}? This cannot be undone.`);

    if (!shouldDelete) {
      return;
    }

    setDeletingProviderName(providerName);
    setActionErrorMessage(null);

    try {
      const response = await fetch(`/api/chat/history-summary?providerName=${encodeURIComponent(providerName)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Could not delete chat history.");
      }

      setHistory((currentHistory) => currentHistory.filter((item) => item.providerName !== providerName));
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : "Could not delete chat history.");
    } finally {
      setDeletingProviderName(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[0.07]" />
        ))}
      </div>
    );
  }

  if (errorMessage && history.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-rose-200/30 bg-rose-500/15 p-5 text-sm font-semibold text-rose-100">
        {errorMessage}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-200/20 bg-amber-100/10 p-6 text-center shadow-2xl shadow-violet-950/30">
        <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-3xl">↺</div>
        <h2 className="relative mt-4 text-2xl font-black text-amber-100">No consultation history yet</h2>
        <p className="relative mt-2 text-sm leading-6 text-violet-100/70">
          Start a reading with one of your cosmic guides and your latest conversations will appear here.
        </p>
        <Link
          href="/dashboard"
          className="relative mt-5 inline-flex rounded-full bg-amber-200 px-5 py-3 text-sm font-black text-[#160b2f] shadow-lg shadow-fuchsia-950/30 transition hover:brightness-110"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionErrorMessage ? (
        <div className="rounded-[1.25rem] border border-rose-200/30 bg-rose-500/15 p-4 text-sm font-semibold text-rose-100">
          {actionErrorMessage}
        </div>
      ) : null}
      {history.map((item) => {
        const astrologer = getAstrologerProfile(item.providerName);
        const providerDisplayName = item.providerDisplayName?.trim() || item.providerName;
        const providerDescription = item.providerDescription?.trim();
        const isDeleting = deletingProviderName === item.providerName;

        return (
          <article
            key={item.providerName}
            className={`rounded-[1.85rem] border border-white/15 bg-white/[0.08] p-4 shadow-xl shadow-violet-950/20 backdrop-blur ${isDeleting ? "opacity-70" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${
                  astrologer?.accent ?? "from-amber-300 via-fuchsia-400 to-violet-700"
                } text-2xl shadow-lg ${astrologer?.glow ?? "shadow-fuchsia-950/30"}`}
              >
                {astrologer?.symbol ?? "🔮"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black text-slate-50">{providerDisplayName}</h3>
                    <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-violet-100/55">
                      {providerDescription || astrologer?.honorific || "Cosmic Guide"}
                    </p>
                  </div>
                  <time className="shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] font-black text-amber-100" dateTime={item.createdAt}>
                    {formatHistoryDate(item.createdAt)}
                  </time>
                </div>
                <p className="mt-3 text-sm leading-6 text-violet-100/75">
                  <span className="font-black text-amber-100">{item.role === "assistant" ? providerDisplayName : "You"}:</span> {item.snippet}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Link
                href={`/chat/${encodeURIComponent(item.providerName)}`}
                className="inline-flex w-full items-center justify-center rounded-[1.25rem] bg-amber-200 px-4 py-3 text-sm font-black text-[#160b2f] shadow-lg shadow-fuchsia-950/25 transition hover:brightness-110"
              >
                Resume Consultation
              </Link>
              <button
                type="button"
                onClick={() => handleDeleteHistory(item.providerName, providerDisplayName)}
                disabled={deletingProviderName !== null}
                className="inline-flex w-full items-center justify-center rounded-[1.25rem] border border-rose-200/30 bg-rose-500/15 px-4 py-3 text-sm font-black text-rose-100 shadow-lg shadow-fuchsia-950/20 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                aria-label={`Delete consultation history with ${providerDisplayName}`}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
