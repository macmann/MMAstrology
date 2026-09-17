import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { checkAndResetCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import {
  calculateAiCostUsd,
  estimateChatInputTokens,
  estimateTextTokens,
  type TokenUsage,
} from "@/lib/ai-usage";
import { buildSystemPrompt } from "@/lib/provider-prompts";
import {
  CHAT_HISTORY_CONTEXT_PROMPT_KEY,
  parseChatHistoryContextSetting,
} from "@/lib/chat-settings";
import { getAiProviderOption } from "@/lib/ai-providers";
import type { AiProviderType } from "@prisma/client";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProviderStreamChunk =
  | { type: "content"; content: string }
  | { type: "usage"; inputTokens?: number; outputTokens?: number };

type ProviderDiagnostics = {
  requestId: string;
  httpStatus?: number;
  responseContentType?: string;
  providerRequestId?: string;
  sseEvents: number;
  contentChunks: number;
  contentCharacters: number;
  usageEvents: number;
  finishReasons: string[];
  lastEventSummary?: Record<string, unknown>;
};

const DEFAULT_MAX_OUTPUT_TOKENS = 400;

type ProviderConfig = {
  personaName: string;
  aiProvider: AiProviderType;
  model: string;
};

function logProviderEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown>,
) {
  console[level](`[ai-provider] ${event}`, details);
}

function summarizeProviderEvent(parsed: unknown) {
  if (!parsed || typeof parsed !== "object") {
    return { valueType: typeof parsed };
  }

  const event = parsed as Record<string, unknown>;
  const choices = Array.isArray(event.choices) ? event.choices : [];
  const candidates = Array.isArray(event.candidates) ? event.candidates : [];
  const firstChoice = choices[0] as Record<string, unknown> | undefined;
  const firstCandidate = candidates[0] as Record<string, unknown> | undefined;
  const promptFeedback = event.promptFeedback as Record<string, unknown> | undefined;

  return {
    keys: Object.keys(event),
    eventType: event.type,
    choiceCount: choices.length,
    candidateCount: candidates.length,
    finishReason: firstChoice?.finish_reason ?? firstCandidate?.finishReason,
    refusalPresent:
      Boolean((firstChoice?.delta as Record<string, unknown> | undefined)?.refusal) ||
      Boolean((firstChoice?.message as Record<string, unknown> | undefined)?.refusal),
    blockReason: promptFeedback?.blockReason,
    hasUsage: Boolean(event.usage ?? event.usageMetadata),
    errorPresent: Boolean(event.error),
  };
}

function recordProviderEvent(
  diagnostics: ProviderDiagnostics,
  parsed: unknown,
) {
  diagnostics.sseEvents += 1;
  const summary = summarizeProviderEvent(parsed);
  diagnostics.lastEventSummary = summary;
  const finishReason = summary.finishReason;

  if (
    (typeof finishReason === "string" || typeof finishReason === "number") &&
    !diagnostics.finishReasons.includes(String(finishReason))
  ) {
    diagnostics.finishReasons.push(String(finishReason));
  }
}

function recordProviderResponse(
  response: Response,
  diagnostics: ProviderDiagnostics,
) {
  diagnostics.httpStatus = response.status;
  diagnostics.responseContentType = response.headers.get("content-type") ?? undefined;
  diagnostics.providerRequestId =
    response.headers.get("x-request-id") ??
    response.headers.get("request-id") ??
    response.headers.get("x-goog-request-id") ??
    undefined;
}

function isOpenAiReasoningModel(model: string) {
  const normalizedModel = model.trim().toLowerCase();

  return (
    normalizedModel.startsWith("gpt-5") ||
    normalizedModel.startsWith("o1") ||
    normalizedModel.startsWith("o3") ||
    normalizedModel.startsWith("o4")
  );
}

function supportsCustomTemperature(model: string) {
  return !isOpenAiReasoningModel(model);
}

