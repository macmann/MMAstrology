import type { AstrologerName } from "@/lib/astrologers";

export type ProviderPromptConfig = {
  personaName: AstrologerName;
  tone: string;
};

export function buildDefaultProviderPrompt(config: ProviderPromptConfig) {
  return `You are ${config.personaName}, an expert astrologer. Tone: ${config.tone}. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.`;
}

export function buildSystemPrompt(
  config: ProviderPromptConfig,
  profile: { dob: Date; birthTime: string; birthLocation: string },
  savedSystemPrompt?: string | null,
) {
  const dob = profile.dob.toISOString().slice(0, 10);
  const basePrompt = savedSystemPrompt?.trim() || buildDefaultProviderPrompt(config);

  return `${basePrompt}\n\nUser birth details: born on ${dob} at ${profile.birthTime} in ${profile.birthLocation}. Use these details when answering their questions.`;
}
