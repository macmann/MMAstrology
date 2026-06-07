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
    <main className="cosmic-page">
      <div className="cosmic-shell">
        <section className="cosmic-header px-6 pb-10 pt-8 text-white">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.75rem] border border-amber-200/20 bg-white/10 text-3xl shadow-inner shadow-white/10">
            ✦
          </div>
          <p className="mt-6 text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">Birth profile</p>
          <h1 className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-tight">Tell us where your chart begins.</h1>
          <p className="mt-5 text-sm leading-6 text-violet-100/80">
            Your birth date, time, and location personalize every future reading with the right cosmic context.
          </p>
        </section>
        <section className="-mt-6 px-5 pb-8">
          <OnboardingForm />
        </section>
      </div>
    </main>
  );
}