function getOpenAiMaxCompletionTokens(model: string, maxOutputTokens: number) {
  if (!isOpenAiReasoningModel(model)) {
    return maxOutputTokens;
  }

  return Math.max(maxOutputTokens, 4096);
}

function isDeepSeekReasoningModel(model: string) {
  const normalizedModel = model.trim().toLowerCase();

  return (
    normalizedModel.includes("reasoner") ||
    normalizedModel.includes("deepseek-r1") ||
    normalizedModel.includes("v4-flash") ||
    normalizedModel.includes("deepseek-flash")
  );
}

function getDeepSeekMaxCompletionTokens(model: string, maxOutputTokens: number) {
  if (!isDeepSeekReasoningModel(model)) {
    return maxOutputTokens;
  }

  // DeepSeek counts hidden reasoning tokens toward max_tokens. A small limit can
  // therefore end the stream before the model emits any user-visible content.
  return Math.max(maxOutputTokens, 4096);
}

function normalizeApiKey(rawApiKey: string) {
  let apiKey = rawApiKey.trim();

  if (
    (apiKey.startsWith('"') && apiKey.endsWith('"')) ||
    (apiKey.startsWith("'") && apiKey.endsWith("'"))
  ) {
    apiKey = apiKey.slice(1, -1).trim();
  }

  if (apiKey.toLowerCase().startsWith("bearer ")) {
    apiKey = apiKey.slice("bearer ".length).trim();
  }

  if (apiKey.toLowerCase().startsWith("authorization: bearer ")) {
    apiKey = apiKey.slice("authorization: bearer ".length).trim();
  }

  return apiKey;
}

function getApiKey(config: ProviderConfig) {
  const option = getAiProviderOption(config.aiProvider);
  const rawApiKey =
    process.env[option.envKey] ??
    (config.aiProvider === "GOOGLE" ? process.env.GEMINI_API_KEY : undefined);

  return rawApiKey ? normalizeApiKey(rawApiKey) : undefined;
}

function assertHeaderSafeApiKey(apiKey: string, envKey: string) {
  if (!apiKey) {
    throw new Error(`${envKey} is empty after trimming whitespace.`);
  }

  if (/[\r\n]/.test(apiKey)) {
    throw new Error(
      `${envKey} contains line breaks. Paste only the raw API key value without newlines.`,
    );
  }
}


function parseSseDataBlocks(buffer: string) {
  return buffer
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n\n")
    .map((block) =>
      block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n"),
    )
    .filter(Boolean);
}

function extractSseBlocks(buffer: string, done: boolean) {
  const normalizedBuffer = buffer
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
  const blocks = normalizedBuffer.split("\n\n");
  const remainingBuffer = blocks.pop() ?? "";

  if (done && remainingBuffer) {
    blocks.push(remainingBuffer);
    return { blocks, remainingBuffer: "" };
  }

  return { blocks, remainingBuffer };
}

async function readProviderError(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    const message = data?.error?.message ?? data?.error;

    return typeof message === "string" ? message : fallbackMessage;
  }

  const text = await response.text().catch(() => "");

  return text.trim() || fallbackMessage;
}

