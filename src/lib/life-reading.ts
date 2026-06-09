import { getZodiacSign, zodiacElements, type ZodiacElement } from "@/lib/astrology";

export type LifeReadingProfile = {
  dob: Date;
  birthTime: string;
  birthLocation: string;
};

type LifeReadingResponse = {
  en?: unknown;
  my?: unknown;
};

const LIFE_READING_MODEL_ENV_KEY = "lifereadingmodel";
const DEFAULT_LIFE_READING_MODEL = "gpt-5.5";
const MAX_READING_LENGTH = 2400;

const elementFallbacks: Record<ZodiacElement, { en: string; my: string }> = {
  Fire: {
    en: "Your profile carries a Fire signature: instinctive, bright, and built for momentum. Your birth context points to someone who grows when courage is paired with timing, and when enthusiasm is given a clear place to land. You are here to move first when the path is honest, but your best results come when you pace the flame and turn inspiration into steady action.",
    my: "သင့်ပရိုဖိုင်တွင် မီးဓာတ်သဘောထား ပါဝင်နေပြီး စိတ်အားထက်သန်မှု၊ သတ္တိနှင့် လှုပ်ရှားနိုင်စွမ်းကို ဖော်ပြနေသည်။ သင့်မွေးဖွားမှုအချက်အလက်များအရ သင်သည် သတ္တိကို အချိန်ကိုက်မှုနှင့် တွဲဖက်အသုံးပြုသောအခါ ပိုမိုတိုးတက်နိုင်သူဖြစ်သည်။ စိတ်ကူးဉာဏ်ကို ခဏတာတောက်ပမှုအဖြစ်မထားဘဲ တည်ငြိမ်သောလုပ်ဆောင်ချက်အဖြစ် ပြောင်းနိုင်ခြင်းသည် သင့်အဓိကအားသာချက်ဖြစ်သည်။",
  },
  Earth: {
    en: "Your profile carries an Earth signature: composed, practical, and tuned to what can be built over time. Your birth context points to someone who understands life through evidence, rhythm, and tangible commitments. You are here to make meaning durable, but your best results come when steadiness stays alive, flexible, and connected to pleasure rather than pressure.",
    my: "သင့်ပရိုဖိုင်တွင် မြေဓာတ်သဘောထား ပါဝင်နေပြီး တည်ငြိမ်မှု၊ လက်တွေ့ကျမှုနှင့် ရေရှည်တည်ဆောက်နိုင်စွမ်းကို ဖော်ပြနေသည်။ သင့်မွေးဖွားမှုအချက်အလက်များအရ သင်သည် အထောက်အထား၊ စည်းချက်နှင့် တာဝန်ယူမှုများမှတစ်ဆင့် ဘဝကို နားလည်တတ်သူဖြစ်သည်။ တည်ငြိမ်မှုကို ဖိအားမဖြစ်စေဘဲ ပျော်ရွှင်မှုနှင့် ပြောင်းလွယ်ပြင်လွယ်ဖြစ်စေသောအခါ သင့်အလင်းရောင် ပိုတောက်ပသည်။",
  },
  Air: {
    en: "Your profile carries an Air signature: observant, connective, and charged by ideas. Your birth context points to someone who finds meaning by naming patterns, asking better questions, and bringing fresh perspective into stale rooms. You are here to translate insight into choice, but your best results come when the mind has enough stillness for truth to land in the body.",
    my: "သင့်ပရိုဖိုင်တွင် လေဓာတ်သဘောထား ပါဝင်နေပြီး သတိထားကြည့်ရှုနိုင်မှု၊ ချိတ်ဆက်နိုင်မှုနှင့် အတွေးအမြင်အားကောင်းမှုကို ဖော်ပြနေသည်။ သင့်မွေးဖွားမှုအချက်အလက်များအရ သင်သည် ပုံစံများကို နာမည်ပေးခြင်း၊ ပိုကောင်းသောမေးခွန်းများမေးခြင်းနှင့် အမြင်သစ်များယူဆောင်လာခြင်းဖြင့် အဓိပ္ပါယ်ကို ရှာဖွေနိုင်သူဖြစ်သည်။ အတွေးများကို ရွေးချယ်မှုအဖြစ် ပြောင်းနိုင်ရန် စိတ်တည်ငြိမ်မှုကိုလည်း ဦးစားပေးပါ။",
  },
  Water: {
    en: "Your profile carries a Water signature: intuitive, emotionally precise, and responsive to subtle shifts. Your birth context points to someone who often reads the atmosphere before facts are spoken, which gives your choices unusual depth. You are here to honor sensitivity as wisdom, but your best results come when empathy is protected by clear boundaries.",
    my: "သင့်ပရိုဖိုင်တွင် ရေဓာတ်သဘောထား ပါဝင်နေပြီး အတွင်းခံစားချက်ကောင်းမှု၊ စိတ်ခံစားမှုကို တိကျစွာသိနိုင်မှုနှင့် နူးညံ့သောအပြောင်းအလဲများကို ခံစားနိုင်မှုကို ဖော်ပြနေသည်။ သင့်မွေးဖွားမှုအချက်အလက်များအရ သင်သည် အချက်အလက်မပြောမီ ပတ်ဝန်းကျင်လေထုကို ဖတ်ရှုတတ်သူဖြစ်သည်။ စာနာမှုကို ဉာဏ်ပညာအဖြစ် သုံးနိုင်ရန် သင့်နယ်နိမိတ်များကို ရှင်းလင်းစွာထားပါ။",
  },
};

