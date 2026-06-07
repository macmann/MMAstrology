import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getZodiacSign, zodiacElements, zodiacGlyphs, type ZodiacElement } from "@/lib/astrology";
import { prisma } from "@/lib/prisma";

const elementSummaries: Record<ZodiacElement, string> = {
  Fire:
    "Your profile carries a Fire signature: instinctive, bright, and built for momentum. When your attention locks onto a worthy challenge, confidence rises quickly and helps you lead from courage rather than hesitation. The work is to pace the flame so inspiration becomes durable action instead of a flash of urgency.",
  Earth:
    "Your profile carries an Earth signature: composed, practical, and tuned to what can be built over time. You tend to understand energy through evidence, rhythm, and tangible commitments. The work is to let steadiness remain alive and responsive, so discipline supports pleasure rather than becoming pressure.",
  Air:
    "Your profile carries an Air signature: observant, connective, and charged by ideas. You often locate meaning by naming patterns, asking better questions, and bringing fresh perspective into stale rooms. The work is to give your mind enough stillness that insight can land in the body and become a clear choice.",
  Water:
    "Your profile carries a Water signature: intuitive, emotionally precise, and highly responsive to subtle shifts. You may read atmosphere before facts are spoken, which gives your choices unusual depth. The work is to protect your sensitivity with boundaries, turning empathy into wisdom instead of overextension.",
};

const dailyGuidanceMessages = [
  "Today favors quiet calibration: treat every conversation as a transit across your inner sky, and notice which commitments feel expansive rather than merely urgent.",
  "The day asks for cleaner energetic boundaries. Let your plans orbit one essential priority, then allow smaller tasks to fall into place around it.",
  "A reflective lunar tone makes this a strong day for revision, forgiveness, and subtle course correction. Choose the response that keeps your nervous system spacious.",
  "Momentum gathers through precision today. Name the next right step, honor the timing already recorded in your birth profile, and move without overexplaining your intuition.",
  "The current cosmic weather supports brave simplicity: edit away excess noise, return to your core values, and let one honest action become the offering.",
  "A social and mental current is active today, making it useful to share the thought you have been refining privately. Connection may become the missing catalyst.",
  "Today highlights restoration and embodiment. Let your location, environment, and daily rituals become part of the reading rather than background details.",
];

function buildAlignmentAdvice(element: ZodiacElement, birthTime: string, birthLocation: string) {
  const location = birthLocation || "your recorded birthplace";
  const time = birthTime || "your recorded birth time";

  const elementAdvice: Record<ZodiacElement, string> = {
    Fire: "Channel passion into one decisive action before seeking another sign of permission.",
    Earth: "Ground the day in a practical ritual that proves your intentions have a place to live.",
    Air: "Write the pattern down, then choose the clearest conversation or decision it points toward.",
    Water: "Let emotional information guide you, but confirm it with a boundary that keeps you centered.",
  };

  return `${elementAdvice[element]} Because your profile is anchored to ${time} in ${location}, notice how the day changes when you treat timing and place as sacred context rather than incidental details.`;
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "You must be logged in to view your astrology blueprint." }, { status: 401 });
  }

  const profile = await prisma.astrologicalProfile.findUnique({
    where: { userId: session.userId },
    select: {
      dob: true,
      birthTime: true,
      birthLocation: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Create your birth profile before requesting an astrology blueprint." }, { status: 404 });
  }

  const dateOfBirth = profile.dob.toISOString().slice(0, 10);
  const sunSign = getZodiacSign(dateOfBirth);
  const element = zodiacElements[sunSign];
  const dayIndex = new Date().getUTCDay();

  return NextResponse.json({
    blueprint: {
      sunSign,
      glyph: zodiacGlyphs[sunSign],
      element,
      dateOfBirth,
      birthTime: profile.birthTime,
      birthLocation: profile.birthLocation,
      overview: elementSummaries[element],
      dailyGuidance: dailyGuidanceMessages[dayIndex],
      alignmentAdvice: buildAlignmentAdvice(element, profile.birthTime, profile.birthLocation),
    },
  });
}
