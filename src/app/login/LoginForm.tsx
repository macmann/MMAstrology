"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Unable to log in.");
      setIsSubmitting(false);
      return;
    }

    const roleDashboard = payload.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
    router.push(searchParams.get("next") ?? roleDashboard);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="cosmic-form">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-violet-100/70">Log in to continue your AI astrology conversations.</p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <label className="block text-sm font-bold text-slate-300">
        Email
        <input name="email" type="email" autoComplete="email" required className="cosmic-input" />
      </label>
      <label className="block text-sm font-bold text-slate-300">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="cosmic-input" />
      </label>
      <button type="submit" disabled={isSubmitting} className="cosmic-button">
        {isSubmitting ? "Opening dashboard..." : "Log in"}
      </button>
      <p className="text-center text-sm leading-6 text-violet-100/70">
        New to MMAstrology? <Link href="/register" className="font-black text-amber-200 hover:text-amber-100">Create an account</Link>
      </p>
    </form>
  );
}
