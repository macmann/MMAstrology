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
    <form onSubmit={handleSubmit} className="cosmic-form">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-100/70">Onboarding</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Create your birth profile</h1>
        <p className="mt-2 text-sm leading-6 text-violet-100/70">
          These details help NatKhat AI personalize your AI readings with your natal context.
        </p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <label className="block text-sm font-bold text-slate-300">
        Date of birth
        <input name="dob" type="date" required className="cosmic-input" />
      </label>

      <label className="block text-sm font-bold text-slate-300">
        Birth time
        <input name="birthTime" type="time" required className="cosmic-input" />
      </label>

      <label className="block text-sm font-bold text-slate-300">
        Birth location
        <input name="birthLocation" type="text" autoComplete="address-level2" placeholder="City, state or country" required className="cosmic-input" />
      </label>

      <button type="submit" disabled={isSubmitting} className="cosmic-button">
        {isSubmitting ? "Saving profile..." : "Complete onboarding"}
      </button>
    </form>
  );
}
