"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Unable to create your account.");
      setIsSubmitting(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-[2rem] border border-white bg-white p-6 shadow-2xl shadow-slate-300/60">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#0b1f3f]">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Start with 4 daily free credits and a secure astrology profile.</p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <label className="block text-sm font-bold text-slate-600">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white" />
      </label>
      <label className="block text-sm font-bold text-slate-600">
        Password
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white" />
      </label>
      <p className="text-xs leading-5 text-slate-500">Use at least 8 characters. Passwords are hashed before storage.</p>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-[1.25rem] bg-[#0b1f3f] px-5 py-3 font-black text-white transition hover:bg-[#12315d] disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm leading-6 text-slate-500">
        Already registered? <Link href="/login" className="font-black text-emerald-700 hover:text-emerald-900">Log in</Link>
      </p>
    </form>
  );
}
