import { getZodiacSign, zodiacElements, type ZodiacElement } from "@/lib/astrology";
import { prisma } from "@/lib/prisma";

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
export const DAILY_READING_PROMPT_KEY = "daily-reading";
export const DEFAULT_DAILY_READING_PROMPT = [
  "Create the user's daily astrology reading from their saved birth profile and today's date.",
  "The reading must include: Your today reading of Love, Business, Health; and Dos and Don'ts in all three categories.",
  "Return strict JSON only with keys en and my. Do not include markdown or extra keys.",
  "Each language should be concise, warm, specific, and easy to scan.",
  "Use the exact section labels in English: Love, Business, Health, Dos, Don'ts.",
  "The my value must be a natural Burmese/Myanmar translation of the same reading, not a separate interpretation.",
  "Avoid deterministic promises and avoid medical/legal/financial advice.",
].join("\n");

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

const dailyFallbacks: Record<ZodiacElement, { en: string; my: string }> = {
  Fire: {
    en: "Your today reading of Love, Business, Health\n\nLove: Lead with warmth, but pause before reacting. Business: Choose one bold task and finish it cleanly. Health: Spend your energy in steady bursts, not one big flame.\n\nDos: Love — listen before you defend. Business — act on the clearest priority. Health — hydrate and stretch.\n\nDon'ts: Love — do not turn urgency into drama. Business — do not chase every idea. Health — do not ignore rest signals.",
    my: "ယနေ့ သင့် Love, Business, Health ဟောစာတမ်း\n\nLove: နွေးထွေးစွာ စတင်ပါ၊ သို့သော် တုံ့ပြန်မီ ခဏရပ်စဉ်းစားပါ။ Business: ရဲရင့်သော အလုပ်တစ်ခုကို ရွေးပြီး သေချာပြီးစီးအောင်လုပ်ပါ။ Health: စွမ်းအားကို တစ်ခါတည်းမသုံးဘဲ တည်ငြိမ်စွာ ခွဲဝေသုံးပါ။\n\nDos: Love — ကာကွယ်မပြောခင် နားထောင်ပါ။ Business — အရှင်းဆုံး ဦးစားပေးအလုပ်ကို လုပ်ပါ။ Health — ရေသောက်ပြီး ကိုယ်လက်ဆန့်ပါ။\n\nDon'ts: Love — အလျင်လိုမှုကို ဒရာမာမဖြစ်စေပါနှင့်။ Business — အိုင်ဒီယာတိုင်းနောက် မလိုက်ပါနှင့်။ Health — အနားယူရန် အချက်ပြမှုများကို မလျစ်လျူရှုပါနှင့်။",
  },
  Earth: {
    en: "Your today reading of Love, Business, Health\n\nLove: Small reliable gestures speak louder than big promises. Business: Build from the plan you already trust. Health: Let simple routines make the day feel grounded.\n\nDos: Love — be present and practical. Business — protect your schedule. Health — eat and rest on time.\n\nDon'ts: Love — do not confuse control with care. Business — do not over-polish before sharing. Health — do not carry tension silently.",
    my: "ယနေ့ သင့် Love, Business, Health ဟောစာတမ်း\n\nLove: ကြီးမားသောကတိများထက် ယုံကြည်ရသော သေးငယ်သောလုပ်ရပ်များက ပိုပြောနိုင်သည်။ Business: သင်ယုံကြည်ပြီးသား အစီအစဉ်ပေါ်မှ တည်ဆောက်ပါ။ Health: ရိုးရှင်းသောနေ့စဉ်လုပ်ရိုးလုပ်စဉ်များက သင့်ကို တည်ငြိမ်စေပါစေ။\n\nDos: Love — လက်ရှိအချိန်တွင် ရှိနေပြီး လက်တွေ့ကျပါ။ Business — သင့်အချိန်ဇယားကို ကာကွယ်ပါ။ Health — အချိန်မှန် စားပြီး အနားယူပါ။\n\nDon'ts: Love — ထိန်းချုပ်ခြင်းကို ဂရုစိုက်ခြင်းနှင့် မရောထွေးပါနှင့်။ Business — မမျှဝေခင် အလွန်အမင်း မပြင်ဆင်ပါနှင့်။ Health — ဖိစီးမှုကို တိတ်တိတ်ဆိတ်ဆိတ် မသယ်ဆောင်ပါနှင့်။",
  },
  Air: {
    en: "Your today reading of Love, Business, Health\n\nLove: Say the honest thing gently and leave room for reply. Business: A useful conversation can unlock the next step. Health: Give your mind quiet space between notifications.\n\nDos: Love — ask one better question. Business — write the plan down. Health — breathe before switching tasks.\n\nDon'ts: Love — do not over-explain your feelings. Business — do not scatter your focus. Health — do not let screen noise run the day.",
    my: "ယနေ့ သင့် Love, Business, Health ဟောစာတမ်း\n\nLove: အမှန်တရားကို နူးညံ့စွာပြောပြီး တုံ့ပြန်ရန် နေရာချန်ထားပါ။ Business: အသုံးဝင်သော စကားဝိုင်းတစ်ခုက နောက်တစ်ဆင့်ကို ဖွင့်ပေးနိုင်သည်။ Health: အသိပေးချက်များကြားတွင် သင့်စိတ်အတွက် တိတ်ဆိတ်သောနေရာပေးပါ။\n\nDos: Love — ပိုကောင်းသော မေးခွန်းတစ်ခုမေးပါ။ Business — အစီအစဉ်ကို ချရေးပါ။ Health — အလုပ်ပြောင်းမလုပ်ခင် အသက်ရှူပါ။\n\nDon'ts: Love — ခံစားချက်များကို အလွန်အကျွံ မရှင်းပြပါနှင့်။ Business — အာရုံကို မပြန့်ကျဲစေပါနှင့်။ Health — ဖုန်း/စခရင်အသံများက တစ်နေ့တာကို မထိန်းချုပ်စေပါနှင့်။",
  },
  Water: {
    en: "Your today reading of Love, Business, Health\n\nLove: Trust what you feel, then confirm it with kind words. Business: Work near people and places that feel emotionally clear. Health: Gentle boundaries will protect your energy.\n\nDos: Love — name your need calmly. Business — follow the task with the least emotional fog. Health — choose soothing rituals.\n\nDon'ts: Love — do not absorb everyone else's mood. Business — do not delay because the atmosphere is imperfect. Health — do not skip decompression time.",
    my: "ယနေ့ သင့် Love, Business, Health ဟောစာတမ်း\n\nLove: သင်ခံစားရသည့်အရာကို ယုံကြည်ပြီး နူးညံ့သောစကားများဖြင့် အတည်ပြုပါ။ Business: စိတ်ခံစားမှုရှင်းလင်းသော လူများနှင့်နေရာများအနီးတွင် အလုပ်လုပ်ပါ။ Health: နူးညံ့သော စည်းမျဉ်းများက သင့်စွမ်းအားကို ကာကွယ်ပေးမည်။\n\nDos: Love — သင့်လိုအပ်ချက်ကို အေးဆေးစွာ ပြောပါ။ Business — စိတ်မရှုပ်ထွေးဆုံး အလုပ်ကို လိုက်လုပ်ပါ။ Health — စိတ်အေးစေသော ရိုးရာအလေ့အကျင့်များကို ရွေးပါ။\n\nDon'ts: Love — အခြားသူတိုင်း၏ စိတ်ခံစားချက်ကို မစုပ်ယူပါနှင့်။ Business — ပတ်ဝန်းကျင်မပြည့်စုံလို့ မရွှေ့ဆိုင်းပါနှင့်။ Health — စိတ်ဖြေလျှော့ချိန်ကို မကျော်ပါနှင့်။",
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

function getProfileContext(profile: LifeReadingProfile) {
  const dateOfBirth = profile.dob.toISOString().slice(0, 10);
  const sunSign = getZodiacSign(dateOfBirth);
  const element = zodiacElements[sunSign];

  return { dateOfBirth, sunSign, element };
}

function buildFallbackReading(profile: LifeReadingProfile) {
  const { element } = getProfileContext(profile);
  return elementFallbacks[element];
}

function buildFallbackDailyReading(profile: LifeReadingProfile) {
  const { element } = getProfileContext(profile);
  return dailyFallbacks[element];
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

function normalizeDailyReadingPayload(payload: LifeReadingResponse, profile: LifeReadingProfile) {
  const fallback = buildFallbackDailyReading(profile);
  const en = typeof payload.en === "string" && payload.en.trim() ? clampReading(payload.en) : fallback.en;
  const my = typeof payload.my === "string" && payload.my.trim() ? clampReading(payload.my) : fallback.my;

  return { en, my };
}

function buildLifeReadingPrompt(profile: LifeReadingProfile) {
  const { dateOfBirth, sunSign, element } = getProfileContext(profile);

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

async function getDailyReadingPrompt() {
  const config = await prisma.promptConfig.findUnique({ where: { key: DAILY_READING_PROMPT_KEY } });
  return config?.prompt?.trim() || DEFAULT_DAILY_READING_PROMPT;
}

async function buildDailyReadingPrompt(profile: LifeReadingProfile, today: Date) {
  const { dateOfBirth, sunSign, element } = getProfileContext(profile);
  const adminPrompt = await getDailyReadingPrompt();

  return [
    adminPrompt,
    `Today: ${today.toISOString().slice(0, 10)}`,
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

async function createChatCompletion(userPrompt: string, errorMessage: string) {
  const rawApiKey = process.env.OPENAI_API_KEY;

  if (!rawApiKey || rawApiKey.includes("replace-with")) {
    return null;
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
          content: "You write concise, grounded astrology readings for a bilingual English and Burmese app. Always return valid JSON only.",
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(await readProviderError(response, errorMessage));
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  return typeof content === "string" ? content : null;
}

export async function generateLifeReading(profile: LifeReadingProfile) {
  const content = await createChatCompletion(buildLifeReadingPrompt(profile), "The life reading model returned an error.");

  if (!content) {
    return buildFallbackReading(profile);
  }

  try {
    const parsed = JSON.parse(content) as LifeReadingResponse;
    return normalizeLifeReadingPayload(parsed, profile);
  } catch {
    return buildFallbackReading(profile);
  }
}

export async function generateDailyReading(profile: LifeReadingProfile, today = new Date()) {
  const content = await createChatCompletion(await buildDailyReadingPrompt(profile, today), "The daily reading model returned an error.");

  if (!content) {
    return buildFallbackDailyReading(profile);
  }

  try {
    const parsed = JSON.parse(content) as LifeReadingResponse;
    return normalizeDailyReadingPayload(parsed, profile);
  } catch {
    return buildFallbackDailyReading(profile);
  }
}
