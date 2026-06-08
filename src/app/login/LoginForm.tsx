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
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-amber-200/25 bg-white/10 text-4xl shadow-inner shadow-white/10">
          🔮
        </div>
        <p className="mt-5 text-[0.68rem] font-black uppercase tracking-[0.42em] text-amber-200/90">AI Bay Din</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Log in</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-violet-100/72">
          Return to your cosmic dashboard, saved readings, and AI astrology conversations.
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3 text-center text-xs font-black text-violet-100/80">
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3">✦ Secure profile</div>
        <div className="rounded-2xl border border-amber-200/15 bg-amber-100/[0.08] px-3 py-3 text-amber-100">☽ Daily insights</div>
      </div>

      {error ? <p className="relative rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="relative space-y-4">
        <label className="block text-sm font-bold text-slate-200">
          Email
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0b0824]/70 px-4 py-3 transition focus-within:border-amber-300 focus-within:bg-[#120b2d] focus-within:ring-2 focus-within:ring-fuchsia-300/25">
            <span className="text-lg text-amber-100/90">✉</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@stars.com"
              className="w-full bg-transparent text-slate-50 outline-none placeholder:text-slate-500"
            />
          </span>
        </label>
        <label className="block text-sm font-bold text-slate-200">
          Password
          <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0b0824]/70 px-4 py-3 transition focus-within:border-amber-300 focus-within:bg-[#120b2d] focus-within:ring-2 focus-within:ring-fuchsia-300/25">
            <span className="text-lg text-amber-100/90">✦</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="w-full bg-transparent text-slate-50 outline-none placeholder:text-slate-500"
            />
          </span>
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="cosmic-button relative">
        {isSubmitting ? "Opening AI Bay Din..." : "Log in to AI Bay Din"}
      </button>
      <p className="relative text-center text-sm leading-6 text-violet-100/70">
        New to AI Bay Din? <Link href="/register" className="font-black text-amber-200 hover:text-amber-100">Create an account</Link>
      </p>
    </form>
  );
}
