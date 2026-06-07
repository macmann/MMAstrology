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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-violet-950/30 backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-violet-200">Onboarding</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Create your birth profile</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          These details help MMAstrology personalize your AI readings with your natal context.
        </p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}

      <label className="block text-sm font-medium text-slate-200">
        Date of birth
        <input name="dob" type="date" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
      </label>

      <label className="block text-sm font-medium text-slate-200">
        Birth time
        <input name="birthTime" type="time" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
      </label>

      <label className="block text-sm font-medium text-slate-200">
        Birth location
        <input name="birthLocation" type="text" autoComplete="address-level2" placeholder="City, state or country" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
      </label>

      <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-violet-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Saving profile..." : "Complete onboarding"}
      </button>
    </form>
  );
}
