"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

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
const THINKING_MESSAGE_TEMPLATES = [
  (providerName: string) => `${providerName} is reading the stars…`,
  (providerName: string) => `${providerName} is looking at the charts…`,
  (providerName: string) => `${providerName} is thinking…`,
];

function getTotalCredits(credits: Credits | null) {
  if (!credits) {
    return null;
  }

  return (credits.dailyFreeCredits ?? credits.freeCredits ?? 0) + credits.purchasedCredits;
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRandomThinkingMessage(providerName: string) {
  const template = THINKING_MESSAGE_TEMPLATES[Math.floor(Math.random() * THINKING_MESSAGE_TEMPLATES.length)];

  return template(providerName);
}

function isMarkdownBlockStart(line: string) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^```/.test(line)
  );
}

function isSafeHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("/") || href.startsWith("#");
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^\s)]+\)|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      nodes.push(<strong key={key} className="font-black text-inherit">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={key} className="rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[0.85em] text-amber-100">{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[") && token.includes("](")) {
      const closingBracketIndex = token.indexOf("](");
      const label = token.slice(1, closingBracketIndex);
      const href = token.slice(closingBracketIndex + 2, -1);

      nodes.push(
        isSafeHref(href) ? (
          <a key={key} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="font-bold text-amber-200 underline decoration-amber-200/50 underline-offset-4">
            {label}
          </a>
        ) : (
          label
        ),
      );
    } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      nodes.push(<em key={key} className="italic text-inherit">{token.slice(1, -1)}</em>);
    } else {
      nodes.push(token);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function ThinkingLoader({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-violet-50">
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="absolute h-5 w-5 animate-ping rounded-full bg-amber-200/25" />
        <span className="flex h-5 w-5 animate-spin items-center justify-center rounded-full border border-amber-200/40 border-t-amber-200 text-[0.65rem] text-amber-100">✦</span>
      </span>
      <span>{message}</span>
      <span className="flex items-end gap-0.5" aria-hidden="true">
        <span className="h-1 w-1 animate-bounce rounded-full bg-amber-200 [animation-delay:-0.2s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-amber-200 [animation-delay:-0.1s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-amber-200" />
      </span>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        <pre key={`code-${index}`} className="overflow-x-auto rounded-2xl bg-black/30 p-3 text-xs leading-5 text-violet-50">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3);
      const HeadingTag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      const headingClass = level === 1 ? "text-lg" : level === 2 ? "text-base" : "text-sm";

      blocks.push(
        <HeadingTag key={`heading-${index}`} className={`${headingClass} font-black leading-6 text-inherit`}>
          {renderInlineMarkdown(headingMatch[2])}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(<li key={`item-${index}`}>{renderInlineMarkdown(lines[index].replace(/^[-*]\s+/, ""))}</li>);
        index += 1;
      }

      blocks.push(<ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">{items}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: ReactNode[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(<li key={`item-${index}`}>{renderInlineMarkdown(lines[index].replace(/^\d+\.\s+/, ""))}</li>);
        index += 1;
      }

      blocks.push(<ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5">{items}</ol>);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push(
        <blockquote key={`quote-${index}`} className="border-l-2 border-amber-200/60 pl-3 text-violet-100/85">
          {renderInlineMarkdown(quoteLines.join(" "))}
        </blockquote>,
      );
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(<p key={`paragraph-${index}`} className="whitespace-pre-wrap">{renderInlineMarkdown(paragraphLines.join("\n"))}</p>);
  }

  return <div className="space-y-3 break-words">{blocks}</div>;
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
      content: getRandomThinkingMessage(providerName),
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

      if (response.status === 403) {
        const data = await response.json().catch(() => null);
        setIsOutOfCredits(true);
        setErrorMessage(typeof data?.error === "string" ? data.error : LIMIT_MESSAGE);
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === localUserMessage.id ? { ...message, status: "error" as const } : message,
          ).filter((message) => message.id !== loadingMessage.id),
        );
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : "The chat request failed.");
      }

      if (!response.body) {
        throw new Error("The chat response could not be streamed.");
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === localUserMessage.id ? { ...message, status: "sent" as const } : message,
        ),
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";

      const handleStreamEvent = (eventBlock: string) => {
        const eventType = eventBlock.match(/^event: (.+)$/m)?.[1] ?? "message";
        const dataLines = eventBlock
          .split("\n")
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.slice(6));

        if (dataLines.length === 0) {
          return;
        }

        const payload = JSON.parse(dataLines.join("\n"));

        if (eventType === "delta" && typeof payload.content === "string") {
          streamedContent += payload.content;
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === loadingMessage.id
                ? { ...message, id: loadingMessage.id, content: streamedContent, status: "sent" as const }
                : message,
            ),
          );
        }

        if (eventType === "done") {
          if (payload.credits) {
            setCredits(payload.credits);
            setIsOutOfCredits(getTotalCredits(payload.credits) === 0);
          }
        }

        if (eventType === "error") {
          throw new Error(typeof payload.error === "string" ? payload.error : "The chat request failed.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        let eventBoundary = buffer.indexOf("\n\n");

        while (eventBoundary !== -1) {
          const eventBlock = buffer.slice(0, eventBoundary).trim();
          buffer = buffer.slice(eventBoundary + 2);

          if (eventBlock) {
            handleStreamEvent(eventBlock);
          }

          eventBoundary = buffer.indexOf("\n\n");
        }

        if (done) {
          const remainingEventBlock = buffer.trim();

          if (remainingEventBlock) {
            handleStreamEvent(remainingEventBlock);
          }

          break;
        }
      }

      if (!streamedContent.trim()) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === loadingMessage.id
              ? { ...message, content: "I could not read a clear answer this time.", status: "sent" as const }
              : message,
          ),
        );
      }
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
    <main className="cosmic-page">
      <div className="cosmic-shell flex flex-col">
        <header className="z-20 shrink-0 border-b border-white/10 bg-[#1a0f3d]/90 px-4 py-4 text-white shadow-xl shadow-fuchsia-950/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              ← Dashboard
            </Link>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${providerGradient} text-2xl shadow-xl`}>
              {providerSymbol}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black text-white">{providerName}</p>
              <p className="truncate text-xs font-semibold text-violet-100/75">{providerTitle} · {providerSubtitle}</p>
            </div>
            {totalCredits !== null ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right">
                <p className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-amber-200">Credits</p>
                <p className="font-bold text-white">{totalCredits}</p>
              </div>
            ) : null}
          </div>
        </header>

        {isOutOfCredits ? (
          <div className="shrink-0 border-y border-amber-200/20 bg-amber-200/15 px-4 py-3 text-center text-sm font-black text-amber-100">
            {LIMIT_MESSAGE}
          </div>
        ) : null}

        <section className="flex min-h-0 w-full flex-1 flex-col px-4 py-5">
          {errorMessage && !isOutOfCredits ? (
            <div className="mb-4 shrink-0 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] p-4 shadow-2xl shadow-violet-950/30 backdrop-blur-xl">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
              {isLoadingHistory ? (
                <div className="flex min-h-80 items-center justify-center text-violet-100/65">
                  Loading your conversation…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-80 items-center justify-center text-center">
                  <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8">
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${providerGradient} text-3xl shadow-lg`}>
                      {providerSymbol}
                    </div>
                    <h1 className="text-2xl font-black text-white">Start your consultation</h1>
                    <p className="mt-3 text-violet-100/65">
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
                            ? "rounded-br-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-violet-950/30"
                            : "rounded-bl-md border border-white/10 bg-white/10 text-violet-50 shadow-violet-950/20"
                        } ${message.status === "error" ? "border border-rose-300/50 bg-rose-500/20" : ""}`}
                      >
                        {!isUser && message.status === "sending" ? (
                          <ThinkingLoader message={message.content} />
                        ) : (
                          <MarkdownMessage content={message.content} />
                        )}
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

            <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/10 pt-4">
              <div className="flex gap-2 rounded-3xl border border-white/15 bg-[#0b0824]/80 p-2 shadow-inner shadow-violet-950/30 focus-within:border-amber-300">
                <textarea
                  aria-label="Message"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  disabled={isInputDisabled}
                  placeholder={isOutOfCredits ? LIMIT_MESSAGE : `Message ${providerName}…`}
                  rows={1}
                  className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-50 outline-none placeholder:text-violet-100/65 disabled:cursor-not-allowed disabled:text-violet-100/65"
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
                  className="rounded-2xl bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 text-sm font-black text-[#160b2f] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isSending ? "Reading…" : "Send"}
                </button>
              </div>
              <p className="mt-2 text-xs text-violet-100/65">
                Press Enter to send, Shift + Enter for a new line. Each sent message costs 1 credit.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
