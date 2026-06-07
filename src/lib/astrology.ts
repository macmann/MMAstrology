export type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type ZodiacElement = "Fire" | "Earth" | "Air" | "Water";

type ZodiacBoundary = {
  sign: ZodiacSign;
  starts: [month: number, day: number];
};

const zodiacBoundaries: ZodiacBoundary[] = [
  { sign: "Capricorn", starts: [1, 1] },
  { sign: "Aquarius", starts: [1, 20] },
  { sign: "Pisces", starts: [2, 19] },
  { sign: "Aries", starts: [3, 21] },
  { sign: "Taurus", starts: [4, 20] },
  { sign: "Gemini", starts: [5, 21] },
  { sign: "Cancer", starts: [6, 21] },
  { sign: "Leo", starts: [7, 23] },
  { sign: "Virgo", starts: [8, 23] },
  { sign: "Libra", starts: [9, 23] },
  { sign: "Scorpio", starts: [10, 23] },
  { sign: "Sagittarius", starts: [11, 22] },
  { sign: "Capricorn", starts: [12, 22] },
];

export const zodiacElements: Record<ZodiacSign, ZodiacElement> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};

export const zodiacGlyphs: Record<ZodiacSign, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

function parseStandardDate(dateString: string) {
  const dateOnly = dateString.includes("T") ? dateString.slice(0, 10) : dateString;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return null;
  }

  const date = new Date(`${dateOnly}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateOnly) {
    return null;
  }

  return {
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function getZodiacSign(dateString: string): ZodiacSign {
  const parsedDate = parseStandardDate(dateString);

  if (!parsedDate) {
    throw new Error("getZodiacSign requires a valid date string formatted as YYYY-MM-DD.");
  }

  let sign: ZodiacSign = "Capricorn";

  for (const boundary of zodiacBoundaries) {
    const [month, day] = boundary.starts;

    if (parsedDate.month > month || (parsedDate.month === month && parsedDate.day >= day)) {
      sign = boundary.sign;
    }
  }

  return sign;
}
