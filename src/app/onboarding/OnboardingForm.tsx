"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dob: formData.get("dob"),
        birthTime: formData.get("birthTime"),
        birthLocation: formData.get("birthLocation"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Unable to save your astrological profile.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-white bg-white p-6 shadow-2xl shadow-slate-300/60">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Onboarding</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0b1f3f]">Create your birth profile</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          These details help MMAstrology personalize your AI readings with your natal context.
        </p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <label className="block text-sm font-bold text-slate-600">
        Date of birth
        <input name="dob" type="date" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white" />
      </label>

      <label className="block text-sm font-bold text-slate-600">
        Birth time
        <input name="birthTime" type="time" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white" />
      </label>

      <label className="block text-sm font-bold text-slate-600">
        Birth location
        <input name="birthLocation" type="text" autoComplete="address-level2" placeholder="City, state or country" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white" />
      </label>

      <button type="submit" disabled={isSubmitting} className="w-full rounded-[1.25rem] bg-[#0b1f3f] px-5 py-3 font-black text-white transition hover:bg-[#12315d] disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Saving profile..." : "Complete onboarding"}
      </button>
    </form>
  );
}
