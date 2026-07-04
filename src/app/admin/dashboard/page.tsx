import bcrypt from "bcryptjs";
import Link from "next/link";
import { AdminSubmitButton } from "./AdminSubmitButton";
import { LogoutButton } from "@/components/LogoutButton";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import {
  DEFAULT_DAILY_READING_PROMPT,
  DAILY_READING_PROMPT_KEY,
} from "@/lib/life-reading";
import {
  DAILY_FREE_CREDIT_ALLOWANCE_KEY,
  DEFAULT_DAILY_FREE_CREDIT_ALLOWANCE,
  parseDailyFreeCreditAllowance,
  serializeDailyFreeCreditAllowance,
} from "@/lib/credit-settings";
import {
  ADS_ENABLED_KEY,
  parseAdsEnabledSetting,
  serializeAdsEnabledSetting,
} from "@/lib/ad-settings";
import { prisma } from "@/lib/prisma";
import { AI_PROVIDER_OPTIONS, getAiProviderOption, isAiProviderType } from "@/lib/ai-providers";
import {
  CHAT_HISTORY_CONTEXT_PROMPT_KEY,
  parseChatHistoryContextSetting,
  serializeChatHistoryContextSetting,
} from "@/lib/chat-settings";

type ProviderSummary = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isProProvider: boolean;
  aiProvider: string;
  aiModel: string;
  systemPrompt: string;
  maxOutputTokens: number;
  updatedAt: Date;
};

const MIN_PASSWORD_LENGTH = 8;

type UserSummary = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  dailyFreeCredits: number;
  purchasedCredits: number;
  isBanned: boolean;
  isPro: boolean;
  banReason: string | null;
  createdAt: Date;
  astrologicalProfile: { id: string } | null;
  _count: {
    messages: number;
    creditTransactions: number;
  };
};

function getPromptPreview(systemPrompt: string) {
  const prompt = systemPrompt.trim();

  if (!prompt) {
    return "No custom system prompt has been saved yet.";
  }

  return prompt.length > 180 ? `${prompt.slice(0, 180)}…` : prompt;
}

function parseCreditAdjustment(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? "").trim());

  if (!Number.isSafeInteger(amount) || amount === 0) {
    return null;
  }

  return amount;
}

function getBanReason(value: FormDataEntryValue | null) {
  const reason = String(value ?? "").trim();
  return reason || null;
}

