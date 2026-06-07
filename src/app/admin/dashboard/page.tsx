import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProviderSummary = {
  id: string;
  name: string;
  isActive: boolean;
  systemPrompt: string;
};

async function requireAdminSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/admin/dashboard");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

export async function updateProviderConfig(formData: FormData) {
  "use server";

  await requireAdminSession();

  const rawProviderId = formData.get("providerId");
  const rawSystemPrompt = formData.get("systemPrompt");
  const providerId = typeof rawProviderId === "string" ? rawProviderId.trim() : "";
  const systemPrompt = typeof rawSystemPrompt === "string" ? rawSystemPrompt.trim() : "";
  const isActive = formData.get("isActive") === "on";

  if (!providerId) {
    throw new Error("Provider id is required.");
  }

  if (!systemPrompt) {
    throw new Error("System prompt cannot be empty.");
  }

  await prisma.providerConfig.update({
    where: { id: providerId },
    data: {
      isActive,
      systemPrompt,
    },
  });

  revalidatePath("/admin/dashboard");
}

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const [userCount, providerConfigs] = await Promise.all([
    prisma.user.count(),
    prisma.providerConfig.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        systemPrompt: true,
      },
    }),
  ]);
  const providers = providerConfigs as ProviderSummary[];
  const activeProviderCount = providers.filter((provider) => provider.isActive).length;

  return (
    <main className="cosmic-page px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">Admin</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">Superadmin dashboard</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-violet-100/75">
            Manage MMAstrology provider availability, editable LLM system prompts, and seeded application setup.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Registered users</p>
            <p className="mt-4 text-5xl font-black text-white">{userCount}</p>
          </article>

          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Active providers</p>
            <p className="mt-4 text-5xl font-black text-white">
              {activeProviderCount}/{providers.length}
            </p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Provider configuration</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Editable LLM system prompts</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              These prompts are sent to the AI provider as the system prompt. Use placeholders like {"{personaName}"}, {"{tone}"}, {"{dob}"}, {"{birthTime}"}, and {"{birthLocation}"} to inject provider and user birth-profile data at chat time.
            </p>
          </div>

          <div className="grid gap-4">
            {providers.map((provider) => (
              <form key={provider.id} action={updateProviderConfig} className="rounded-2xl border border-white/15 bg-[#100a29]/80 p-4">
                <input type="hidden" name="providerId" value={provider.id} />
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-white">{provider.name}</p>
                    <label className="mt-3 flex items-center gap-3 text-sm font-semibold text-violet-100/80">
                      <input
                        name="isActive"
                        type="checkbox"
                        defaultChecked={provider.isActive}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-amber-300"
                      />
                      Active for chat
                    </label>
                  </div>
                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      provider.isActive
                        ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                        : "border-slate-300/20 bg-slate-400/10 text-violet-100/75"
                    }`}
                  >
                    {provider.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <label className="mt-4 block text-sm font-semibold text-violet-100/80" htmlFor={`systemPrompt-${provider.id}`}>
                  System prompt
                </label>
                <textarea
                  id={`systemPrompt-${provider.id}`}
                  name="systemPrompt"
                  defaultValue={provider.systemPrompt}
                  rows={5}
                  className="mt-2 min-h-32 w-full rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-violet-100/40 focus:border-amber-200/70 focus:bg-white/[0.12]"
                />

                <button
                  type="submit"
                  className="mt-4 rounded-full bg-amber-300 px-5 py-2 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-200"
                >
                  Save provider settings
                </button>
              </form>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
