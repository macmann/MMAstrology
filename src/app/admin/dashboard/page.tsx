import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProviderSummary = {
  id: string;
  name: string;
  isActive: boolean;
  systemPrompt: string;
  updatedAt: Date;
};

type UserSummary = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  dailyFreeCredits: number;
  purchasedCredits: number;
  isBanned: boolean;
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
    const reason = String(formData.get("reason") ?? "").trim() || `Manual credit adjustment by ${adminSession.email}`;

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

    const nextPurchasedCredits = Math.max(0, targetUser.purchasedCredits + amount);
    const transactionAmount = nextPurchasedCredits - targetUser.purchasedCredits;

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
          banReason: getBanReason(formData.get("banReason")) ?? `Banned by ${adminSession.email}`,
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

  const [userCount, bannedUserCount, providerConfigs, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.providerConfig.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        systemPrompt: true,
        updatedAt: true,
      },
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
  const managedUsers = users as UserSummary[];
  const activeProviderCount = providers.filter((provider) => provider.isActive).length;
  const totalPurchasedCredits = managedUsers.reduce((total, user) => total + user.purchasedCredits, 0);

  return (
    <main className="cosmic-page cosmic-scroll-page px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">Admin command center</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Superadmin dashboard</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-violet-100/75">
                Manage provider availability, system prompts, user access, manual credit adjustments, and destructive account actions from one place.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#100a29]/80 px-4 py-3 text-sm text-violet-100/75">
              Signed in as <span className="font-black text-white">{session.email}</span>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Registered users</p>
            <p className="mt-4 text-5xl font-black text-white">{userCount}</p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Banned users</p>
            <p className="mt-4 text-5xl font-black text-white">{bannedUserCount}</p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Active providers</p>
            <p className="mt-4 text-5xl font-black text-white">
              {activeProviderCount}/{providers.length}
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Purchased credits</p>
            <p className="mt-4 text-5xl font-black text-white">{totalPurchasedCredits}</p>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <a href="#providers" className="rounded-[2rem] border border-amber-200/20 bg-amber-200 px-6 py-5 text-[#160b2f] shadow-2xl shadow-violet-950/20 transition hover:bg-amber-100">
            <p className="text-xs font-black uppercase tracking-[0.25em]">Configure</p>
            <h2 className="mt-2 text-2xl font-black">Providers & prompts</h2>
            <p className="mt-2 text-sm font-bold opacity-80">Toggle astrologers and edit their system prompts.</p>
          </a>
          <a href="#users" className="rounded-[2rem] border border-white/15 bg-white/[0.08] px-6 py-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl transition hover:border-amber-200/35 hover:bg-white/[0.12]">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">Manage</p>
            <h2 className="mt-2 text-2xl font-black text-white">Users & credits</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">Add credits, remove credits, ban, unban, or delete users.</p>
          </a>
          <Link href="/dashboard" className="rounded-[2rem] border border-white/15 bg-white/[0.08] px-6 py-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl transition hover:border-amber-200/35 hover:bg-white/[0.12]">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">Preview</p>
            <h2 className="mt-2 text-2xl font-black text-white">User app</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">Open the regular app dashboard with the current admin account.</p>
          </Link>
        </section>

        <section id="providers" className="scroll-mt-8 rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Provider configuration</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Default astrology providers</h2>
              <p className="mt-2 text-sm leading-6 text-violet-100/70">
                Toggle provider availability instantly for all users, or open a provider card to edit its system prompt instructions.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {providers.map((provider) => (
              <div key={provider.id} className="rounded-2xl border border-white/15 bg-[#100a29]/80 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">{provider.name}</p>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          provider.isActive
                            ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                            : "border-slate-300/20 bg-slate-400/10 text-violet-100/75"
                        }`}
                      >
                        {provider.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">System prompt</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-violet-100/75">{getPromptPreview(provider.systemPrompt)}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Updated {provider.updatedAt.toISOString().slice(0, 10)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <form action={setProviderAvailability}>
                      <input type="hidden" name="providerId" value={provider.id} />
                      <input type="hidden" name="isActive" value={provider.isActive ? "false" : "true"} />
                      <button
                        type="submit"
                        className={`w-full rounded-full border px-4 py-2 text-center text-sm font-black transition sm:w-auto ${
                          provider.isActive
                            ? "border-rose-200/25 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
                            : "border-amber-200/25 bg-amber-200 text-[#160b2f] hover:bg-amber-100"
                        }`}
                      >
                        {provider.isActive ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <Link
                      href={`/admin/dashboard/providers/${provider.id}`}
                      className="w-full rounded-full border border-amber-200/25 px-4 py-2 text-center text-sm font-black text-amber-100 transition hover:bg-amber-200 hover:text-[#160b2f] sm:w-auto"
                    >
                      Configure
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="users" className="scroll-mt-8 rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">User management</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Users, credits, bans, and removal</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Showing the 50 newest users. Credit removals are capped at the user&apos;s available purchased-credit balance so balances never become negative.
            </p>
          </div>

          <div className="space-y-4">
            {managedUsers.map((user) => {
              const isSelf = user.id === session.userId;

              return (
                <article key={user.id} className="rounded-2xl border border-white/15 bg-[#100a29]/80 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="break-all text-base font-black text-white">{user.email}</h3>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-100/75">{user.role}</span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                            user.isBanned ? "border-rose-300/30 bg-rose-400/10 text-rose-100" : "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                          }`}
                        >
                          {user.isBanned ? "Banned" : "Active"}
                        </span>
                        {isSelf ? <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100">You</span> : null}
                      </div>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Free credits</dt>
                          <dd className="mt-1 text-xl font-black text-white">{user.dailyFreeCredits}</dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Purchased</dt>
                          <dd className="mt-1 text-xl font-black text-white">{user.purchasedCredits}</dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Messages</dt>
                          <dd className="mt-1 text-xl font-black text-white">{user._count.messages}</dd>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Joined</dt>
                          <dd className="mt-1 text-sm font-black text-white">{user.createdAt.toISOString().slice(0, 10)}</dd>
                        </div>
                      </dl>

                      <p className="mt-3 text-sm leading-6 text-violet-100/70">
                        Profile: <span className="font-bold text-white">{user.astrologicalProfile ? "Complete" : "Missing"}</span> · Credit transactions: {user._count.creditTransactions}
                        {user.banReason ? <> · Ban reason: <span className="text-rose-100">{user.banReason}</span></> : null}
                      </p>
                    </div>

                    <div className="grid gap-3 xl:w-[26rem]">
                      <form action={adjustUserCredits} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <input type="hidden" name="targetUserId" value={user.id} />
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
                        <button type="submit" className="mt-2 w-full rounded-full bg-amber-200 px-4 py-2 text-sm font-black text-[#160b2f] transition hover:bg-amber-100">
                          Apply credit change
                        </button>
                      </form>

                      <form action={setUserBanStatus} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <input type="hidden" name="targetUserId" value={user.id} />
                        {user.isBanned ? (
                          <>
                            <input type="hidden" name="intent" value="unban" />
                            <button
                              type="submit"
                              disabled={isSelf}
                              className="w-full rounded-full border border-emerald-200/30 bg-emerald-300/15 px-4 py-2 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              Unban user
                            </button>
                          </>
                        ) : (
                          <>
                            <input type="hidden" name="intent" value="ban" />
                            <input
                              name="banReason"
                              placeholder="Ban reason"
                              className="w-full rounded-xl border border-white/10 bg-[#100a29] px-3 py-2 text-sm text-white outline-none placeholder:text-violet-100/35 focus:border-rose-200/70"
                            />
                            <button
                              type="submit"
                              disabled={isSelf}
                              className="mt-2 w-full rounded-full border border-rose-200/30 bg-rose-400/15 px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              Ban user
                            </button>
                          </>
                        )}
                      </form>

                      <form action={deleteUser} className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3">
                        <input type="hidden" name="targetUserId" value={user.id} />
                        <button
                          type="submit"
                          disabled={isSelf}
                          className="w-full rounded-full border border-rose-200/30 px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Remove user permanently
                        </button>
                        <p className="mt-2 text-xs leading-5 text-rose-100/70">Deletes profile, messages, and credit history through cascading relations.</p>
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
