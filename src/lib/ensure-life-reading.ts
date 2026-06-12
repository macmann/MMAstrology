import { generateDailyReading, generateLifeReading } from "@/lib/life-reading";
import { prisma } from "@/lib/prisma";

function getUtcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

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
      dailyReadingEn: true,
      dailyReadingMy: true,
      dailyReadingDate: true,
    },
  });

  if (!profile) {
    return profile;
  }

  const today = getUtcDayStart();
  const needsLifeReading = !profile.lifeReadingEn || !profile.lifeReadingMy;
  const needsDailyReading =
    !profile.dailyReadingEn ||
    !profile.dailyReadingMy ||
    !profile.dailyReadingDate ||
    profile.dailyReadingDate.getTime() !== today.getTime();

  if (!needsLifeReading && !needsDailyReading) {
    return profile;
  }

  const [lifeReading, dailyReading] = await Promise.all([
    needsLifeReading ? generateLifeReading(profile) : null,
    needsDailyReading ? generateDailyReading(profile, today) : null,
  ]);

  return prisma.astrologicalProfile.update({
    where: { id: profile.id },
    data: {
      ...(lifeReading
        ? {
            lifeReadingEn: lifeReading.en,
            lifeReadingMy: lifeReading.my,
            lifeReadingGeneratedAt: new Date(),
          }
        : {}),
      ...(dailyReading
        ? {
            dailyReadingEn: dailyReading.en,
            dailyReadingMy: dailyReading.my,
            dailyReadingDate: today,
          }
        : {}),
    },
  });
}
