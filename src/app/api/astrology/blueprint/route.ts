import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getZodiacSign, zodiacElements, zodiacGlyphs } from "@/lib/astrology";
import { ensureLifeReadingForUser } from "@/lib/ensure-life-reading";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to view your astrology blueprint." }, { status: 401 });
  }

  const profile = await ensureLifeReadingForUser(session.userId);

  if (!profile) {
    return NextResponse.json({ error: "Create your birth profile before requesting an astrology blueprint." }, { status: 404 });
  }

  const dateOfBirth = profile.dob.toISOString().slice(0, 10);
  const sunSign = getZodiacSign(dateOfBirth);
  const element = zodiacElements[sunSign];

  return NextResponse.json({
    blueprint: {
      sunSign,
      glyph: zodiacGlyphs[sunSign],
      element,
      dateOfBirth,
      birthTime: profile.birthTime,
      birthLocation: profile.birthLocation,
      overallReading: {
        en: profile.lifeReadingEn,
        my: profile.lifeReadingMy,
      },
      dailyReading: {
        en: profile.dailyReadingEn,
        my: profile.dailyReadingMy,
      },
      dailyReadingDate: profile.dailyReadingDate?.toISOString() ?? null,
      lifeReadingGeneratedAt: profile.lifeReadingGeneratedAt?.toISOString() ?? null,
    },
  });
}
