import Link from "next/link";
import { astrologers } from "@/lib/astrologers";

export default function ReadingsPage() {
  return (
    <>
      <header className="cosmic-header pb-12">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">Readings</p>
          <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">Pick a reading style</h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">
            Each guide brings a different tone to your astrology consultation.
          </p>
        </div>
      </header>

      <section className="-mt-6 px-5 pb-6">
        <div className="space-y-4">
          {astrologers.map((astrologer) => (
            <Link
              key={astrologer.name}
              href={`/chat/${encodeURIComponent(astrologer.name)}`}
              className="group block rounded-[1.85rem] border border-white/15 bg-white/[0.08] p-4 shadow-xl shadow-violet-950/20 backdrop-blur transition hover:border-amber-200/40 hover:bg-white/[0.12]"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${astrologer.accent} text-2xl shadow-lg ${astrologer.glow}`}>
                  {astrologer.symbol}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-black text-slate-50">{astrologer.name}</h2>
                  <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-violet-100/65">{astrologer.honorific}</p>
                </div>
                <span className="rounded-full bg-amber-100/10 px-3 py-2 text-xs font-black text-amber-200 transition group-hover:bg-amber-200 group-hover:text-[#160b2f]">
                  Start
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-violet-100/70">{astrologer.tagline}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
