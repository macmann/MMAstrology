export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  estimated: boolean;
};

type ModelPricing = {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
};

const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.6 },
  "gpt-4o": { inputPerMillionUsd: 2.5, outputPerMillionUsd: 10 },
  "claude-3-5-haiku": { inputPerMillionUsd: 0.8, outputPerMillionUsd: 4 },
  "claude-3-haiku": { inputPerMillionUsd: 0.25, outputPerMillionUsd: 1.25 },
  "gemini-1.5-flash": { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.3 },
  "grok-2": { inputPerMillionUsd: 2, outputPerMillionUsd: 10 },
};

function getCustomPricing(): Record<string, ModelPricing> {
  const rawPricing = process.env.AI_MODEL_PRICING_JSON;

  if (!rawPricing) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawPricing) as Record<string, ModelPricing>;

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, pricing]) =>
          Number.isFinite(pricing.inputPerMillionUsd) &&
          Number.isFinite(pricing.outputPerMillionUsd),
      ),
    );
  } catch {
    return {};
  }
}

export function getModelPricing(model: string) {
  const normalizedModel = model.toLowerCase();
  const pricing = { ...DEFAULT_MODEL_PRICING, ...getCustomPricing() };
  const exactPricing = pricing[normalizedModel];

  if (exactPricing) {
    return exactPricing;
  }

  return (
    Object.entries(pricing).find(([modelPrefix]) =>
      normalizedModel.startsWith(modelPrefix),
    )?.[1] ?? null
  );
}

export function estimateTextTokens(text: string) {
  if (!text.trim()) {
    return 0;
  }

  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateChatInputTokens(
  systemPrompt: string,
  messages: { content: string }[],
) {
  const messageOverheadTokens = messages.length * 4 + 8;
  return (
    estimateTextTokens(systemPrompt) +
    messages.reduce(
      (total, message) => total + estimateTextTokens(message.content),
      0,
    ) +
    messageOverheadTokens
  );
}

export function calculateAiCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
) {
  const pricing = getModelPricing(model);

  if (!pricing) {
    return 0;
  }

  return (
    (inputTokens * pricing.inputPerMillionUsd +
      outputTokens * pricing.outputPerMillionUsd) /
    1_000_000
  );
}
