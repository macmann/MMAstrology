import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/onboarding");
  }

  const profile = await prisma.astrologicalProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#6d28d9_0,transparent_34%),radial-gradient(circle_at_bottom_right,#0ea5e9_0,transparent_30%),#050314] px-6 py-10 text-slate-50">
      <div className="mx-auto grid max-w-5xl gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-200">Personalized astrology</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Tell us where your chart begins.</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Your birth date, time, and location are saved to your account profile so every future reading can start with the right cosmic context.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-300">
            <div className="rounded-2xl bg-slate-950/60 p-4">Birth date anchors your natal chart.</div>
            <div className="rounded-2xl bg-slate-950/60 p-4">Birth time supports house and ascendant calculations.</div>
            <div className="rounded-2xl bg-slate-950/60 p-4">Birth location grounds readings in place.</div>
          </div>
        </section>
        <OnboardingForm />
      </div>
    </main>
  );
}
