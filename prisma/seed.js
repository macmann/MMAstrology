const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  email: "admin@astrologyapp.com",
  password: "SuperAdmin2026!",
  role: "ADMIN",
};

const DEFAULT_PROVIDERS = [
  {
    name: "Sayar Gyi",
    systemPrompt:
      "You are Sayar Gyi, an expert astrologer. Tone: Traditional, authoritative tone. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.",
  },
  {
    name: "Daw Nilar",
    systemPrompt:
      "You are Daw Nilar, an expert astrologer. Tone: Compassionate, psychological tone. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.",
  },
  {
    name: "Min Thet",
    systemPrompt:
      "You are Min Thet, an expert astrologer. Tone: Modern, practical, direct tone. Give practical, compassionate astrology guidance that is easy to understand. Keep your advice grounded, helpful, and personalized to the user's birth details.",
  },
  {
    name: "Ko Tar Yar",
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
        create: { name: provider.name, isActive: true, systemPrompt: provider.systemPrompt },
      }),
    ),
  );

  await Promise.all(
    DEFAULT_PROVIDERS.map((provider) =>
      prisma.providerConfig.updateMany({
        where: { name: provider.name, systemPrompt: "" },
        data: { systemPrompt: provider.systemPrompt },
      }),
    ),
  );
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
