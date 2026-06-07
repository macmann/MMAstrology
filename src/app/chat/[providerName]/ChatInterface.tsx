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
    <main className="flex min-h-screen flex-col bg-[#050314] text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.35)_0,transparent_34%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.22)_0,transparent_28%),radial-gradient(circle_at_bottom,rgba(244,114,182,0.18)_0,transparent_34%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-4 py-4 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-200"
          >
            ← Dashboard
          </Link>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${providerGradient} text-2xl shadow-xl`}>
            {providerSymbol}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black text-white sm:text-2xl">{providerName}</p>
            <p className="truncate text-sm text-slate-400">{providerTitle} · {providerSubtitle}</p>
          </div>
          {totalCredits !== null ? (
            <div className="hidden rounded-2xl border border-violet-200/20 bg-white/10 px-4 py-2 text-right sm:block">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-200">Credits</p>
              <p className="font-bold text-white">{totalCredits}</p>
            </div>
          ) : null}
        </div>
      </header>

      {isOutOfCredits ? (
        <div className="border-b border-amber-300/20 bg-amber-400/15 px-4 py-3 text-center text-sm font-semibold text-amber-100">
          {LIMIT_MESSAGE}
        </div>
      ) : null}

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        {errorMessage && !isOutOfCredits ? (
          <div className="mb-4 rounded-3xl border border-rose-300/20 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-violet-950/20 backdrop-blur-xl sm:p-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {isLoadingHistory ? (
              <div className="flex min-h-80 items-center justify-center text-slate-300">
                Loading your conversation…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-80 items-center justify-center text-center">
                <div className="max-w-md rounded-[2rem] border border-white/10 bg-slate-950/70 p-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-3xl">
                    {providerSymbol}
                  </div>
                  <h1 className="text-2xl font-black text-white">Start your consultation</h1>
                  <p className="mt-3 text-slate-300">
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
                      className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-lg sm:max-w-[72%] sm:text-base ${
                        isUser
                          ? "rounded-br-md bg-violet-500 text-white shadow-violet-950/30"
                          : "rounded-bl-md border border-white/10 bg-slate-950/80 text-slate-100 shadow-slate-950/30"
                      } ${message.status === "error" ? "border border-rose-300/50 bg-rose-500/20" : ""}`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.status === "sending" ? (
                        <p className="mt-2 text-xs font-medium text-slate-300">Sending…</p>
                      ) : null}
                      {message.status === "error" ? (
                        <p className="mt-2 text-xs font-medium text-rose-100">Not sent</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 pt-4">
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-slate-950/80 p-2 shadow-inner shadow-slate-950/40 focus-within:border-violet-200/60">
              <textarea
                aria-label="Message"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={isInputDisabled}
                placeholder={isOutOfCredits ? LIMIT_MESSAGE : `Message ${providerName}…`}
                rows={1}
                className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500 sm:text-base"
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
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {isSending ? "Sending" : "Send"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Press Enter to send, Shift + Enter for a new line. Each sent message costs 1 credit.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
