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
