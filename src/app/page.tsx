import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#6d28d9_0,transparent_34%),radial-gradient(circle_at_bottom_right,#0ea5e9_0,transparent_30%),#050314] px-6 py-10 text-slate-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          MMAstrology
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link href="/login" className="rounded-full px-4 py-2 text-slate-200 transition hover:text-white">
            Log in
          </Link>
          <Link href="/register" className="rounded-full bg-white px-4 py-2 text-slate-950 transition hover:bg-violet-100">
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-violet-100 backdrop-blur">
            AI astrology readings, grounded user accounts, and credit-aware access.
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Cosmic guidance built for daily AI conversations.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Create your birth profile, preserve conversations across providers, and manage free and purchased credits in one secure astrology dashboard.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="rounded-full bg-violet-400 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-violet-300">
              Start your profile
            </Link>
            <Link href="/login" className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/15">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur">
          <div className="rounded-2xl bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Today&apos;s insight</p>
            <h2 className="mt-5 text-2xl font-semibold">Venus amplifies relational clarity.</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Ask the assistant how your current transits intersect with your natal placements and receive an account-aware response.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">4 daily free credits reset automatically.</div>
              <div className="rounded-2xl bg-white/5 p-4">Purchased credits stay tied to the user account.</div>
              <div className="rounded-2xl bg-white/5 p-4">Conversation history stores provider and role metadata.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
