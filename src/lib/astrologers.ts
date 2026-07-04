export type AstrologerProfile = {
  providerName: string;
  name: string;
  honorific: string;
  tagline: string;
  accent: string;
  glow: string;
  symbol: string;
  isProProvider?: boolean;
  isLocked?: boolean;
};

type ProviderDisplayConfig = {
  name: string;
  displayName?: string | null;
  description?: string | null;
  isProProvider?: boolean;
};

const visualPresets = [
  { honorific: "Traditional Master", accent: "from-amber-300 via-orange-500 to-rose-700", glow: "shadow-orange-950/30", symbol: "☀️" },
  { honorific: "Compassionate Guide", accent: "from-fuchsia-300 via-pink-500 to-purple-800", glow: "shadow-fuchsia-950/30", symbol: "🌙" },
  { honorific: "Modern Strategist", accent: "from-cyan-300 via-blue-500 to-indigo-800", glow: "shadow-blue-950/30", symbol: "✨" },
  { honorific: "Cosmic Truth-Teller", accent: "from-emerald-300 via-teal-500 to-slate-900", glow: "shadow-emerald-950/30", symbol: "🪐" },
] as const;

const namedPresets: Record<string, (typeof visualPresets)[number] & { tagline: string }> = {
  "Sayar Gyi": { ...visualPresets[0], tagline: "Ancient Myanmar wisdom with clear timing and grounded answers." },
  "Daw Nilar": { ...visualPresets[1], tagline: "Gentle readings for love, healing, and emotional clarity." },
  "Min Thet": { ...visualPresets[2], tagline: "Practical star-powered advice for decisions and next steps." },
  "Ko Tar Yar": { ...visualPresets[3], tagline: "Witty, direct insights that cut through confusion with heart." },
};

function getPreset(providerName: string) {
  const charTotal = [...providerName].reduce((total, char) => total + char.charCodeAt(0), 0);
  return namedPresets[providerName] ?? {
    ...visualPresets[charTotal % visualPresets.length],
    tagline: "Specialized astrology guidance configured by the admin team.",
  };
}

export function mergeAstrologerDisplayConfig(provider: ProviderDisplayConfig, isLocked = false) {
  const preset = getPreset(provider.name);
  const displayName = provider.displayName?.trim();
  const description = provider.description?.trim();

  return {
    providerName: provider.name,
    name: displayName || provider.name,
    honorific: provider.isProProvider ? "Pro Provider" : preset.honorific,
    tagline: description || preset.tagline,
    accent: preset.accent,
    glow: preset.glow,
    symbol: preset.symbol,
    isProProvider: Boolean(provider.isProProvider),
    isLocked,
  } satisfies AstrologerProfile;
}


export function getAstrologerProfile(providerName: string) {
  const preset = getPreset(providerName);

  return {
    providerName,
    name: providerName,
    honorific: preset.honorific,
    tagline: preset.tagline,
    accent: preset.accent,
    glow: preset.glow,
    symbol: preset.symbol,
  } satisfies AstrologerProfile;
}
