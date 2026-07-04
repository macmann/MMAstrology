import type { AiProviderType } from "@prisma/client";

export const AI_PROVIDER_OPTIONS = [
  {
    value: "OPENAI",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    suggestedModels: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
  },
  {
    value: "ANTHROPIC",
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: "claude-3-5-haiku-latest",
    suggestedModels: [
      "claude-3-5-haiku-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-7-sonnet-latest",
    ],
  },
  {
    value: "GOOGLE",
    label: "Google Gemini",
    envKey: "GOOGLE_GENAI_API_KEY",
    defaultModel: "gemini-1.5-flash",
    suggestedModels: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"],
  },
  {
    value: "XAI",
    label: "xAI",
    envKey: "XAI_API_KEY",
    defaultModel: "grok-2-latest",
    suggestedModels: ["grok-2-latest", "grok-2-vision-latest", "grok-3-mini", "grok-3"],
  },
] as const satisfies readonly {
  value: AiProviderType;
  label: string;
  envKey: string;
  defaultModel: string;
  suggestedModels: readonly string[];
}[];

export function getAiProviderOption(value: AiProviderType) {
  return AI_PROVIDER_OPTIONS.find((option) => option.value === value) ?? AI_PROVIDER_OPTIONS[0];
}

export function isAiProviderType(value: string): value is AiProviderType {
  return AI_PROVIDER_OPTIONS.some((option) => option.value === value);
}

export function getSuggestedModelOptions(value: AiProviderType) {
  return getAiProviderOption(value).suggestedModels;
}

export function normalizeAiModel(value: FormDataEntryValue | null, provider: AiProviderType) {
  const model = String(value ?? "").trim();

  if (!model || model.length > 120) {
    return getAiProviderOption(provider).defaultModel;
  }

  return model;
}