function normalizeApiKey(rawApiKey: string) {
  let apiKey = rawApiKey.trim();

  if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
    apiKey = apiKey.slice(1, -1).trim();
  }

  if (apiKey.toLowerCase().startsWith("bearer ")) {
    apiKey = apiKey.slice("bearer ".length).trim();
  }

  if (apiKey.toLowerCase().startsWith("authorization: bearer ")) {
    apiKey = apiKey.slice("authorization: bearer ".length).trim();
  }

  return apiKey;
}

function assertHeaderSafeApiKey(apiKey: string) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is empty after trimming whitespace.");
  }

  if (/[\r\n]/.test(apiKey)) {
    throw new Error("OPENAI_API_KEY contains line breaks. Paste only the raw API key value without newlines.");
  }
}

function getLifeReadingModel() {
  return process.env[LIFE_READING_MODEL_ENV_KEY] ?? DEFAULT_LIFE_READING_MODEL;
}

function buildFallbackReading(profile: LifeReadingProfile) {
  const dateOfBirth = profile.dob.toISOString().slice(0, 10);
  const sunSign = getZodiacSign(dateOfBirth);
  const element = zodiacElements[sunSign];

  return elementFallbacks[element];
}

function clampReading(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= MAX_READING_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MAX_READING_LENGTH).trim()}…`;
}

function normalizeLifeReadingPayload(payload: LifeReadingResponse, profile: LifeReadingProfile) {
  const fallback = buildFallbackReading(profile);
  const en = typeof payload.en === "string" && payload.en.trim() ? clampReading(payload.en) : fallback.en;
  const my = typeof payload.my === "string" && payload.my.trim() ? clampReading(payload.my) : fallback.my;

  return { en, my };
}

function buildLifeReadingPrompt(profile: LifeReadingProfile) {
  const dateOfBirth = profile.dob.toISOString().slice(0, 10);
  const sunSign = getZodiacSign(dateOfBirth);
  const element = zodiacElements[sunSign];

  return [
    "Create a one-time overall astrology life reading for this person using their saved birth profile.",
    "Return strict JSON only with keys en and my. Do not include markdown or extra keys.",
    "The en value must be warm, specific, non-confusing English, 160-220 words.",
    "The my value must be a natural Burmese/Myanmar translation of the same reading, not a separate interpretation.",
    "Avoid deterministic promises, medical/legal/financial advice, and daily predictions.",
    `Date of birth: ${dateOfBirth}`,
    `Birth time: ${profile.birthTime}`,
    `Birth location: ${profile.birthLocation}`,
    `Primary sun sign: ${sunSign}`,
    `Element: ${element}`,
  ].join("\n");
}

async function readProviderError(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    const message = data?.error?.message ?? data?.error;

    return typeof message === "string" ? message : fallbackMessage;
  }

  const text = await response.text().catch(() => "");

  return text.trim() || fallbackMessage;
}

export async function generateLifeReading(profile: LifeReadingProfile) {
  const rawApiKey = process.env.OPENAI_API_KEY;

  if (!rawApiKey || rawApiKey.includes("replace-with")) {
    return buildFallbackReading(profile);
  }

  const apiKey = normalizeApiKey(rawApiKey);
  assertHeaderSafeApiKey(apiKey);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getLifeReadingModel(),
      messages: [
        {
          role: "system",
          content:
            "You write concise, grounded astrology readings for a bilingual English and Burmese app. Always return valid JSON only.",
        },
        { role: "user", content: buildLifeReadingPrompt(profile) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response, "The life reading model returned an error."));
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return buildFallbackReading(profile);
  }

  try {
    const parsed = JSON.parse(content) as LifeReadingResponse;

    return normalizeLifeReadingPayload(parsed, profile);
  } catch {
    return buildFallbackReading(profile);
  }
}
