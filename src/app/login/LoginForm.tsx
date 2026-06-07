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
    <form onSubmit={handleSubmit} className="w-full space-y-5 rounded-[2rem] border border-white bg-white p-6 shadow-2xl shadow-slate-300/60">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#0b1f3f]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Log in to continue your AI astrology conversations.</p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <label className="block text-sm font-bold text-slate-600">
        Email
        <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white" />
      </label>
      <label className="block text-sm font-bold text-slate-600">
        Password
        <input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white" />
      </label>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-[1.25rem] bg-[#0b1f3f] px-5 py-3 font-black text-white transition hover:bg-[#12315d] disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Opening dashboard..." : "Log in"}
      </button>
      <p className="text-center text-sm leading-6 text-slate-500">
        New to MMAstrology? <Link href="/register" className="font-black text-emerald-700 hover:text-emerald-900">Create an account</Link>
      </p>
    </form>
  );
}
