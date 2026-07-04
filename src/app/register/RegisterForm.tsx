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
    <form onSubmit={handleSubmit} className="cosmic-form">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-violet-100/70">Start with daily free credits and a secure astrology profile.</p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <label className="block text-sm font-bold text-slate-300">
        Email
        <input name="email" type="email" autoComplete="email" required className="cosmic-input" />
      </label>
      <label className="block text-sm font-bold text-slate-300">
        Password
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className="cosmic-input" />
      </label>
      <p className="text-xs leading-5 text-violet-100/70">Use at least 8 characters. Passwords are hashed before storage.</p>
      <button type="submit" disabled={isSubmitting} className="cosmic-button">
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm leading-6 text-violet-100/70">
        Already registered? <Link href="/login" className="font-black text-amber-200 hover:text-amber-100">Log in</Link>
      </p>
    </form>
  );
}
