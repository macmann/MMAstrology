"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "my";

type LocalizationContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LANGUAGE_STORAGE_KEY = "mma-language";

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "my", label: "မြန်မာ" },
] as const satisfies readonly { value: Language; label: string }[];

const translations = {
  en: {
    "nav.home": "Home",
    "nav.readings": "Readings",
    "nav.profile": "Profile",
    "nav.history": "History",
    "common.loading": "Loading...",
    "common.you": "You",
    "common.delete": "Delete",
    "common.deleting": "Deleting…",
    "common.added": "Added",
    "profile.eyebrow": "Profile",
    "profile.title": "Your cosmic account",
    "profile.subtitle": "Manage your name, password, birth profile, language, and credit balance from one place.",
    "profile.account": "account",
    "profile.credits": "credits",
    "profile.signedInAs": "Signed in as",
    "profile.languageEyebrow": "Language",
    "profile.languageTitle": "App language",
    "profile.languageDescription": "Choose the language used for app navigation and account screens.",
    "profile.languageSaved": "Language changed to {language}.",
    "profile.accountDetails": "Account details",
    "profile.nameBirthTitle": "Name & birth profile",
    "profile.accountDescription": "Update the name shown in your profile and your saved natal information.",
    "profile.name": "Name",
    "profile.namePlaceholder": "Your name",
    "profile.dob": "Date of birth",
    "profile.birthTime": "Birth time",
    "profile.birthLocation": "Birth location",
    "profile.birthLocationPlaceholder": "City, state or country",
    "profile.savingChanges": "Saving changes...",
    "profile.saveProfile": "Save profile",
    "profile.current": "Profile is current",
    "profile.updated": "Profile updated successfully.",
    "profile.passwordMismatch": "New password and confirmation must match.",
    "profile.passwordUpdated": "Password updated successfully.",
    "profile.security": "Security",
    "profile.changePassword": "Change password",
    "profile.changePasswordDescription": "Confirm your current password before saving a new one.",
    "profile.currentPassword": "Current password",
    "profile.newPassword": "New password",
    "profile.confirmPassword": "Confirm new password",
    "profile.updatingPassword": "Updating password...",
    "profile.updatePassword": "Update password",
    "profile.creditBalance": "Credit balance",
    "profile.ready": "Ready for this session.",
    "profile.daily": "Daily",
    "profile.free": "Free",
    "profile.purchased": "Purchased",
    "profile.creditsWord": "credits",
    "profile.transactionLedger": "Transaction ledger",
    "profile.creditAdditions": "Credit additions",
    "profile.logs": "{count} logs",
    "profile.loadingLedger": "Loading ledger...",
    "profile.purchasedCredits": "+{amount} purchased credits",
    "profile.noLedger": "No purchased-credit additions have been recorded yet.",
    "readings.eyebrow": "Automated Readings",
    "readings.title": "Your cosmic blueprint",
    "readings.subtitle": "A personalized static overview generated from your saved birth profile and classic Western sun-sign math.",
    "readings.unavailable": "Reading unavailable",
    "readings.openError": "We could not open your blueprint.",
    "readings.loadError": "Unable to load your automated reading.",
    "readings.reviewProfile": "Review birth profile",
    "readings.primarySunSign": "Primary Sun Sign",
    "readings.elementLabel": "{element} element",
    "readings.birthDate": "Birth date",
    "readings.birthTime": "Birth time",
    "readings.location": "Location",
    "readings.coreStrengths": "Core strengths",
    "readings.elementExpression": "{element} expression",
    "readings.dailyInfluences": "Daily influences",
    "readings.cosmicWeather": "Cosmic weather",
    "readings.alignmentAdvice": "Alignment advice",
    "readings.useBirthContext": "Use your birth context",
    "readings.sign.Aries": "Aries",
    "readings.sign.Taurus": "Taurus",
    "readings.sign.Gemini": "Gemini",
    "readings.sign.Cancer": "Cancer",
    "readings.sign.Leo": "Leo",
    "readings.sign.Virgo": "Virgo",
    "readings.sign.Libra": "Libra",
    "readings.sign.Scorpio": "Scorpio",
    "readings.sign.Sagittarius": "Sagittarius",
    "readings.sign.Capricorn": "Capricorn",
    "readings.sign.Aquarius": "Aquarius",
    "readings.sign.Pisces": "Pisces",
    "readings.element.Fire": "Fire",
    "readings.element.Earth": "Earth",
    "readings.element.Air": "Air",
    "readings.element.Water": "Water",
    "readings.overview.Fire": "Your profile carries a Fire signature: instinctive, bright, and built for momentum. When your attention locks onto a worthy challenge, confidence rises quickly and helps you lead from courage rather than hesitation. The work is to pace the flame so inspiration becomes durable action instead of a flash of urgency.",
    "readings.overview.Earth": "Your profile carries an Earth signature: composed, practical, and tuned to what can be built over time. You tend to understand energy through evidence, rhythm, and tangible commitments. The work is to let steadiness remain alive and responsive, so discipline supports pleasure rather than becoming pressure.",
    "readings.overview.Air": "Your profile carries an Air signature: observant, connective, and charged by ideas. You often locate meaning by naming patterns, asking better questions, and bringing fresh perspective into stale rooms. The work is to give your mind enough stillness that insight can land in the body and become a clear choice.",
    "readings.overview.Water": "Your profile carries a Water signature: intuitive, emotionally precise, and highly responsive to subtle shifts. You may read atmosphere before facts are spoken, which gives your choices unusual depth. The work is to protect your sensitivity with boundaries, turning empathy into wisdom instead of overextension.",
    "readings.daily.0": "Today favors quiet calibration: treat every conversation as a transit across your inner sky, and notice which commitments feel expansive rather than merely urgent.",
    "readings.daily.1": "The day asks for cleaner energetic boundaries. Let your plans orbit one essential priority, then allow smaller tasks to fall into place around it.",
    "readings.daily.2": "A reflective lunar tone makes this a strong day for revision, forgiveness, and subtle course correction. Choose the response that keeps your nervous system spacious.",
    "readings.daily.3": "Momentum gathers through precision today. Name the next right step, honor the timing already recorded in your birth profile, and move without overexplaining your intuition.",
    "readings.daily.4": "The current cosmic weather supports brave simplicity: edit away excess noise, return to your core values, and let one honest action become the offering.",
    "readings.daily.5": "A social and mental current is active today, making it useful to share the thought you have been refining privately. Connection may become the missing catalyst.",
    "readings.daily.6": "Today highlights restoration and embodiment. Let your location, environment, and daily rituals become part of the reading rather than background details.",
    "readings.alignment.Fire": "Channel passion into one decisive action before seeking another sign of permission. Because your profile is anchored to {birthTime} in {birthLocation}, notice how the day changes when you treat timing and place as sacred context rather than incidental details.",
    "readings.alignment.Earth": "Ground the day in a practical ritual that proves your intentions have a place to live. Because your profile is anchored to {birthTime} in {birthLocation}, notice how the day changes when you treat timing and place as sacred context rather than incidental details.",
    "readings.alignment.Air": "Write the pattern down, then choose the clearest conversation or decision it points toward. Because your profile is anchored to {birthTime} in {birthLocation}, notice how the day changes when you treat timing and place as sacred context rather than incidental details.",
    "readings.alignment.Water": "Let emotional information guide you, but confirm it with a boundary that keeps you centered. Because your profile is anchored to {birthTime} in {birthLocation}, notice how the day changes when you treat timing and place as sacred context rather than incidental details.",
    "readings.recordedBirthplace": "your recorded birthplace",
    "readings.recordedBirthTime": "your recorded birth time",
    "dashboard.openProfile": "Open your profile",
    "dashboard.title": "Choose your cosmic guide",
    "dashboard.welcome": "Welcome back, {name}. Start a personalized consultation based on your birth profile. Manage credits and account settings in your profile.",
    "dashboard.available": "Available now",
    "dashboard.astrologers": "Astrologers",
    "dashboard.creditPerMessage": "1 credit / msg",
    "dashboard.none": "No astrologers are available right now. Please check back soon.",
    "dashboard.chat": "Chat",
    "chat.back": "← Dashboard",
    "chat.credits": "Credits",
    "chat.limit": "Daily limit reached. Resets at midnight. Contact Admin to Top Up.",
    "chat.loadError": "Could not load this conversation.",
    "chat.refreshError": "Could not load this conversation. Please refresh and try again.",
    "chat.requestFailed": "The chat request failed.",
    "chat.streamFailed": "The chat response could not be streamed.",
    "chat.emptyAnswer": "I could not read a clear answer this time.",
    "chat.loading": "Loading your conversation…",
    "chat.startTitle": "Start your consultation",
    "chat.startText": "Ask {providerName} about love, career, timing, or your current cosmic pattern.",
    "chat.notSent": "Not sent",
    "chat.messageLabel": "Message",
    "chat.placeholder": "Message {providerName}…",
    "chat.reading": "Reading…",
    "chat.send": "Send",
    "chat.hint": "Press Enter to send, Shift + Enter for a new line. Each sent message costs 1 credit.",
    "chat.thinkingStars": "{providerName} is reading the stars…",
    "chat.thinkingCharts": "{providerName} is looking at the charts…",
    "chat.thinking": "{providerName} is thinking…",
  },
  my: {
    "nav.home": "ပင်မ",
    "nav.readings": "ဟောစာတမ်း",
    "nav.profile": "ပရိုဖိုင်",
    "nav.history": "မှတ်တမ်း",
    "common.loading": "ဖွင့်နေသည်...",
    "common.you": "သင်",
    "common.delete": "ဖျက်မည်",
    "common.deleting": "ဖျက်နေသည်…",
    "common.added": "ထည့်ပြီး",
    "profile.eyebrow": "ပရိုဖိုင်",
    "profile.title": "သင်၏ နက္ခတ်အကောင့်",
    "profile.subtitle": "အမည်၊ စကားဝှက်၊ မွေးဖွားမှုအချက်အလက်၊ ဘာသာစကားနှင့် ခရက်ဒစ်များကို တစ်နေရာတည်းတွင် စီမံပါ။",
    "profile.account": "အကောင့်",
    "profile.credits": "ခရက်ဒစ်",
    "profile.signedInAs": "ဝင်ရောက်ထားသော အကောင့်",
    "profile.languageEyebrow": "ဘာသာစကား",
    "profile.languageTitle": "အက်ပ်ဘာသာစကား",
    "profile.languageDescription": "အက်ပ်မီနူးများနှင့် အကောင့်စာမျက်နှာများတွင် အသုံးပြုမည့် ဘာသာစကားကို ရွေးပါ။",
    "profile.languageSaved": "ဘာသာစကားကို {language} သို့ ပြောင်းပြီးပါပြီ။",
    "profile.accountDetails": "အကောင့်အသေးစိတ်",
    "profile.nameBirthTitle": "အမည်နှင့် မွေးဖွားမှု ပရိုဖိုင်",
    "profile.accountDescription": "ပရိုဖိုင်တွင် ပြသမည့် အမည်နှင့် သိမ်းထားသော မွေးဖွားမှုအချက်အလက်များကို ပြင်ဆင်ပါ။",
    "profile.name": "အမည်",
    "profile.namePlaceholder": "သင့်အမည်",
    "profile.dob": "မွေးနေ့",
    "profile.birthTime": "မွေးချိန်",
    "profile.birthLocation": "မွေးရပ်ဒေသ",
    "profile.birthLocationPlaceholder": "မြို့၊ ပြည်နယ် သို့မဟုတ် နိုင်ငံ",
    "profile.savingChanges": "ပြောင်းလဲမှုများ သိမ်းနေသည်...",
    "profile.saveProfile": "ပရိုဖိုင် သိမ်းမည်",
    "profile.current": "ပရိုဖိုင်သည် နောက်ဆုံးဖြစ်သည်",
    "profile.updated": "ပရိုဖိုင်ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။",
    "profile.passwordMismatch": "စကားဝှက်အသစ်နှင့် အတည်ပြုစကားဝှက် ကိုက်ညီရပါမည်။",
    "profile.passwordUpdated": "စကားဝှက်ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။",
    "profile.security": "လုံခြုံရေး",
    "profile.changePassword": "စကားဝှက်ပြောင်းမည်",
    "profile.changePasswordDescription": "စကားဝှက်အသစ် မသိမ်းမီ လက်ရှိစကားဝှက်ကို အတည်ပြုပါ။",
    "profile.currentPassword": "လက်ရှိ စကားဝှက်",
    "profile.newPassword": "စကားဝှက် အသစ်",
    "profile.confirmPassword": "စကားဝှက်အသစ် အတည်ပြုရန်",
    "profile.updatingPassword": "စကားဝှက် ပြင်ဆင်နေသည်...",
    "profile.updatePassword": "စကားဝှက် ပြင်ဆင်မည်",
    "profile.creditBalance": "ခရက်ဒစ် လက်ကျန်",
    "profile.ready": "ဤအသုံးပြုမှုအတွက် အသင့်ဖြစ်သည်။",
    "profile.daily": "နေ့စဉ်",
    "profile.free": "အခမဲ့",
    "profile.purchased": "ဝယ်ယူထားသော",
    "profile.creditsWord": "ခရက်ဒစ်",
    "profile.transactionLedger": "ငွေလွှဲမှတ်တမ်း",
    "profile.creditAdditions": "ခရက်ဒစ် ထည့်သွင်းမှုများ",
    "profile.logs": "မှတ်တမ်း {count} ခု",
    "profile.loadingLedger": "မှတ်တမ်း ဖွင့်နေသည်...",
    "profile.purchasedCredits": "+{amount} ဝယ်ယူထားသော ခရက်ဒစ်",
    "profile.noLedger": "ဝယ်ယူထားသော ခရက်ဒစ်ထည့်သွင်းမှု မှတ်တမ်း မရှိသေးပါ။",
    "readings.eyebrow": "အလိုအလျောက် ဟောစာတမ်းများ",
    "readings.title": "သင်၏ နက္ခတ်ပုံစံ",
    "readings.subtitle": "သိမ်းဆည်းထားသော မွေးဖွားမှု ပရိုဖိုင်နှင့် အနောက်တိုင်း နေရาศီတွက်ချက်မှုအပေါ် အခြေခံထားသည့် သင့်အတွက် သီးသန့် ခြုံငုံဟောစာတမ်း။",
    "readings.unavailable": "ဟောစာတမ်း မရနိုင်ပါ",
    "readings.openError": "သင်၏ နက္ခတ်ပုံစံကို ဖွင့်၍ မရပါ။",
    "readings.loadError": "သင်၏ အလိုအလျောက် ဟောစာတမ်းကို ဖွင့်၍ မရပါ။",
    "readings.reviewProfile": "မွေးဖွားမှု ပရိုဖိုင် စစ်ဆေးရန်",
    "readings.primarySunSign": "အဓိက နေရาศီ",
    "readings.elementLabel": "{element} ဓာတ်",
    "readings.birthDate": "မွေးနေ့",
    "readings.birthTime": "မွေးချိန်",
    "readings.location": "နေရာ",
    "readings.coreStrengths": "အဓိက အားသာချက်များ",
    "readings.elementExpression": "{element} ဓာတ်ဖော်ပြချက်",
    "readings.dailyInfluences": "နေ့စဉ် သက်ရောက်မှုများ",
    "readings.cosmicWeather": "နက္ခတ်ရာသီဥတု",
    "readings.alignmentAdvice": "ညှိနှိုင်းနေထိုင်ရန် အကြံပြုချက်",
    "readings.useBirthContext": "မွေးဖွားမှုအချက်အလက်ကို အသုံးချပါ",
    "readings.sign.Aries": "မိဿ",
    "readings.sign.Taurus": "ပြိဿ",
    "readings.sign.Gemini": "မေထုန်",
    "readings.sign.Cancer": "ကရကဋ်",
    "readings.sign.Leo": "သိဟ်",
    "readings.sign.Virgo": "ကန်",
    "readings.sign.Libra": "တူ",
    "readings.sign.Scorpio": "ဗြိစ္ဆာ",
    "readings.sign.Sagittarius": "ဓနု",
    "readings.sign.Capricorn": "မကာရ",
    "readings.sign.Aquarius": "ကုမ်",
    "readings.sign.Pisces": "မိန်",
    "readings.element.Fire": "မီး",
    "readings.element.Earth": "မြေ",
    "readings.element.Air": "လေ",
    "readings.element.Water": "ရေ",
    "readings.overview.Fire": "သင့်ပရိုဖိုင်တွင် မီးဓာတ်သဘော ရှိသည်—အလိုအလျောက် လှုပ်ရှားတတ်၊ တောက်ပပြီး အရှိန်ယူရန် သင့်တော်သည်။ တန်ဖိုးရှိသော စိန်ခေါ်မှုတစ်ခုအပေါ် သင့်အာရုံစိုက်မှု ခိုင်မာလာသောအခါ ယုံကြည်မှု မြန်မြန်တက်လာပြီး တွန့်ဆုတ်ခြင်းထက် သတ္တိဖြင့် ဦးဆောင်နိုင်စေသည်။ လုပ်ဆောင်ရမည့်အရာမှာ စိတ်အားထက်သန်မှုကို ခဏတာ အလျင်လိုမှုမဟုတ်ဘဲ ရေရှည်လုပ်ဆောင်မှုအဖြစ် ပြောင်းလဲနိုင်ရန် မီးတောက်ကို သင့်တင့်စွာ ထိန်းညှိရန် ဖြစ်သည်။",
    "readings.overview.Earth": "သင့်ပရိုဖိုင်တွင် မြေဓာတ်သဘော ရှိသည်—တည်ငြိမ်၊ လက်တွေ့ကျပြီး အချိန်ကြာလာသည်နှင့် တည်ဆောက်နိုင်သည့်အရာများနှင့် ကိုက်ညီသည်။ သင်သည် အထောက်အထား၊ စည်းချက်နှင့် မြင်သာသော ကတိကဝတ်များမှတစ်ဆင့် အင်အားကို နားလည်တတ်သည်။ လုပ်ဆောင်ရမည့်အရာမှာ တည်ငြိမ်မှုကို အသက်ဝင်ပြီး တုံ့ပြန်နိုင်အောင် ထားရှိကာ စည်းကမ်းသည် ဖိအားမဖြစ်ဘဲ ပျော်ရွှင်မှုကို ထောက်ပံ့နိုင်စေရန် ဖြစ်သည်။",
    "readings.overview.Air": "သင့်ပရိုဖိုင်တွင် လေဓာတ်သဘော ရှိသည်—စူးစမ်းမြင်တတ်၊ ချိတ်ဆက်တတ်ပြီး အတွေးအခေါ်များမှ အင်အားရသည်။ သင်သည် ပုံစံများကို အမည်ပေးခြင်း၊ ပိုကောင်းသော မေးခွန်းများ မေးခြင်းနှင့် ရိုးအီနေသော နေရာများသို့ အမြင်သစ် ယူဆောင်ခြင်းဖြင့် အဓိပ္ပါယ်ကို ရှာဖွေတတ်သည်။ လုပ်ဆောင်ရမည့်အရာမှာ ထိုးထွင်းသိမြင်မှုသည် ခန္ဓာကိုယ်ထဲသို့ သက်ဆင်းပြီး ရှင်းလင်းသော ရွေးချယ်မှုဖြစ်လာနိုင်ရန် စိတ်ကို လုံလောက်သော တည်ငြိမ်မှု ပေးရန် ဖြစ်သည်။",
    "readings.overview.Water": "သင့်ပရိုဖိုင်တွင် ရေဓာတ်သဘော ရှိသည်—အတွင်းခံစားချက်ကောင်း၊ စိတ်ခံစားမှုကို တိကျစွာ သိမြင်တတ်ပြီး မသိမသာ ပြောင်းလဲမှုများကို အလွန်တုံ့ပြန်တတ်သည်။ အချက်အလက်များ မပြောမီ ပတ်ဝန်းကျင်အနေအထားကို ဖတ်ရှုတတ်ခြင်းကြောင့် သင့်ရွေးချယ်မှုများတွင် ထူးခြားသော နက်ရှိုင်းမှု ရှိနိုင်သည်။ လုပ်ဆောင်ရမည့်အရာမှာ သင့်နူးညံ့မှုကို စည်းမျဉ်းများဖြင့် ကာကွယ်ပြီး စာနာမှုကို အလွန်အကျူး ဆန့်ထုတ်ခြင်းမဟုတ်ဘဲ ဉာဏ်ပညာအဖြစ် ပြောင်းလဲရန် ဖြစ်သည်။",
    "readings.daily.0": "ယနေ့သည် တိတ်ဆိတ်စွာ ချိန်ညှိရန် အထူးသင့်တော်သည်။ စကားဝိုင်းတိုင်းကို သင့်အတွင်းမိုးကောင်းကင်ကို ဖြတ်သန်းသည့် ဂြိုဟ်လှုပ်ရှားမှုတစ်ခုအဖြစ် မြင်ပြီး အရေးကြီးရုံမက သင့်ကို ပိုကျယ်ပြန့်စေသော ကတိကဝတ်များကို သတိပြုပါ။",
    "readings.daily.1": "ယနေ့သည် အင်အားနယ်နိမိတ်များကို ပိုမိုသန့်ရှင်းစေလိုသည်။ သင့်အစီအစဉ်များကို အဓိကဦးစားပေးချက် တစ်ခုတည်းပတ်လည်တွင် ထားပြီး သေးငယ်သော လုပ်ငန်းများကို ထိုအရာအနီးတွင် အလိုအလျောက် နေရာကျစေပါ။",
    "readings.daily.2": "ပြန်လည်သုံးသပ်မှုဆန်သော လသဘောသည် ပြင်ဆင်ခြင်း၊ ခွင့်လွှတ်ခြင်းနှင့် မသိမသာ လမ်းကြောင်းပြင်ခြင်းအတွက် ယနေ့ကို အားကောင်းစေသည်။ သင့်အာရုံကြောစနစ်ကို ကျယ်ဝန်းစေသော တုံ့ပြန်မှုကို ရွေးပါ။",
    "readings.daily.3": "ယနေ့ အရှိန်အဟုန်သည် တိကျမှုမှတစ်ဆင့် စုစည်းလာသည်။ နောက်တစ်ဆင့် မှန်ကန်သော လုပ်ဆောင်ချက်ကို အမည်ပေးပါ၊ သင့်မွေးဖွားမှု ပရိုဖိုင်တွင် မှတ်တမ်းတင်ထားသော အချိန်ကို လေးစားပါ၊ သင့်အတွင်းခံစားချက်ကို အလွန်ရှင်းပြမနေဘဲ လှုပ်ရှားပါ။",
    "readings.daily.4": "လက်ရှိ နက္ခတ်ရာသီဥတုသည် သတ္တိရှိသော ရိုးရှင်းမှုကို ထောက်ပံ့နေသည်။ မလိုအပ်သော ဆူညံသံများကို ဖြတ်တောက်ပါ၊ သင့်အဓိကတန်ဖိုးများထံ ပြန်လာပါ၊ ရိုးသားသော လုပ်ဆောင်ချက်တစ်ခုကို လှူဒါန်းမှုတစ်ခုအဖြစ် ဖြစ်စေပါ။",
    "readings.daily.5": "ယနေ့ လူမှုရေးနှင့် စိတ်ပိုင်းဆိုင်ရာ လှိုင်းကြောင်း အားကောင်းနေသောကြောင့် သင် တစ်ကိုယ်တည်း ပြင်ဆင်နေခဲ့သော အတွေးကို ဝေမျှရန် အသုံးဝင်နိုင်သည်။ ချိတ်ဆက်မှုသည် လိုအပ်နေသော တွန်းအားဖြစ်လာနိုင်သည်။",
    "readings.daily.6": "ယနေ့သည် ပြန်လည်အားဖြည့်မှုနှင့် ခန္ဓာကိုယ်နှင့် ပြန်လည်ချိတ်ဆက်မှုကို မီးမောင်းထိုးပြသည်။ သင့်နေရာ၊ ပတ်ဝန်းကျင်နှင့် နေ့စဉ်အလေ့အထများကို နောက်ခံအသေးစိတ်မဟုတ်ဘဲ ဟောစာတမ်း၏ အစိတ်အပိုင်းအဖြစ် ပါဝင်စေပါ။",
    "readings.alignment.Fire": "နောက်ထပ် ခွင့်ပြုချက်အမှတ်အသားကို မရှာမီ စိတ်အားထက်သန်မှုကို ဆုံးဖြတ်ချက်ခိုင်မာသော လုပ်ဆောင်ချက်တစ်ခုအဖြစ် ပြောင်းပါ။ သင့်ပရိုဖိုင်သည် {birthLocation} ရှိ {birthTime} နှင့် ချိတ်ဆက်ထားသောကြောင့် အချိန်နှင့် နေရာကို သာမန်အသေးစိတ်များမဟုတ်ဘဲ မြင့်မြတ်သော အခြေအနေအဖြစ် သဘောထားသည့်အခါ ယနေ့ ပြောင်းလဲပုံကို သတိပြုပါ။",
    "readings.alignment.Earth": "သင့်ရည်ရွယ်ချက်များသည် နေရာတစ်ခုရှိကြောင်း သက်သေပြသော လက်တွေ့ကျသော အလေ့အထတစ်ခုဖြင့် ယနေ့ကို အခြေချပါ။ သင့်ပရိုဖိုင်သည် {birthLocation} ရှိ {birthTime} နှင့် ချိတ်ဆက်ထားသောကြောင့် အချိန်နှင့် နေရာကို သာမန်အသေးစိတ်များမဟုတ်ဘဲ မြင့်မြတ်သော အခြေအနေအဖြစ် သဘောထားသည့်အခါ ယနေ့ ပြောင်းလဲပုံကို သတိပြုပါ။",
    "readings.alignment.Air": "ပုံစံကို ရေးချပါ၊ ထို့နောက် ၎င်းညွှန်ပြသော အရှင်းလင်းဆုံး စကားဝိုင်း သို့မဟုတ် ဆုံးဖြတ်ချက်ကို ရွေးပါ။ သင့်ပရိုဖိုင်သည် {birthLocation} ရှိ {birthTime} နှင့် ချိတ်ဆက်ထားသောကြောင့် အချိန်နှင့် နေရာကို သာမန်အသေးစိတ်များမဟုတ်ဘဲ မြင့်မြတ်သော အခြေအနေအဖြစ် သဘောထားသည့်အခါ ယနေ့ ပြောင်းလဲပုံကို သတိပြုပါ။",
    "readings.alignment.Water": "စိတ်ခံစားမှုဆိုင်ရာ အချက်အလက်ကို သင့်ကို လမ်းညွှန်ခွင့်ပြုပါ၊ သို့သော် သင့်ကို ဗဟိုတည်စေသော နယ်နိမိတ်တစ်ခုဖြင့် အတည်ပြုပါ။ သင့်ပရိုဖိုင်သည် {birthLocation} ရှိ {birthTime} နှင့် ချိတ်ဆက်ထားသောကြောင့် အချိန်နှင့် နေရာကို သာမန်အသေးစိတ်များမဟုတ်ဘဲ မြင့်မြတ်သော အခြေအနေအဖြစ် သဘောထားသည့်အခါ ယနေ့ ပြောင်းလဲပုံကို သတိပြုပါ။",
    "readings.recordedBirthplace": "သိမ်းဆည်းထားသော မွေးဖွားရာနေရာ",
    "readings.recordedBirthTime": "သိမ်းဆည်းထားသော မွေးချိန်",
    "dashboard.openProfile": "သင့်ပရိုဖိုင် ဖွင့်ရန်",
    "dashboard.title": "သင်၏ နက္ခတ်လမ်းညွှန်ကို ရွေးပါ",
    "dashboard.welcome": "ပြန်လည်ကြိုဆိုပါသည်၊ {name}။ သင့်မွေးဖွားမှု ပရိုဖိုင်အပေါ် အခြေခံပြီး ကိုယ်ပိုင်ဆွေးနွေးမှု စတင်ပါ။ ခရက်ဒစ်နှင့် အကောင့်ဆက်တင်များကို ပရိုဖိုင်တွင် စီမံနိုင်သည်။",
    "dashboard.available": "ယခု ရနိုင်သည်",
    "dashboard.astrologers": "ဗေဒင်ဆရာများ",
    "dashboard.creditPerMessage": "စာတစ်စောင် / ခရက်ဒစ် ၁",
    "dashboard.none": "ယခုအချိန်တွင် ဗေဒင်ဆရာ မရှိသေးပါ။ မကြာမီ ပြန်စစ်ပါ။",
    "dashboard.chat": "စကားပြောမည်",
    "chat.back": "← ဒက်ရှ်ဘုတ်",
    "chat.credits": "ခရက်ဒစ်",
    "chat.limit": "နေ့စဉ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ။ ညသန်းခေါင်တွင် ပြန်လည်သတ်မှတ်ပါမည်။ ခရက်ဒစ်ဖြည့်ရန် Admin ကို ဆက်သွယ်ပါ။",
    "chat.loadError": "ဤစကားဝိုင်းကို ဖွင့်၍ မရပါ။",
    "chat.refreshError": "ဤစကားဝိုင်းကို ဖွင့်၍ မရပါ။ စာမျက်နှာပြန်ဖွင့်ပြီး ထပ်ကြိုးစားပါ။",
    "chat.requestFailed": "စကားပြောတောင်းဆိုမှု မအောင်မြင်ပါ။",
    "chat.streamFailed": "စကားပြောအဖြေကို တိုက်ရိုက်လက်ခံ၍ မရပါ။",
    "chat.emptyAnswer": "ဤတစ်ကြိမ်တွင် ရှင်းလင်းသောအဖြေ မရခဲ့ပါ။",
    "chat.loading": "သင့်စကားဝိုင်း ဖွင့်နေသည်…",
    "chat.startTitle": "ဆွေးနွေးမှု စတင်ပါ",
    "chat.startText": "အချစ်၊ အလုပ်အကိုင်၊ အချိန်အခါ သို့မဟုတ် လက်ရှိနက္ခတ်အခြေအနေများအကြောင်း {providerName} ကို မေးပါ။",
    "chat.notSent": "မပို့ရသေးပါ",
    "chat.messageLabel": "စာတို",
    "chat.placeholder": "{providerName} ထံ စာပို့ပါ…",
    "chat.reading": "ဖတ်နေသည်…",
    "chat.send": "ပို့မည်",
    "chat.hint": "ပို့ရန် Enter ကို နှိပ်ပါ၊ စာကြောင်းအသစ်အတွက် Shift + Enter ကို နှိပ်ပါ။ ပို့သောစာတစ်စောင်လျှင် ခရက်ဒစ် ၁ ကုန်ကျသည်။",
    "chat.thinkingStars": "{providerName} သည် ကြယ်များကို ဖတ်နေသည်…",
    "chat.thinkingCharts": "{providerName} သည် ဇယားများကို ကြည့်နေသည်…",
    "chat.thinking": "{providerName} စဉ်းစားနေသည်…",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => String(params[key] ?? match));
}

function getStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage === "my" ? "my" : "en";
}

export function LocalizationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = language === "my" ? "my" : "en";
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const value = translations[language][key] ?? translations.en[key];
      return interpolate(value, params);
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider.");
  }

  return context;
}
