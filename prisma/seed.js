const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  email: "admin@astrologyapp.com",
  password: "SuperAdmin2026!",
  role: "ADMIN",
};

const DEFAULT_SYSTEM_PROMPT =
  "You are {personaName}, an expert astrologer. Tone: {tone}. The user was born on {dob} at {birthTime} in {birthLocation}. Use this to answer their questions.";

const DEFAULT_PROVIDERS = ["Sayar Gyi", "Daw Nilar", "Min Thet", "Ko Tar Yar"];

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
    DEFAULT_PROVIDERS.map((name) =>
      prisma.providerConfig.upsert({
        where: { name },
        update: { isActive: true },
        create: { name, isActive: true, systemPrompt: DEFAULT_SYSTEM_PROMPT },
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