async function* streamOpenAiCompatibleProvider(options: {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  includeUsage?: boolean;
  maxTokensParameter?: "max_tokens" | "max_completion_tokens";
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  thinking?: { type: "disabled" };
  diagnostics: ProviderDiagnostics;
}): AsyncGenerator<ProviderStreamChunk> {
  const maxTokensParameter = options.maxTokensParameter ?? "max_tokens";
  const requestBody: Record<string, unknown> = {
    model: options.model,
    messages: [
      { role: "system", content: options.systemPrompt },
      ...options.messages,
    ],
    [maxTokensParameter]: options.maxOutputTokens,
    stream: true,
  };

  if (supportsCustomTemperature(options.model)) {
    requestBody.temperature = 0.8;
  }

  if (options.reasoningEffort) {
    requestBody.reasoning_effort = options.reasoningEffort;
  }

  if (options.thinking) {
    requestBody.thinking = options.thinking;
  }

  if (options.includeUsage) {
    requestBody.stream_options = { include_usage: true };
  }

  const response = await fetch(`${options.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  recordProviderResponse(response, options.diagnostics);

  if (!response.ok) {
    throw new Error(
      await readProviderError(response, "The AI provider returned an error."),
    );
  }

  if (!response.body) {
    throw new Error("The AI provider did not return a stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const { blocks, remainingBuffer } = extractSseBlocks(buffer, done);
    buffer = remainingBuffer;

    for (const data of parseSseDataBlocks(blocks.join("\n\n"))) {
      if (data === "[DONE]") {
        return;
      }

      const parsed = JSON.parse(data);
      recordProviderEvent(options.diagnostics, parsed);
      const usage = parsed?.usage;

      if (usage) {
        options.diagnostics.usageEvents += 1;
        yield {
          type: "usage",
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
        };
      }

      const content = parsed?.choices?.[0]?.delta?.content;

      if (typeof content === "string") {
        options.diagnostics.contentChunks += 1;
        options.diagnostics.contentCharacters += content.length;
        yield { type: "content", content };
      }
    }

    if (done) {
      break;
    }
  }
}

async function* streamAnthropicProvider(options: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  diagnostics: ProviderDiagnostics;
}): AsyncGenerator<ProviderStreamChunk> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": options.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      system: options.systemPrompt,
      messages: options.messages,
      max_tokens: options.maxOutputTokens,
      temperature: 0.8,
      stream: true,
    }),
  });
  recordProviderResponse(response, options.diagnostics);

  if (!response.ok) {
    throw new Error(
      await readProviderError(response, "Anthropic returned an error."),
    );
  }

  if (!response.body) {
    throw new Error("Anthropic did not return a stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const { blocks, remainingBuffer } = extractSseBlocks(buffer, done);
    buffer = remainingBuffer;

    for (const data of parseSseDataBlocks(blocks.join("\n\n"))) {
      const parsed = JSON.parse(data);
      recordProviderEvent(options.diagnostics, parsed);
      const messageUsage = parsed?.message?.usage;
      const deltaUsage = parsed?.usage;

      if (messageUsage) {
        options.diagnostics.usageEvents += 1;
        yield {
          type: "usage",
          inputTokens: messageUsage.input_tokens,
          outputTokens: messageUsage.output_tokens,
        };
      }

      if (deltaUsage) {
        options.diagnostics.usageEvents += 1;
        yield {
          type: "usage",
          inputTokens: deltaUsage.input_tokens,
          outputTokens: deltaUsage.output_tokens,
        };
      }

      const text = parsed?.delta?.text;

      if (typeof text === "string") {
        options.diagnostics.contentChunks += 1;
        options.diagnostics.contentCharacters += text.length;
        yield { type: "content", content: text };
      }
    }

    if (done) {
      break;
    }
  }
}

function getGoogleThinkingConfig(model: string) {
  const normalizedModel = model.toLowerCase();

  if (normalizedModel.includes("gemini-2.5-flash")) {
    return { thinkingBudget: 0 };
  }

  if (
    normalizedModel.includes("gemini-3") &&
    (normalizedModel.includes("flash") || normalizedModel.includes("lite"))
  ) {
    return { thinkingLevel: "minimal" };
  }

  return undefined;
}

async function* streamGoogleProvider(options: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  diagnostics: ProviderDiagnostics;
}): AsyncGenerator<ProviderStreamChunk> {
  const thinkingConfig = getGoogleThinkingConfig(options.model);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(options.apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: options.systemPrompt }],
        },
        contents: options.messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: options.maxOutputTokens,
          ...(thinkingConfig ? { thinkingConfig } : {}),
        },
      }),
    },
  );
  recordProviderResponse(response, options.diagnostics);

  if (!response.ok) {
    throw new Error(
      await readProviderError(response, "Google Gen AI returned an error."),
    );
  }

  if (!response.body) {
    throw new Error("Google Gen AI did not return a stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const { blocks, remainingBuffer } = extractSseBlocks(buffer, done);
    buffer = remainingBuffer;

    for (const data of parseSseDataBlocks(blocks.join("\n\n"))) {
      const parsed = JSON.parse(data);
      recordProviderEvent(options.diagnostics, parsed);
      const usage = parsed?.usageMetadata;

      if (usage) {
        options.diagnostics.usageEvents += 1;
        yield {
          type: "usage",
          inputTokens: usage.promptTokenCount,
          outputTokens: usage.candidatesTokenCount,
        };
      }

      const content = parsed?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .filter((text: unknown): text is string => typeof text === "string")
        .join("\n");

      if (typeof content === "string") {
        options.diagnostics.contentChunks += 1;
        options.diagnostics.contentCharacters += content.length;
        yield { type: "content", content };
      }
    }

    if (done) {
      break;
    }
  }
}

function streamProvider(
  config: ProviderConfig,
  systemPrompt: string,
  messages: ChatMessage[],
  maxOutputTokens: number,
  diagnostics: ProviderDiagnostics,
) {
  const apiKey = getApiKey(config);

  if (!apiKey) {
    throw new Error(`${getAiProviderOption(config.aiProvider).envKey} is not configured.`);
  }

  assertHeaderSafeApiKey(apiKey, getAiProviderOption(config.aiProvider).envKey);

  const model = config.model;

  if (config.aiProvider === "OPENAI") {
    return streamOpenAiCompatibleProvider({
      apiKey,
      baseUrl: "https://api.openai.com/v1",
      model,
      systemPrompt,
      messages,
      maxOutputTokens: getOpenAiMaxCompletionTokens(model, maxOutputTokens),
      includeUsage: true,
      maxTokensParameter: "max_completion_tokens",
      reasoningEffort: isOpenAiReasoningModel(model) ? "low" : undefined,
      diagnostics,
    });
  }

  if (config.aiProvider === "ANTHROPIC") {
    return streamAnthropicProvider({
      apiKey,
      model,
      systemPrompt,
      messages,
      maxOutputTokens,
      diagnostics,
    });
  }

  if (config.aiProvider === "GOOGLE") {
    return streamGoogleProvider({
      apiKey,
      model,
      systemPrompt,
      messages,
      maxOutputTokens,
      diagnostics,
    });
  }

  if (config.aiProvider === "DEEPSEEK") {
    return streamOpenAiCompatibleProvider({
      apiKey,
      baseUrl: "https://api.deepseek.com",
      model,
      systemPrompt,
      messages,
      maxOutputTokens: getDeepSeekMaxCompletionTokens(model, maxOutputTokens),
      includeUsage: true,
      thinking: { type: "disabled" },
      diagnostics,
    });
  }

  return streamOpenAiCompatibleProvider({
    apiKey,
    baseUrl: "https://api.x.ai/v1",
    model,
    systemPrompt,
    messages,
    maxOutputTokens,
    diagnostics,
  });
}

function encodeStreamEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function deductOneCredit(userId: string, dailyFreeCredits: number) {
  if (dailyFreeCredits > 0) {
    const result = await prisma.user.updateMany({
      where: {
        id: userId,
        dailyFreeCredits: {
          gt: 0,
        },
      },
      data: {
        dailyFreeCredits: {
          decrement: 1,
        },
      },
    });

    if (result.count > 0) {
      return true;
    }
  }

  const result = await prisma.user.updateMany({
    where: {
      id: userId,
      purchasedCredits: {
        gt: 0,
      },
    },
    data: {
      purchasedCredits: {
        decrement: 1,
      },
    },
  });

  return result.count > 0;
}

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: "You must be logged in to view this chat." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const providerName = searchParams.get("providerName");

  if (!providerName) {
    return NextResponse.json({ error: "providerName is required." }, { status: 400 });
  }

  const [credits, messages] = await Promise.all([
    checkAndResetCredits(session.userId),
    prisma.message.findMany({
      where: {
        userId: session.userId,
        providerName,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    }),
  ]);

  if (!credits) {
    return NextResponse.json({ error: "User was not found." }, { status: 404 });
  }

  return NextResponse.json({
    providerName,
    messages: messages.map(
      (message: {
        id: string;
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
      }) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      }),
    ),
    credits: {
      dailyFreeCredits: credits.dailyFreeCredits,
      purchasedCredits: credits.purchasedCredits,
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: "You must be logged in to chat." },
      { status: 401 },
    );
  }

  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const providerName = body.providerName;

  if (!message) {
    return NextResponse.json(
      { error: "message is required." },
      { status: 400 },
    );
  }

  if (!providerName) {
    return NextResponse.json({ error: "providerName is required." }, { status: 400 });
  }

  const userWithCredits = await checkAndResetCredits(session.userId);

  if (!userWithCredits) {
    return NextResponse.json({ error: "User was not found." }, { status: 404 });
  }

  if (
    userWithCredits.dailyFreeCredits + userWithCredits.purchasedCredits <=
    0
  ) {
    return NextResponse.json(
      { error: "You do not have enough credits to chat." },
      { status: 403 },
    );
  }

  const [profile, providerConfig, chatHistoryContextConfig] = await Promise.all([
    prisma.astrologicalProfile.findUnique({
      where: { userId: session.userId },
      select: {
        dob: true,
        birthTime: true,
        birthLocation: true,
      },
    }),
    prisma.providerConfig.findUnique({
      where: { name: providerName },
      select: {
        isActive: true,
        systemPrompt: true,
        maxOutputTokens: true,
        isProProvider: true,
        aiProvider: true,
        aiModel: true,
      },
    }),
    prisma.promptConfig.findUnique({
      where: { key: CHAT_HISTORY_CONTEXT_PROMPT_KEY },
      select: { prompt: true },
    }),
  ]);

  if (!profile) {
    return NextResponse.json(
      { error: "Please complete your astrological profile before chatting." },
      { status: 400 },
    );
  }

  if (providerConfig?.isProProvider && !userWithCredits.isPro) {
    return NextResponse.json(
      { error: "Purchase Pro to access this specialized provider." },
      { status: 403 },
    );
  }

  if (!providerConfig?.isActive) {
    return NextResponse.json(
      { error: `${providerName} is currently unavailable.` },
      { status: 403 },
    );
  }

  const isChatHistoryContextEnabled = parseChatHistoryContextSetting(
    chatHistoryContextConfig?.prompt,
  );
  const previousMessages = isChatHistoryContextEnabled
    ? await prisma.message.findMany({
        where: {
          userId: session.userId,
          providerName,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          role: true,
          content: true,
        },
      })
    : [];

  const didDeductCredit = await deductOneCredit(
    session.userId,
    userWithCredits.dailyFreeCredits,
  );

  if (!didDeductCredit) {
    return NextResponse.json(
      { error: "You do not have enough credits to chat." },
      { status: 403 },
    );
  }

  const config: ProviderConfig = {
    personaName: providerName,
    aiProvider: providerConfig.aiProvider,
    model: providerConfig.aiModel,
  };
  const model = config.model;
  const maxOutputTokens =
    providerConfig.maxOutputTokens || DEFAULT_MAX_OUTPUT_TOKENS;
  const systemPrompt = buildSystemPrompt(
    config,
    profile,
    providerConfig.systemPrompt,
  );
  const conversationMessages = [
    ...previousMessages
      .reverse()
      .map(
        (previousMessage: { role: "user" | "assistant"; content: string }) => ({
          role: previousMessage.role,
          content: previousMessage.content,
        }),
      ),
    { role: "user" as const, content: message },
  ];
  const encoder = new TextEncoder();
  const startedAt = Date.now();
  const diagnostics: ProviderDiagnostics = {
    requestId: crypto.randomUUID(),
    sseEvents: 0,
    contentChunks: 0,
    contentCharacters: 0,
    usageEvents: 0,
    finishReasons: [],
  };

  logProviderEvent("info", "request_started", {
    requestId: diagnostics.requestId,
    provider: config.aiProvider,
    personaName: config.personaName,
    model,
    maxOutputTokens,
    messageCount: conversationMessages.length,
    estimatedInputTokens: estimateChatInputTokens(
      systemPrompt,
      conversationMessages,
    ),
  });

  const stream = new ReadableStream({
    async start(controller) {
      let reply = "";
      let tokenUsage: TokenUsage = {
        inputTokens: estimateChatInputTokens(
          systemPrompt,
          conversationMessages,
        ),
        outputTokens: 0,
        estimated: true,
      };

      try {
        for await (const chunk of streamProvider(
          config,
          systemPrompt,
          conversationMessages,
          maxOutputTokens,
          diagnostics,
        )) {
          if (chunk.type === "usage") {
            tokenUsage = {
              inputTokens:
                typeof chunk.inputTokens === "number"
                  ? chunk.inputTokens
                  : tokenUsage.inputTokens,
              outputTokens:
                typeof chunk.outputTokens === "number"
                  ? chunk.outputTokens
                  : tokenUsage.outputTokens,
              estimated: false,
            };
            continue;
          }

          reply += chunk.content;
          controller.enqueue(
            encoder.encode(
              encodeStreamEvent("delta", { content: chunk.content }),
            ),
          );
        }

        if (!reply.trim()) {
          logProviderEvent("error", "empty_response", {
            ...diagnostics,
            provider: config.aiProvider,
            personaName: config.personaName,
            model,
            durationMs: Date.now() - startedAt,
          });
          throw new Error("The AI provider returned an empty response.");
        }

        if (tokenUsage.outputTokens === 0) {
          tokenUsage = {
            ...tokenUsage,
            outputTokens: estimateTextTokens(reply),
            estimated: true,
          };
        }

        const durationMs = Math.max(0, Date.now() - startedAt);
        const costUsd = calculateAiCostUsd(
          model,
          tokenUsage.inputTokens,
          tokenUsage.outputTokens,
        );

        logProviderEvent("info", "request_completed", {
          ...diagnostics,
          provider: config.aiProvider,
          personaName: config.personaName,
          model,
          durationMs,
          inputTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          tokenUsageEstimated: tokenUsage.estimated,
        });

        await prisma.$transaction([
          prisma.message.createMany({
            data: [
              {
                userId: session.userId,
                providerName,
                role: "user",
                content: message,
              },
              {
                userId: session.userId,
                providerName,
                role: "assistant",
                content: reply.trim(),
              },
            ],
          }),
          prisma.aiUsageLog.create({
            data: {
              userId: session.userId,
              providerName,
              model,
              inputTokens: tokenUsage.inputTokens,
              outputTokens: tokenUsage.outputTokens,
              durationMs,
              costUsd,
              costEstimated: tokenUsage.estimated,
            },
          }),
        ]);

        const credits = await prisma.user.findUnique({
          where: { id: session.userId },
          select: {
            dailyFreeCredits: true,
            purchasedCredits: true,
          },
        });

        controller.enqueue(
          encoder.encode(encodeStreamEvent("done", { providerName, credits })),
        );
      } catch (error) {
        logProviderEvent("error", "request_failed", {
          ...diagnostics,
          provider: config.aiProvider,
          personaName: config.personaName,
          model,
          durationMs: Date.now() - startedAt,
          errorName: error instanceof Error ? error.name : typeof error,
          errorMessage:
            error instanceof Error ? error.message : "Unknown provider error",
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        controller.enqueue(
          encoder.encode(
            encodeStreamEvent("error", {
              error:
                error instanceof Error
                  ? error.message
                  : "The AI provider could not complete this chat.",
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
