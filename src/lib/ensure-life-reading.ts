import { generateLifeReading } from "@/lib/life-reading";
import { prisma } from "@/lib/prisma";

export async function ensureLifeReadingForUser(userId: string) {
  const profile = await prisma.astrologicalProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      dob: true,
      birthTime: true,
      birthLocation: true,
      lifeReadingEn: true,
      lifeReadingMy: true,
      lifeReadingGeneratedAt: true,
    },
  });

  if (!profile || (profile.lifeReadingEn && profile.lifeReadingMy)) {
    return profile;
  }

  const reading = await generateLifeReading(profile);

  return prisma.astrologicalProfile.update({
    where: { id: profile.id },
    data: {
      lifeReadingEn: reading.en,
      lifeReadingMy: reading.my,
      lifeReadingGeneratedAt: new Date(),
    },
  });
}