async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/admin/dashboard");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  async function adjustUserCredits(formData: FormData) {
    "use server";

    const adminSession = await requireAdmin();
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();
    const amount = parseCreditAdjustment(formData.get("amount"));
    const reason =
      String(formData.get("reason") ?? "").trim() ||
      `Manual credit adjustment by ${adminSession.email}`;

    if (!targetUserId || amount === null) {
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { purchasedCredits: true },
    });

    if (!targetUser) {
      return;
    }

    const nextPurchasedCredits = Math.max(
      0,
      targetUser.purchasedCredits + amount,
    );
    const transactionAmount =
      nextPurchasedCredits - targetUser.purchasedCredits;

    if (transactionAmount === 0) {
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUserId },
        data: { purchasedCredits: nextPurchasedCredits },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: targetUserId,
          amount: transactionAmount,
          reason,
        },
      }),
    ]);

    revalidatePath("/admin/dashboard");
  }

  async function setUserBanStatus(formData: FormData) {
    "use server";

    const adminSession = await requireAdmin();
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();
    const intent = String(formData.get("intent") ?? "");

    if (!targetUserId || targetUserId === adminSession.userId) {
      return;
    }

    if (intent === "ban") {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          banReason:
            getBanReason(formData.get("banReason")) ??
            `Banned by ${adminSession.email}`,
        },
      });
    }

    if (intent === "unban") {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isBanned: false,
          bannedAt: null,
          banReason: null,
        },
      });
    }

    revalidatePath("/admin/dashboard");
  }

  async function createProvider(formData: FormData) {
    "use server";

    await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const displayName = String(formData.get("displayName") ?? "").trim() || name;
    const description = String(formData.get("description") ?? "").trim();
    const aiProviderRaw = String(formData.get("aiProvider") ?? "").trim();

    if (!name || name.length > 80 || !isAiProviderType(aiProviderRaw)) {
      return;
    }

    const modelOptions = getAiProviderOption(aiProviderRaw).models;
    const requestedModel = String(formData.get("aiModel") ?? "").trim();
    const aiModel = modelOptions.some((model) => model === requestedModel)
      ? requestedModel
      : getAiProviderOption(aiProviderRaw).defaultModel;

    await prisma.providerConfig.create({
      data: {
        name,
        displayName,
        description,
        isActive: formData.get("isActive") === "on",
        isProProvider: formData.get("isProProvider") === "on",
        aiProvider: aiProviderRaw,
        aiModel,
        systemPrompt: String(formData.get("systemPrompt") ?? "").trim(),
      },
    }).catch(() => null);

    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
  }

  async function deleteProvider(formData: FormData) {
    "use server";

    await requireAdmin();
    const providerId = String(formData.get("providerId") ?? "").trim();

    if (!providerId) {
      return;
    }

    await prisma.providerConfig.delete({ where: { id: providerId } }).catch(() => null);
    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
  }

  async function setUserProStatus(formData: FormData) {
    "use server";

    await requireAdmin();
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();
    const isPro = formData.get("isPro") === "true";

    if (!targetUserId) {
      return;
    }

    await prisma.user.update({ where: { id: targetUserId }, data: { isPro } });
    revalidatePath("/admin/dashboard");
  }


  async function resetUserPassword(formData: FormData) {
    "use server";

    const adminSession = await requireAdmin();
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "");

    if (
      !targetUserId ||
      targetUserId === adminSession.userId ||
      newPassword.length < MIN_PASSWORD_LENGTH
    ) {
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash },
    });

    revalidatePath("/admin/dashboard");
  }

  async function deleteUser(formData: FormData) {
    "use server";

    const adminSession = await requireAdmin();
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();

    if (!targetUserId || targetUserId === adminSession.userId) {
      return;
    }

    await prisma.user.delete({ where: { id: targetUserId } });
    revalidatePath("/admin/dashboard");
  }

  async function setProviderAvailability(formData: FormData) {
    "use server";

    await requireAdmin();

    const providerId = String(formData.get("providerId") ?? "").trim();
    const isActive = formData.get("isActive") === "true";

    if (!providerId) {
      return;
    }

    const provider = await prisma.providerConfig.update({
      where: { id: providerId },
      data: { isActive },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
    revalidatePath(`/chat/${encodeURIComponent(provider.name)}`);
    revalidatePath(`/admin/dashboard/providers/${provider.id}`);
  }

  async function updateChatHistoryContextSetting(formData: FormData) {
    "use server";

    await requireAdmin();

    const enabled = formData.get("chatHistoryContextEnabled") === "on";

    await prisma.promptConfig.upsert({
      where: { key: CHAT_HISTORY_CONTEXT_PROMPT_KEY },
      update: { prompt: serializeChatHistoryContextSetting(enabled) },
      create: {
        key: CHAT_HISTORY_CONTEXT_PROMPT_KEY,
        prompt: serializeChatHistoryContextSetting(enabled),
      },
    });

    revalidatePath("/admin/dashboard");
  }

  async function updateAdsEnabledSetting(formData: FormData) {
    "use server";

    await requireAdmin();

    const enabled = formData.get("adsEnabled") === "on";

    await prisma.promptConfig.upsert({
      where: { key: ADS_ENABLED_KEY },
      update: { prompt: serializeAdsEnabledSetting(enabled) },
      create: {
        key: ADS_ENABLED_KEY,
        prompt: serializeAdsEnabledSetting(enabled),
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
    revalidatePath("/readings");
    revalidatePath("/profile/settings");
    revalidatePath("/", "layout");
  }

  async function updateDailyFreeCreditAllowance(formData: FormData) {
    "use server";

    await requireAdmin();

    const allowance = Number(String(formData.get("dailyFreeCreditAllowance") ?? "").trim());

    if (!Number.isSafeInteger(allowance) || allowance < 0) {
      return;
    }

    await prisma.promptConfig.upsert({
      where: { key: DAILY_FREE_CREDIT_ALLOWANCE_KEY },
      update: { prompt: serializeDailyFreeCreditAllowance(allowance) },
      create: {
        key: DAILY_FREE_CREDIT_ALLOWANCE_KEY,
        prompt: serializeDailyFreeCreditAllowance(allowance),
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
    revalidatePath("/profile/settings");
  }

  async function updateDailyReadingPrompt(formData: FormData) {
    "use server";

    await requireAdmin();

    const prompt =
      String(formData.get("dailyReadingPrompt") ?? "").trim() ||
      DEFAULT_DAILY_READING_PROMPT;

    await prisma.$transaction([
      prisma.promptConfig.upsert({
        where: { key: DAILY_READING_PROMPT_KEY },
        update: { prompt },
        create: { key: DAILY_READING_PROMPT_KEY, prompt },
      }),
      prisma.astrologicalProfile.updateMany({
        data: {
          dailyReadingEn: null,
          dailyReadingMy: null,
          dailyReadingDate: null,
        },
      }),
    ]);

    revalidatePath("/admin/dashboard");
    revalidatePath("/profile");
  }

  const [
    userCount,
    bannedUserCount,
    aiUsageCount,
    aiCostSummary,
    providerConfigs,
    dailyPromptConfig,
    chatHistoryContextConfig,
    dailyFreeCreditAllowanceConfig,
    adsEnabledConfig,
    users,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.aiUsageLog.count(),
    prisma.aiUsageLog.aggregate({
      _sum: {
        costUsd: true,
      },
    }),
    prisma.providerConfig.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isActive: true,
        isProProvider: true,
        aiProvider: true,
        aiModel: true,
        systemPrompt: true,
        maxOutputTokens: true,
        updatedAt: true,
      },
    }),
    prisma.promptConfig.findUnique({
      where: { key: DAILY_READING_PROMPT_KEY },
    }),
    prisma.promptConfig.findUnique({
      where: { key: CHAT_HISTORY_CONTEXT_PROMPT_KEY },
    }),
    prisma.promptConfig.findUnique({
      where: { key: DAILY_FREE_CREDIT_ALLOWANCE_KEY },
    }),
    prisma.promptConfig.findUnique({
      where: { key: ADS_ENABLED_KEY },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        email: true,
        role: true,
        dailyFreeCredits: true,
        purchasedCredits: true,
        isBanned: true,
        isPro: true,
        banReason: true,
        createdAt: true,
        astrologicalProfile: { select: { id: true } },
        _count: {
          select: {
            messages: true,
            creditTransactions: true,
          },
        },
      },
    }),
  ]);
  const providers = providerConfigs as ProviderSummary[];
  const dailyReadingPrompt =
    dailyPromptConfig?.prompt ?? DEFAULT_DAILY_READING_PROMPT;
  const dailyFreeCreditAllowance = parseDailyFreeCreditAllowance(
    dailyFreeCreditAllowanceConfig?.prompt,
  );
  const managedUsers = users as UserSummary[];
  const isAdsEnabled = parseAdsEnabledSetting(adsEnabledConfig?.prompt);
  const isChatHistoryContextEnabled = parseChatHistoryContextSetting(
    chatHistoryContextConfig?.prompt,
  );
  const activeProviderCount = providers.filter(
    (provider) => provider.isActive,
  ).length;
  const totalPurchasedCredits = managedUsers.reduce(
    (total, user) => total + user.purchasedCredits,
    0,
  );
  const totalAiCost = Number(aiCostSummary._sum.costUsd?.toString() ?? "0");

  return (
    <main className="cosmic-page cosmic-scroll-page px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
            Admin command center
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                Superadmin dashboard
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-violet-100/75">
                Manage provider availability, system prompts, user access,
                manual credit adjustments, and destructive account actions from
                one place.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#100a29]/80 px-4 py-3 text-sm text-violet-100/75 sm:flex-row sm:items-center">
              <span>
                Signed in as{" "}
                <span className="font-black text-white">{session.email}</span>
              </span>
              <LogoutButton className="rounded-full border border-rose-200/30 bg-rose-400/15 px-4 py-2 text-sm font-black text-rose-50 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-60" />
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Registered users
            </p>
            <p className="mt-4 text-5xl font-black text-white">{userCount}</p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Banned users
            </p>
            <p className="mt-4 text-5xl font-black text-white">
              {bannedUserCount}
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Active providers
            </p>
            <p className="mt-4 text-5xl font-black text-white">
              {activeProviderCount}/{providers.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Purchased credits
            </p>
            <p className="mt-4 text-5xl font-black text-white">
              {totalPurchasedCredits}
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              AI logs / cost
            </p>
            <p className="mt-4 text-4xl font-black text-white">
              {aiUsageCount}
            </p>
            <p className="mt-2 text-sm font-bold text-amber-100">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 6,
                maximumFractionDigits: 6,
              }).format(totalAiCost)}
            </p>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-6">
          <a
            href="#providers"
            className="rounded-[2rem] border border-amber-200/20 bg-amber-200 px-6 py-5 text-[#160b2f] shadow-2xl shadow-violet-950/20 transition hover:bg-amber-100"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em]">
              Configure
            </p>
            <h2 className="mt-2 text-2xl font-black">Providers & prompts</h2>
            <p className="mt-2 text-sm font-bold opacity-80">
              Toggle astrologers and edit their system prompts.
            </p>
          </a>
          <a
            href="#users"
            className="rounded-[2rem] border border-white/15 bg-white/[0.08] px-6 py-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl transition hover:border-amber-200/35 hover:bg-white/[0.12]"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">
              Manage
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Users & credits
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Add credits, remove credits, reset passwords, ban, unban, or delete users.
            </p>
          </a>
          <Link
            href="/admin/dashboard/logs"
            className="rounded-[2rem] border border-white/15 bg-white/[0.08] px-6 py-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl transition hover:border-amber-200/35 hover:bg-white/[0.12]"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">
              Monitor
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              AI transaction logs
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Open the privacy-safe usage dashboard with tokens, timing, model,
              and AI cost.
            </p>
          </Link>
          <a
            href="#chat-context"
            className="rounded-[2rem] border border-white/15 bg-white/[0.08] px-6 py-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl transition hover:border-amber-200/35 hover:bg-white/[0.12]"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">
              Privacy
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Chat context
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Toggle whether recent chat history is sent to the LLM.
            </p>
          </a>

          <a
            href="#ads"
            className="rounded-[2rem] border border-white/15 bg-white/[0.08] px-6 py-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl transition hover:border-amber-200/35 hover:bg-white/[0.12]"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">
              Monetize
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Ads</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Toggle ad banners, placeholders, and rewarded ad credits.
            </p>
          </a>
          <Link
            href="/dashboard"
            className="rounded-[2rem] border border-white/15 bg-white/[0.08] px-6 py-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl transition hover:border-amber-200/35 hover:bg-white/[0.12]"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">
              Preview
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">User app</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Open the regular app dashboard with the current admin account.
            </p>
          </Link>
        </section>

        <section
          id="providers"
          className="scroll-mt-8 rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                Provider configuration
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Default astrology providers
              </h2>
              <p className="mt-2 text-sm leading-6 text-violet-100/70">
                Toggle provider availability instantly for all users, or open a
                provider card to edit its user-facing name, description, and
                system prompt instructions.
              </p>
            </div>
          </div>

          <form action={createProvider} className="mb-5 grid gap-4 rounded-2xl border border-amber-200/20 bg-[#100a29]/80 p-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-black text-white">Create provider</h3>
              <p className="mt-1 text-sm leading-6 text-violet-100/70">
                Add a new astrologer, choose the AI company and model, and optionally restrict it to Pro users.
              </p>
            </div>
            <input name="name" required maxLength={80} placeholder="Internal provider key / route name" className="rounded-2xl border border-white/10 bg-[#100a29] px-4 py-3 text-sm font-bold text-white outline-none" />
            <input name="displayName" maxLength={80} placeholder="Display name" className="rounded-2xl border border-white/10 bg-[#100a29] px-4 py-3 text-sm font-bold text-white outline-none" />
            <select name="aiProvider" className="rounded-2xl border border-white/10 bg-[#100a29] px-4 py-3 text-sm font-bold text-white outline-none">
              {AI_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select name="aiModel" className="rounded-2xl border border-white/10 bg-[#100a29] px-4 py-3 text-sm font-bold text-white outline-none">
              {AI_PROVIDER_OPTIONS.flatMap((option) => option.models.map((model) => (
                <option key={`${option.value}-${model}`} value={model}>{option.label}: {model}</option>
              )))}
            </select>
            <textarea name="description" maxLength={280} placeholder="Public description" className="rounded-2xl border border-white/10 bg-[#100a29] px-4 py-3 text-sm text-white outline-none lg:col-span-2" />
            <textarea name="systemPrompt" placeholder="System prompt" className="min-h-36 rounded-2xl border border-white/10 bg-[#100a29] px-4 py-3 text-sm text-white outline-none lg:col-span-2" />
            <label className="flex items-center gap-2 text-sm font-bold text-violet-100"><input name="isActive" type="checkbox" defaultChecked className="accent-amber-200" /> Active</label>
            <label className="flex items-center gap-2 text-sm font-bold text-violet-100"><input name="isProProvider" type="checkbox" className="accent-amber-200" /> Pro provider</label>
            <div className="lg:col-span-2 flex justify-end">
              <AdminSubmitButton className="rounded-full bg-amber-200 px-6 py-3 text-sm font-black text-[#160b2f]" pendingText="Creating..." successText="Provider created successfully.">Create provider</AdminSubmitButton>
            </div>
          </form>

          <div className="grid gap-4 xl:grid-cols-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="rounded-2xl border border-white/15 bg-[#100a29]/80 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">
                        {provider.displayName || provider.name}
                      </p>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          provider.isActive
                            ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                            : "border-slate-300/20 bg-slate-400/10 text-violet-100/75"
                        }`}
                      >
                        {provider.isActive ? "Active" : "Inactive"}
                      </span>
                      {provider.isProProvider ? (
                        <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">Pro</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Internal key: {provider.name}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-violet-100/75">
                      {provider.description ||
                        "No public description has been saved yet."}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      AI: {getAiProviderOption(provider.aiProvider as never).label} · {provider.aiModel} · Max tokens: {provider.maxOutputTokens}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      System prompt
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-violet-100/75">
                      {getPromptPreview(provider.systemPrompt)}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Updated {provider.updatedAt.toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <form action={setProviderAvailability}>
                      <input
                        type="hidden"
                        name="providerId"
                        value={provider.id}
                      />
                      <input
                        type="hidden"
                        name="isActive"
                        value={provider.isActive ? "false" : "true"}
                      />
                      <AdminSubmitButton
                        className={`w-full rounded-full border px-4 py-2 text-center text-sm font-black transition sm:w-auto ${
                          provider.isActive
                            ? "border-rose-200/25 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
                            : "border-amber-200/25 bg-amber-200 text-[#160b2f] hover:bg-amber-100"
                        }`}
                        pendingText={
                          provider.isActive ? "Disabling..." : "Enabling..."
                        }
                        successText={`Provider ${
                          provider.isActive ? "disabled" : "enabled"
                        } successfully.`}
                      >
                        {provider.isActive ? "Disable" : "Enable"}
                      </AdminSubmitButton>
                    </form>
                    <Link
                      href={`/admin/dashboard/providers/${provider.id}`}
                      className="w-full rounded-full border border-amber-200/25 px-4 py-2 text-center text-sm font-black text-amber-100 transition hover:bg-amber-200 hover:text-[#160b2f] sm:w-auto"
                    >
                      Configure
                    </Link>
                    <form action={deleteProvider}>
                      <input type="hidden" name="providerId" value={provider.id} />
                      <AdminSubmitButton className="w-full rounded-full border border-rose-200/25 px-4 py-2 text-center text-sm font-black text-rose-100 transition hover:bg-rose-500/20 sm:w-auto" pendingText="Deleting..." successText="Provider deleted successfully.">
                        Delete
                      </AdminSubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        <section
          id="ads"
          className="scroll-mt-8 rounded-[2rem] border border-amber-200/20 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-200">
              Ad settings
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              App-wide advertising switch
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Turn ads off to hide all ad banner placeholders, stop loading the AdSense script, and disable watch-to-earn rewarded ads.
            </p>
          </div>

          <form action={updateAdsEnabledSetting} className="grid gap-4">
            <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-[#100a29]/80 p-4">
              <input
                name="adsEnabled"
                type="checkbox"
                defaultChecked={isAdsEnabled}
                className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10 accent-amber-200"
              />
              <span>
                <span className="block text-base font-black text-white">
                  Enable advertising features
                </span>
                <span className="mt-1 block text-sm leading-6 text-violet-100/70">
                  When enabled, banner ads and rewarded ad credit claims are available. When disabled, every ad surface is hidden from users.
                </span>
              </span>
            </label>
            <div className="flex justify-end">
              <AdminSubmitButton
                className="rounded-full bg-amber-200 px-6 py-3 text-sm font-black text-[#160b2f] transition hover:bg-amber-100"
                pendingText="Saving ad setting..."
                successText="Ad setting saved successfully."
              >
                Save ad setting
              </AdminSubmitButton>
            </div>
          </form>
        </section>

        <section
          id="daily-free-credits"
          className="scroll-mt-8 rounded-[2rem] border border-emerald-200/20 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-200">
              Credit settings
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Daily free message allowance
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Configure how many free chat messages users receive when their daily credits reset. New users also start with this allowance.
            </p>
          </div>

          <form action={updateDailyFreeCreditAllowance} className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
            <label className="block text-sm font-bold text-slate-300">
              Daily free messages
              <input
                name="dailyFreeCreditAllowance"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={dailyFreeCreditAllowance}
                placeholder={String(DEFAULT_DAILY_FREE_CREDIT_ALLOWANCE)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100a29]/80 px-4 py-3 text-base font-semibold text-white outline-none transition placeholder:text-violet-100/35 focus:border-emerald-200"
              />
            </label>
            <div className="flex justify-end sm:justify-start">
              <AdminSubmitButton
                className="rounded-full bg-emerald-200 px-6 py-3 text-sm font-black text-[#160b2f] transition hover:bg-emerald-100"
                pendingText="Saving allowance..."
                successText="Daily free allowance saved successfully."
              >
                Save allowance
              </AdminSubmitButton>
            </div>
          </form>
        </section>

        <section
          id="chat-context"
          className="scroll-mt-8 rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Chat context
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              LLM chat history setting
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Control whether previous messages from the same user and provider
              are included in future LLM requests. Conversation history remains
              saved for users either way.
            </p>
          </div>

          <form action={updateChatHistoryContextSetting} className="grid gap-4">
            <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-[#100a29]/80 p-4">
              <input
                name="chatHistoryContextEnabled"
                type="checkbox"
                defaultChecked={isChatHistoryContextEnabled}
                className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10 accent-amber-200"
              />
              <span>
                <span className="block text-base font-black text-white">
                  Send recent chat history to the LLM
                </span>
                <span className="mt-1 block text-sm leading-6 text-violet-100/70">
                  When enabled, the 10 most recent messages for that provider are
                  sent as context. Turn this off to send only the new message,
                  system prompt, and birth profile context.
                </span>
              </span>
            </label>
            <div className="flex justify-end">
              <AdminSubmitButton
                className="rounded-full bg-amber-200 px-6 py-3 text-sm font-black text-[#160b2f] transition hover:bg-amber-100"
                pendingText="Saving setting..."
                successText="Chat context setting saved successfully."
              >
                Save chat context setting
              </AdminSubmitButton>
            </div>
          </form>
        </section>

        <section
          id="daily-reading-prompt"
          className="scroll-mt-8 rounded-[2rem] border border-amber-200/20 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-200">
              Daily reading prompt
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Your Reading daily prompt
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Adjust the admin prompt used to generate each user&apos;s daily
              reading for Love, Business, Health, plus general Dos and
              Don&apos;ts.
            </p>
          </div>

          <form action={updateDailyReadingPrompt} className="grid gap-4">
            <label className="block text-sm font-bold text-slate-300">
              Daily reading generation prompt
              <textarea
                name="dailyReadingPrompt"
                required
                rows={10}
                defaultValue={dailyReadingPrompt}
                className="mt-3 min-h-64 w-full rounded-[1.5rem] border border-white/10 bg-[#100a29]/90 px-4 py-4 text-base leading-7 text-white outline-none transition placeholder:text-violet-100/35 focus:border-amber-200/70 focus:ring-4 focus:ring-amber-200/10"
              />
            </label>
            <div className="flex justify-end">
              <AdminSubmitButton
                className="rounded-full bg-amber-200 px-6 py-3 text-sm font-black text-[#160b2f] transition hover:bg-amber-100"
                pendingText="Saving prompt..."
                successText="Daily prompt saved successfully."
              >
                Save daily prompt
              </AdminSubmitButton>
            </div>
          </form>
        </section>

        <section
          id="users"
          className="scroll-mt-8 rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl"
        >
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              User management
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Users, credits, passwords, bans, and removal
            </h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Showing the 50 newest users. Credit removals are capped at the
              user&apos;s available purchased-credit balance so balances never
              become negative.
            </p>
          </div>

          <div className="space-y-4">
            {managedUsers.map((user) => {
              const isSelf = user.id === session.userId;

              return (
                <article
                  key={user.id}
                  className="rounded-2xl border border-white/15 bg-[#100a29]/80 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="break-all text-base font-black text-white">
                          {user.email}
                        </h3>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-100/75">
                          {user.role}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                            user.isBanned
                              ? "border-rose-300/30 bg-rose-400/10 text-rose-100"
                              : "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                          }`}
                        >
                          {user.isBanned ? "Banned" : "Active"}
                        </span>
                        {user.isPro ? (
                          <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                            Pro
                          </span>
                        ) : null}
                        {isSelf ? (
                          <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                            You
                          </span>
                        ) : null}
                      </div>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            Free credits
                          </dt>
                          <dd className="mt-1 text-xl font-black text-white">
                            {user.dailyFreeCredits}
                          </dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            Purchased
                          </dt>
                          <dd className="mt-1 text-xl font-black text-white">
                            {user.purchasedCredits}
                          </dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            Messages
                          </dt>
                          <dd className="mt-1 text-xl font-black text-white">
                            {user._count.messages}
                          </dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            Joined
                          </dt>
                          <dd className="mt-1 text-sm font-black text-white">
                            {user.createdAt.toISOString().slice(0, 10)}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-3 text-sm leading-6 text-violet-100/70">
                        Profile:{" "}
                        <span className="font-bold text-white">
                          {user.astrologicalProfile ? "Complete" : "Missing"}
                        </span>{" "}
                        · Credit transactions: {user._count.creditTransactions}
                        {user.banReason ? (
                          <>
                            {" "}
                            · Ban reason:{" "}
                            <span className="text-rose-100">
                              {user.banReason}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="grid gap-3 xl:w-[26rem]">
                      <form
                        action={adjustUserCredits}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={user.id}
                        />
                        <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Credit adjustment
                          <input
                            name="amount"
                            type="number"
                            step="1"
                            placeholder="e.g. 10 or -5"
                            className="mt-2 w-full rounded-xl border border-white/10 bg-[#100a29] px-3 py-2 text-sm font-bold text-white outline-none focus:border-amber-200/70"
                          />
                        </label>
                        <input
                          name="reason"
                          placeholder="Reason / note"
                          className="mt-2 w-full rounded-xl border border-white/10 bg-[#100a29] px-3 py-2 text-sm text-white outline-none placeholder:text-violet-100/35 focus:border-amber-200/70"
                        />
                        <AdminSubmitButton
                          className="mt-2 w-full rounded-full bg-amber-200 px-4 py-2 text-sm font-black text-[#160b2f] transition hover:bg-amber-100"
                          pendingText="Applying..."
                          successText="Credit change applied successfully."
                        >
                          Apply credit change
                        </AdminSubmitButton>
                      </form>

                      <form
                        action={setUserProStatus}
                        className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-3"
                      >
                        <input type="hidden" name="targetUserId" value={user.id} />
                        <input type="hidden" name="isPro" value={user.isPro ? "false" : "true"} />
                        <AdminSubmitButton
                          className="w-full rounded-full bg-amber-200 px-4 py-2 text-sm font-black text-[#160b2f] transition hover:bg-amber-100"
                          pendingText={user.isPro ? "Disabling Pro..." : "Enabling Pro..."}
                          successText="Pro mode updated successfully."
                        >
                          {user.isPro ? "Disable Pro mode" : "Enable Pro mode"}
                        </AdminSubmitButton>
                        <p className="mt-2 text-xs leading-5 text-violet-100/70">
                          Pro mode is admin-only and unlocks providers marked as Pro.
                        </p>
                      </form>

                      <form
                        action={resetUserPassword}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={user.id}
                        />
                        <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Reset password
                          <input
                            name="newPassword"
                            type="password"
                            autoComplete="new-password"
                            minLength={MIN_PASSWORD_LENGTH}
                            required
                            placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
                            disabled={isSelf}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-[#100a29] px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-violet-100/35 focus:border-amber-200/70 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </label>
                        <AdminSubmitButton
                          disabled={isSelf}
                          className="mt-2 w-full rounded-full border border-amber-200/25 bg-amber-200/15 px-4 py-2 text-sm font-black text-amber-100 transition hover:bg-amber-200 hover:text-[#160b2f] disabled:cursor-not-allowed disabled:opacity-60"
                          pendingText="Resetting..."
                          successText="Password reset successfully."
                        >
                          Reset user password
                        </AdminSubmitButton>
                        <p className="mt-2 text-xs leading-5 text-violet-100/60">
                          Enter a new temporary password and share it securely
                          with the user.
                        </p>
                      </form>

                      <form
                        action={setUserBanStatus}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={user.id}
                        />
                        {user.isBanned ? (
                          <>
                            <input type="hidden" name="intent" value="unban" />
                            <AdminSubmitButton
                              disabled={isSelf}
                              className="w-full rounded-full border border-emerald-200/30 bg-emerald-300/15 px-4 py-2 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/25"
                              pendingText="Unbanning..."
                              successText="User unbanned successfully."
                            >
                              Unban user
                            </AdminSubmitButton>
                          </>
                        ) : (
                          <>
                            <input type="hidden" name="intent" value="ban" />
                            <input
                              name="banReason"
                              placeholder="Ban reason"
                              className="w-full rounded-xl border border-white/10 bg-[#100a29] px-3 py-2 text-sm text-white outline-none placeholder:text-violet-100/35 focus:border-rose-200/70"
                            />
                            <AdminSubmitButton
                              disabled={isSelf}
                              className="mt-2 w-full rounded-full border border-rose-200/30 bg-rose-400/15 px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-400/25"
                              pendingText="Banning..."
                              successText="User banned successfully."
                            >
                              Ban user
                            </AdminSubmitButton>
                          </>
                        )}
                      </form>

                      <form
                        action={deleteUser}
                        className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3"
                      >
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={user.id}
                        />
                        <AdminSubmitButton
                          disabled={isSelf}
                          className="w-full rounded-full border border-rose-200/30 px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-400/20"
                          pendingText="Removing..."
                          successText="User removed successfully."
                        >
                          Remove user permanently
                        </AdminSubmitButton>
                        <p className="mt-2 text-xs leading-5 text-rose-100/70">
                          Deletes profile, messages, and credit history through
                          cascading relations.
                        </p>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
