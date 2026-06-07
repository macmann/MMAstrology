import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProviderSummary = {
  id: string;
  name: string;
  isActive: boolean;
};

export default async function AdminDashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/admin/dashboard");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [userCount, providerConfigs] = await Promise.all([
    prisma.user.count(),
    prisma.providerConfig.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
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
            Manage MMAstrology provider availability and monitor seeded application setup.
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
            <h2 className="mt-2 text-2xl font-bold text-white">Default astrology providers</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {providers.map((provider) => (
              <div key={provider.id} className="rounded-2xl border border-white/15 bg-[#100a29]/80 p-4">
                <div className="flex items-center justify-between gap-4">
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
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
