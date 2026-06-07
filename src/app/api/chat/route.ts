import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { checkAndResetCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/provider-prompts";

export const runtime = "nodejs";

type ChatProviderName = "Sayar Gyi" | "Daw Nilar" | "Min Thet" | "Ko Tar Yar";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProviderConfig = {
  personaName: ChatProviderName;
  tone: string;
  envKey: string;
  modelEnvKey: string;
  defaultModel: string;
};

const PROVIDERS: Record<ChatProviderName, ProviderConfig> = {
  "Sayar Gyi": {
    personaName: "Sayar Gyi",
    tone: "Traditional, authoritative tone",
    envKey: "OPENAI_API_KEY",
    modelEnvKey: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini",
  },
  "Daw Nilar": {
    personaName: "Daw Nilar",
    tone: "Compassionate, psychological tone",
    envKey: "ANTHROPIC_API_KEY",
    modelEnvKey: "ANTHROPIC_MODEL",
    defaultModel: "claude-3-5-haiku-latest",
  },
  "Min Thet": {
    personaName: "Min Thet",
    tone: "Modern, practical, direct tone",
    envKey: "GOOGLE_GENAI_API_KEY",
    modelEnvKey: "GOOGLE_GENAI_MODEL",
    defaultModel: "gemini-1.5-flash",
  },
  "Ko Tar Yar": {
    personaName: "Ko Tar Yar",
    tone: "Witty, slightly cynical, but insightful tone",
    envKey: "XAI_API_KEY",
    modelEnvKey: "XAI_MODEL",
    defaultModel: "grok-2-latest",
  },
};

function isChatProviderName(value: unknown): value is ChatProviderName {
  return typeof value === "string" && value in PROVIDERS;
}

function normalizeApiKey(rawApiKey: string) {
  let apiKey = rawApiKey.trim();

  if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
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
  const rawApiKey = process.env[config.envKey] ?? (config.personaName === "Min Thet" ? process.env.GEMINI_API_KEY : undefined);

  return rawApiKey ? normalizeApiKey(rawApiKey) : undefined;
}

function assertHeaderSafeApiKey(apiKey: string, envKey: string) {
  if (!apiKey) {
    throw new Error(`${envKey} is empty after trimming whitespace.`);
  }

  if (/[\r\n]/.test(apiKey)) {
    throw new Error(`${envKey} contains line breaks. Paste only the raw API key value without newlines.`);
  }
}

function getModel(config: ProviderConfig) {
  return process.env[config.modelEnvKey] ?? config.defaultModel;
}

async function callOpenAiCompatibleProvider(options: {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
}) {
  const response = await fetch(`${options.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: "system", content: options.systemPrompt }, ...options.messages],
      temperature: 0.8,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error?.message === "string" ? data.error.message : "The AI provider returned an error.");
  }

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The AI provider returned an empty response.");
  }

  return content.trim();
}

async function callAnthropicProvider(options: { apiKey: string; model: string; systemPrompt: string; messages: ChatMessage[] }) {
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
      max_tokens: 1024,
      temperature: 0.8,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error?.message === "string" ? data.error.message : "Anthropic returned an error.");
  }

  const content = data?.content?.find((block: { type?: string; text?: string }) => block.type === "text")?.text;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Anthropic returned an empty response.");
  }

  return content.trim();
}

async function callGoogleProvider(options: { apiKey: string; model: string; systemPrompt: string; messages: ChatMessage[] }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
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
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error?.message === "string" ? data.error.message : "Google Gen AI returned an error.");
  }

  const content = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text)
    .filter((text: unknown): text is string => typeof text === "string")
    .join("\n");

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Google Gen AI returned an empty response.");
  }

  return content.trim();
}

async function callProvider(config: ProviderConfig, systemPrompt: string, messages: ChatMessage[]) {
  const apiKey = getApiKey(config);

  if (!apiKey) {
    throw new Error(`${config.envKey} is not configured.`);
  }

  assertHeaderSafeApiKey(apiKey, config.envKey);

  const model = getModel(config);

  if (config.personaName === "Sayar Gyi") {
    return callOpenAiCompatibleProvider({
      apiKey,
      baseUrl: "https://api.openai.com/v1",
      model,
      systemPrompt,
      messages,
    });
  }

  if (config.personaName === "Daw Nilar") {
    return callAnthropicProvider({ apiKey, model, systemPrompt, messages });
  }

  if (config.personaName === "Min Thet") {
    return callGoogleProvider({ apiKey, model, systemPrompt, messages });
  }

  return callOpenAiCompatibleProvider({
    apiKey,
    baseUrl: "https://api.x.ai/v1",
    model,
    systemPrompt,
    messages,
  });
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
    return NextResponse.json({ error: "You must be logged in to view this chat." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const providerName = searchParams.get("providerName");

  if (!isChatProviderName(providerName)) {
    return NextResponse.json({ error: "providerName must be one of: Sayar Gyi, Daw Nilar, Min Thet, Ko Tar Yar." }, { status: 400 });
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
    messages: messages.map((message: { id: string; role: "user" | "assistant"; content: string; createdAt: Date }) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
    credits: {
      dailyFreeCredits: credits.dailyFreeCredits,
      purchasedCredits: credits.purchasedCredits,
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to chat." }, { status: 401 });
  }

  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const providerName = body.providerName;

  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  if (!isChatProviderName(providerName)) {
    return NextResponse.json({ error: "providerName must be one of: Sayar Gyi, Daw Nilar, Min Thet, Ko Tar Yar." }, { status: 400 });
  }

  const userWithCredits = await checkAndResetCredits(session.userId);

  if (!userWithCredits) {
    return NextResponse.json({ error: "User was not found." }, { status: 404 });
  }

  if (userWithCredits.dailyFreeCredits + userWithCredits.purchasedCredits <= 0) {
    return NextResponse.json({ error: "You do not have enough credits to chat." }, { status: 403 });
  }

  const [profile, previousMessages, providerConfig] = await Promise.all([
    prisma.astrologicalProfile.findUnique({
      where: { userId: session.userId },
      select: {
        dob: true,
        birthTime: true,
        birthLocation: true,
      },
    }),
    prisma.message.findMany({
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
    }),
    prisma.providerConfig.findUnique({
      where: { name: providerName },
      select: {
        isActive: true,
        systemPrompt: true,
      },
    }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Please complete your astrological profile before chatting." }, { status: 400 });
  }

  if (!providerConfig?.isActive) {
    return NextResponse.json({ error: `${providerName} is currently unavailable.` }, { status: 403 });
  }

  const didDeductCredit = await deductOneCredit(session.userId, userWithCredits.dailyFreeCredits);

  if (!didDeductCredit) {
    return NextResponse.json({ error: "You do not have enough credits to chat." }, { status: 403 });
  }

  const config = PROVIDERS[providerName];
  const systemPrompt = buildSystemPrompt(config, profile, providerConfig.systemPrompt);
  const conversationMessages = [
    ...previousMessages.reverse().map((previousMessage: { role: "user" | "assistant"; content: string }) => ({
      role: previousMessage.role,
      content: previousMessage.content,
    })),
    { role: "user" as const, content: message },
  ];
  let reply: string;

  try {
    reply = await callProvider(config, systemPrompt, conversationMessages);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The AI provider could not complete this chat." },
      { status: 502 },
    );
  }

  await prisma.message.createMany({
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
        content: reply,
      },
    ],
  });

  const credits = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      dailyFreeCredits: true,
      purchasedCredits: true,
    },
  });

  return NextResponse.json({
    message: reply,
    providerName,
    credits,
  });
}
