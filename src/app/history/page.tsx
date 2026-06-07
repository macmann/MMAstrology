import { HistoryClient } from "./HistoryClient";

export default function HistoryPage() {
  return (
    <>
      <header className="cosmic-header pb-12">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.42em] text-amber-200">History</p>
          <h1 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-tight text-white">Continue your guidance</h1>
          <p className="mt-4 text-sm leading-6 text-violet-100/80">
            Review the latest exchange with each astrologer and jump right back into the consultation.
          </p>
        </div>
      </header>

      <section className="-mt-6 px-5 pb-6">
        <HistoryClient />
      </section>
    </>
  );
}
