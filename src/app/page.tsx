import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-200 text-slate-950 sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col overflow-hidden bg-[#eef3f8] shadow-2xl shadow-slate-400/40 sm:min-h-[calc(100vh-3rem)] sm:rounded-[2.25rem]">
        <header className="relative overflow-hidden bg-[#0b1f3f] px-6 pb-10 pt-7 text-white">
          <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />
          <nav className="relative flex items-center justify-between">
            <Link href="/" className="text-lg font-black tracking-tight">
              MMAstrology
            </Link>
            <Link href="/login" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white">
              Log in
            </Link>
          </nav>

          <section className="relative pt-12">
            <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/10 text-3xl shadow-inner shadow-white/10">
              🔮
            </div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-emerald-300">Mobile cosmic AI</p>
            <h1 className="mt-4 text-[3rem] font-black leading-[0.95] tracking-tight text-white">
              Daily astrology in your pocket.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Create your birth profile, preserve conversations, and use credits from a fast mobile-first dashboard.
            </p>
            <div className="mt-8 grid gap-3">
              <Link href="/register" className="rounded-[1.4rem] bg-emerald-300 px-6 py-4 text-center font-black text-[#0b1f3f] shadow-xl shadow-emerald-950/20">
                Start your profile
              </Link>
              <Link href="/login" className="rounded-[1.4rem] border border-white/15 bg-white/10 px-6 py-4 text-center font-black text-white">
                I already have an account
              </Link>
            </div>
          </section>
        </header>

        <section className="-mt-6 flex-1 px-5 pb-8">
          <div className="rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-slate-300/60">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Today&apos;s insight</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#0b1f3f]">Venus amplifies relational clarity.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Ask how current transits intersect with your natal placements and receive account-aware guidance.
            </p>
            <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600">
              <div className="rounded-2xl bg-slate-100 p-4">4 daily free credits reset automatically.</div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">Purchased credits stay tied to your account.</div>
              <div className="rounded-2xl bg-slate-100 p-4">Conversation history follows provider and role metadata.</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
