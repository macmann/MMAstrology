import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndResetCredits } from "@/lib/credits";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  await checkAndResetCredits(session.userId);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      astrologicalProfile: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.astrologicalProfile) {
    redirect("/onboarding");
  }

  const totalCredits = user.dailyFreeCredits + user.purchasedCredits;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#581c87_0,transparent_32%),#050314] px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-violet-950/30 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-violet-200">Dashboard</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Welcome, {user.email}</h1>
            <p className="mt-3 text-slate-300">Your AI astrology workspace is protected by an authenticated session.</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-5 text-center">
            <p className="text-sm text-slate-400">Available credits</p>
            <p className="mt-1 text-4xl font-bold text-violet-200">{totalCredits}</p>
          </div>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-slate-400">Daily free credits</p>
            <p className="mt-3 text-3xl font-semibold">{user.dailyFreeCredits}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-slate-400">Purchased credits</p>
            <p className="mt-3 text-3xl font-semibold">{user.purchasedCredits}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-slate-400">Role</p>
            <p className="mt-3 text-3xl font-semibold">{user.role}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold">Astrological profile</h2>
            <dl className="mt-5 space-y-4 text-sm text-slate-300">
              <div>
                <dt className="text-slate-500">Date of birth</dt>
                <dd>{user.astrologicalProfile.dob.toDateString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Birth time</dt>
                <dd>{user.astrologicalProfile.birthTime}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Birth location</dt>
                <dd>{user.astrologicalProfile.birthLocation}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold">Recent messages</h2>
            {user.messages.length > 0 ? (
              <div className="mt-5 space-y-3">
                {user.messages.map((message) => (
                  <article key={message.id} className="rounded-2xl bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-violet-200">
                      <span>{message.role}</span>
                      <span>{message.providerName}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{message.content}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">Your stored AI astrology conversations will appear here after the message pipeline is connected.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
