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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-violet-950/30 backdrop-blur">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-300">Start with 4 daily free credits and a secure astrology profile.</p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}

      <label className="block text-sm font-medium text-slate-200">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
      </label>
      <label className="block text-sm font-medium text-slate-200">
        Password
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
      </label>
      <p className="text-xs leading-5 text-slate-400">Use at least 8 characters. Passwords are hashed before storage.</p>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-violet-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-300">
        Already registered? <Link href="/login" className="font-semibold text-violet-200 hover:text-white">Log in</Link>
      </p>
    </form>
  );
}
