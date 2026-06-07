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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-violet-950/30 backdrop-blur">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-300">Log in to continue your AI astrology conversations.</p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}

      <label className="block text-sm font-medium text-slate-200">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
      </label>
      <label className="block text-sm font-medium text-slate-200">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
      </label>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-violet-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Opening dashboard..." : "Log in"}
      </button>
      <p className="text-center text-sm text-slate-300">
        New to MMAstrology? <Link href="/register" className="font-semibold text-violet-200 hover:text-white">Create an account</Link>
      </p>
    </form>
  );
}
