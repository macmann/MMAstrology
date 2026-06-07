import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export default async function ProviderDetailsPage({ params }: { params: Promise<{ providerId: string }> }) {
  await requireAdmin();
  const { providerId } = await params;

  const provider = await prisma.providerConfig.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      name: true,
      isActive: true,
      systemPrompt: true,
      updatedAt: true,
    },
  });

  if (!provider) {
    notFound();
  }

  const providerConfig = provider;
  const actionProviderId = provider.id;

  async function updateProvider(formData: FormData) {
    "use server";

    await requireAdmin();

    const systemPrompt = String(formData.get("systemPrompt") ?? "").trim();
    const isActive = formData.get("isActive") === "on";

    await prisma.providerConfig.update({
      where: { id: actionProviderId },
      data: {
        isActive,
        systemPrompt,
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/dashboard/providers/${actionProviderId}`);
  }

  return (
    <main className="cosmic-page px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-8">
          <Link href="/admin/dashboard" className="text-sm font-bold text-amber-200 hover:text-amber-100">
            ← Back to admin dashboard
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">Provider details</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{providerConfig.name}</h1>
              <p className="mt-3 text-sm leading-6 text-violet-100/75">
                Enable or disable this provider and edit the system prompt sent before every chat response.
              </p>
            </div>
            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                providerConfig.isActive
                  ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                  : "border-slate-300/20 bg-slate-400/10 text-violet-100/75"
              }`}
            >
              {providerConfig.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </header>

        <form action={updateProvider} className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/20 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5">
            <label className="flex items-start gap-3 rounded-2xl border border-white/15 bg-[#100a29]/80 p-4">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={providerConfig.isActive}
                className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10 accent-amber-200"
              />
              <span>
                <span className="block text-base font-black text-white">Provider is enabled</span>
                <span className="mt-1 block text-sm leading-6 text-violet-100/70">
                  Disabled providers are blocked from chat and return an unavailable message to users.
                </span>
              </span>
            </label>

            <label className="block text-sm font-bold text-slate-300">
              System prompt
              <textarea
                name="systemPrompt"
                required
                rows={14}
                defaultValue={providerConfig.systemPrompt}
                className="mt-3 min-h-80 w-full rounded-[1.5rem] border border-white/10 bg-[#100a29]/90 px-4 py-4 text-base leading-7 text-white outline-none transition placeholder:text-violet-100/35 focus:border-amber-200/70 focus:ring-4 focus:ring-amber-200/10"
                placeholder="Write the provider persona, tone, boundaries, and response style here."
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-[#100a29]/60 p-4 text-sm leading-6 text-violet-100/70">
              <p>
                Birth details are appended automatically at chat time, so this prompt should focus on persona, tone, behavior, and safety instructions.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">Last updated {providerConfig.updatedAt.toISOString().slice(0, 10)}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href="/admin/dashboard"
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-black text-violet-100 transition hover:border-white/30 hover:bg-white/10"
              >
                Cancel
              </Link>
              <button type="submit" className="rounded-full bg-amber-200 px-6 py-3 text-sm font-black text-[#160b2f] transition hover:bg-amber-100">
                Save provider
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
