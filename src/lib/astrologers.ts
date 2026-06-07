export type AstrologerName = "Sayar Gyi" | "Daw Nilar" | "Min Thet" | "Ko Tar Yar";

export type AstrologerProfile = {
  name: AstrologerName;
  honorific: string;
  tagline: string;
  accent: string;
  glow: string;
  symbol: string;
};

export const astrologers = [
  {
    name: "Sayar Gyi",
    honorific: "Traditional Master",
    tagline: "Ancient Myanmar wisdom with clear timing and grounded answers.",
    accent: "from-amber-300 via-orange-500 to-rose-700",
    glow: "shadow-orange-950/30",
    symbol: "☀️",
  },
  {
    name: "Daw Nilar",
    honorific: "Compassionate Guide",
    tagline: "Gentle readings for love, healing, and emotional clarity.",
    accent: "from-fuchsia-300 via-pink-500 to-purple-800",
    glow: "shadow-fuchsia-950/30",
    symbol: "🌙",
  },
  {
    name: "Min Thet",
    honorific: "Modern Strategist",
    tagline: "Practical star-powered advice for decisions and next steps.",
    accent: "from-cyan-300 via-blue-500 to-indigo-800",
    glow: "shadow-blue-950/30",
    symbol: "✨",
  },
  {
    name: "Ko Tar Yar",
    honorific: "Cosmic Truth-Teller",
    tagline: "Witty, direct insights that cut through confusion with heart.",
    accent: "from-emerald-300 via-teal-500 to-slate-900",
    glow: "shadow-emerald-950/30",
    symbol: "🪐",
  },
] as const satisfies readonly AstrologerProfile[];

export const astrologerByName = astrologers.reduce<Record<string, AstrologerProfile>>((lookup, astrologer) => {
  lookup[astrologer.name] = astrologer;
  return lookup;
}, {});

export function getAstrologerProfile(providerName: string) {
  return astrologerByName[providerName];
}
