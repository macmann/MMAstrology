"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  status?: "sending" | "sent" | "error";
};

type Credits = {
  dailyFreeCredits?: number;
  freeCredits?: number;
  purchasedCredits: number;
};

type ChatInterfaceProps = {
  providerName: string;
  providerTitle: string;
  providerSubtitle: string;
  providerSymbol: string;
  providerGradient: string;
};

const LIMIT_MESSAGE = "Daily limit reached. Resets at midnight. Contact Admin to Top Up.";

function getTotalCredits(credits: Credits | null) {
  if (!credits) {
    return null;
  }

  return (credits.dailyFreeCredits ?? credits.freeCredits ?? 0) + credits.purchasedCredits;
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatInterface({
  providerName,
  providerTitle,
  providerSubtitle,
  providerSymbol,
  providerGradient,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOutOfCredits, setIsOutOfCredits] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/chat?providerName=${encodeURIComponent(providerName)}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (response.status === 403) {
          setIsOutOfCredits(true);
        }

        if (!response.ok) {
          setErrorMessage(typeof data?.error === "string" ? data.error : "Could not load this conversation.");
          return;
        }

        const history = Array.isArray(data.messages) ? data.messages : [];
        setMessages(
          history
            .filter(
              (message: Partial<ChatMessage>) =>
                (message.role === "user" || message.role === "assistant") && typeof message.content === "string",
            )
            .map((message: Partial<ChatMessage>, index: number) => ({
              id: typeof message.id === "string" ? message.id : `history-${index}`,
              role: message.role as "user" | "assistant",
              content: message.content ?? "",
              createdAt: message.createdAt,
              status: "sent" as const,
            })),
        );

        if (data.credits) {
          setCredits(data.credits);
          setIsOutOfCredits(getTotalCredits(data.credits) === 0);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Could not load this conversation. Please refresh and try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [providerName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = inputValue.trim();

    if (!trimmedMessage || isSending || isOutOfCredits) {
      return;
    }

    const localUserMessage: ChatMessage = {
      id: createLocalId("user"),
      role: "user",
      content: trimmedMessage,
      status: "sending",
    };
    const loadingMessage: ChatMessage = {
      id: createLocalId("assistant-loading"),
      role: "assistant",
      content: `${providerName} is reading the stars…`,
      status: "sending",
    };

    setInputValue("");
    setIsSending(true);
    setErrorMessage(null);
    setMessages((currentMessages) => [...currentMessages, localUserMessage, loadingMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ providerName, message: trimmedMessage }),
      });
      const data = await response.json();

      if (response.status === 403) {
        setIsOutOfCredits(true);
        setErrorMessage(LIMIT_MESSAGE);
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === localUserMessage.id ? { ...message, status: "error" as const } : message,
          ).filter((message) => message.id !== loadingMessage.id),
        );
        return;
      }

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "The chat request failed.");
      }

      if (data.credits) {
        setCredits(data.credits);
        setIsOutOfCredits(getTotalCredits(data.credits) === 0);
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (message.id === localUserMessage.id) {
            return { ...message, status: "sent" as const };
          }

          if (message.id === loadingMessage.id) {
            return {
              id: createLocalId("assistant"),
              role: "assistant",
              content: typeof data.message === "string" ? data.message : "I could not read a clear answer this time.",
              status: "sent" as const,
            };
          }

          return message;
        }),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The chat request failed.");
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === localUserMessage.id ? { ...message, status: "error" as const } : message,
        ).filter((message) => message.id !== loadingMessage.id),
      );
    } finally {
      setIsSending(false);
    }
  }

  const totalCredits = getTotalCredits(credits);
  const isInputDisabled = isOutOfCredits || isSending || isLoadingHistory;

  return (
    <main className="min-h-screen bg-slate-200 text-slate-950 sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col overflow-hidden bg-[#eef3f8] shadow-2xl shadow-slate-400/40 sm:min-h-[calc(100vh-3rem)] sm:rounded-[2.25rem]">
        <header className="sticky top-0 z-20 bg-[#0b1f3f] px-4 py-4 text-white shadow-xl shadow-slate-400/20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            ← Dashboard
          </Link>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${providerGradient} text-2xl shadow-xl`}>
            {providerSymbol}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black text-white">{providerName}</p>
            <p className="truncate text-xs font-semibold text-slate-300">{providerTitle} · {providerSubtitle}</p>
          </div>
          {totalCredits !== null ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-emerald-300">Credits</p>
              <p className="font-bold text-white">{totalCredits}</p>
            </div>
          ) : null}
        </div>
        </header>

        {isOutOfCredits ? (
        <div className="bg-amber-100 px-4 py-3 text-center text-sm font-black text-amber-800">
          {LIMIT_MESSAGE}
        </div>
      ) : null}

        <section className="flex w-full flex-1 flex-col px-4 py-5">
        {errorMessage && !isOutOfCredits ? (
          <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-[2rem] border border-white bg-white p-4 shadow-2xl shadow-slate-300/60">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {isLoadingHistory ? (
              <div className="flex min-h-80 items-center justify-center text-slate-500">
                Loading your conversation…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-80 items-center justify-center text-center">
                <div className="max-w-md rounded-[2rem] border border-slate-100 bg-slate-50 p-8">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${providerGradient} text-3xl shadow-lg`}>
                    {providerSymbol}
                  </div>
                  <h1 className="text-2xl font-black text-[#0b1f3f]">Start your consultation</h1>
                  <p className="mt-3 text-slate-500">
                    Ask {providerName} about love, career, timing, or your current cosmic pattern.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-lg  ${
                        isUser
                          ? "rounded-br-md bg-[#0b1f3f] text-white shadow-slate-400/30"
                          : "rounded-bl-md border border-slate-100 bg-slate-100 text-slate-700 shadow-slate-300/30"
                      } ${message.status === "error" ? "border border-rose-300/50 bg-rose-500/20" : ""}`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.status === "sending" ? (
                        <p className="mt-2 text-xs font-bold text-slate-400">Sending…</p>
                      ) : null}
                      {message.status === "error" ? (
                        <p className="mt-2 text-xs font-bold text-rose-100">Not sent</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4">
            <div className="flex gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-inner shadow-slate-200/80 focus-within:border-emerald-300">
              <textarea
                aria-label="Message"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={isInputDisabled}
                placeholder={isOutOfCredits ? LIMIT_MESSAGE : `Message ${providerName}…`}
                rows={1}
                className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isInputDisabled || !inputValue.trim()}
                className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#0b1f3f] transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isSending ? "Sending" : "Send"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Press Enter to send, Shift + Enter for a new line. Each sent message costs 1 credit.
            </p>
          </form>
        </div>
        </section>
      </div>
    </main>
  );
}
