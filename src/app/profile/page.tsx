import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      email: true,
      astrologicalProfile: {
        select: {
          dob: true,
          birthTime: true,
          birthLocation: true,
        },
      },
    },
  });

  if (!user?.astrologicalProfile) {
    redirect("/onboarding");
  }

  const profile = user.astrologicalProfile;

  return (
    <>
      <header className="cosmic-header pb-12">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">Profile</p>
          <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">Your birth chart</h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">Signed in as {user.email}</p>
        </div>
      </header>

      <section className="-mt-6 px-5 pb-6">
        <div className="cosmic-card space-y-4">
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-200 via-fuchsia-300 to-violet-500 text-3xl shadow-lg shadow-fuchsia-950/30">
              ✦
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-100/60">Birth details</p>
              <h2 className="text-2xl font-black text-amber-100">Astrological profile</h2>
            </div>
          </div>

          <dl className="relative grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <dt className="text-xs font-black uppercase tracking-[0.18em] text-violet-100/55">Date of birth</dt>
              <dd className="mt-1 font-bold text-white">{formatDate(profile.dob)}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <dt className="text-xs font-black uppercase tracking-[0.18em] text-violet-100/55">Birth time</dt>
              <dd className="mt-1 font-bold text-white">{profile.birthTime}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <dt className="text-xs font-black uppercase tracking-[0.18em] text-violet-100/55">Birth location</dt>
              <dd className="mt-1 font-bold text-white">{profile.birthLocation}</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
