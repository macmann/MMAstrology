const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  email: "admin@astrologyapp.com",
  password: "SuperAdmin2026!",
  role: "ADMIN",
};

const CHAT_HISTORY_CONTEXT_PROMPT_KEY = "chat-history-context-enabled";
const DAILY_FREE_CREDIT_ALLOWANCE_KEY = "daily-free-credit-allowance";
const DEFAULT_DAILY_FREE_CREDIT_ALLOWANCE = 4;

const DEFAULT_DAILY_READING_PROMPT = [
  "Create the user's daily astrology reading from their saved birth profile and today's date.",
  "The reading must include these five standalone sections in both languages: Love, Business, Health, Dos, and Don'ts.",
  "Return strict JSON only with keys en and my. Do not include markdown or extra keys.",
  "Each language should be concise, warm, specific, and easy to scan.",
  "For en, use the exact section labels: Love, Business, Health, Dos, Don'ts. For my, localize those labels as: အချစ်ရေး, စီးပွားရေး, ကျန်းမာရေး, လုပ်သင့်သည်များ, မလုပ်သင့်သည်များ. Keep Dos and Don'ts as standalone general guidance; do not prefix them with Love, Business, or Health.",
  "The my value must be a natural Burmese/Myanmar translation of the same reading, not a separate interpretation.",
  "Avoid deterministic promises and avoid medical/legal/financial advice.",
].join("\n");

const DEFAULT_PROVIDERS = [
  {
    name: "Sayar Gyi",
    aiProvider: "OPENAI",
    aiModel: "gpt-4o-mini",
    displayName: "Sayar Gyi",
    description: "Ancient Myanmar wisdom with clear timing and grounded answers.",
    systemPrompt:
      "You are Sayar Gyi, an expert astrologer. Tone: Traditional, authoritative tone. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.",
  },
  {
    name: "Daw Nilar",
    aiProvider: "ANTHROPIC",
    aiModel: "claude-3-5-haiku-latest",
    displayName: "Daw Nilar",
    description: "Gentle readings for love, healing, and emotional clarity.",
    systemPrompt:
      "You are Daw Nilar, an expert astrologer. Tone: Compassionate, psychological tone. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.",
  },
  {
    name: "Min Thet",
    aiProvider: "GOOGLE",
    aiModel: "gemini-1.5-flash",
    displayName: "Min Thet",
    description: "Practical star-powered advice for decisions and next steps.",
    systemPrompt:
      "You are Min Thet, an expert astrologer. Tone: Modern, practical, direct tone. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.",
  },
  {
    name: "Ko Tar Yar",
    aiProvider: "XAI",
    aiModel: "grok-2-latest",
    displayName: "Ko Tar Yar",
    description: "Witty, direct insights that cut through confusion with heart.",
    systemPrompt:
      "You are Ko Tar Yar, an expert astrologer. Tone: Witty, slightly cynical, but insightful tone. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.",
  },
];

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

    await prisma.user.create({
      data: {
        email: DEFAULT_ADMIN.email,
        passwordHash,
        role: DEFAULT_ADMIN.role,
      },
    });
  }

  await Promise.all(
    DEFAULT_PROVIDERS.map((provider) =>
      prisma.providerConfig.upsert({
        where: { name: provider.name },
        update: {},
        create: {
          name: provider.name,
          displayName: provider.displayName,
          description: provider.description,
          isActive: true,
          aiProvider: provider.aiProvider,
          aiModel: provider.aiModel,
          systemPrompt: provider.systemPrompt,
        },
      }),
    ),
  );

  await Promise.all(
    DEFAULT_PROVIDERS.flatMap((provider) => [
      prisma.providerConfig.updateMany({
        where: { name: provider.name, displayName: "" },
        data: { displayName: provider.displayName },
      }),
      prisma.providerConfig.updateMany({
        where: { name: provider.name, description: "" },
        data: { description: provider.description },
      }),
      prisma.providerConfig.updateMany({
        where: { name: provider.name, systemPrompt: "" },
        data: { systemPrompt: provider.systemPrompt },
      }),
    ]),
  );

  await prisma.promptConfig.upsert({
    where: { key: "daily-reading" },
    update: {},
    create: { key: "daily-reading", prompt: DEFAULT_DAILY_READING_PROMPT },
  });

  await prisma.promptConfig.upsert({
    where: { key: CHAT_HISTORY_CONTEXT_PROMPT_KEY },
    update: {},
    create: { key: CHAT_HISTORY_CONTEXT_PROMPT_KEY, prompt: "true" },
  });

  await prisma.promptConfig.upsert({
    where: { key: DAILY_FREE_CREDIT_ALLOWANCE_KEY },
    update: {},
    create: {
      key: DAILY_FREE_CREDIT_ALLOWANCE_KEY,
      prompt: String(DEFAULT_DAILY_FREE_CREDIT_ALLOWANCE),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
