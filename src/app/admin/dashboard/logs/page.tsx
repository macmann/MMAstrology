import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutoRefresh } from "./AutoRefresh";

export const dynamic = "force-dynamic";

type UsageLog = {
  id: string;
  providerName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  costUsd: { toString(): string };
  costEstimated: boolean;
  createdAt: Date;
  user: {
    email: string;
    name: string | null;
  };
};

function formatUsd(value: { toString(): string }) {
  const numericValue = Number(value.toString());

  if (!Number.isFinite(numericValue)) {
    return "$0.000000";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(numericValue);
}

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
}

async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/admin/dashboard/logs");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

export default async function AdminUsageLogsPage() {
  const session = await requireAdmin();
  const [logs, totalConversations, totalTokenSummary, totalCostSummary] =
    await Promise.all([
      prisma.aiUsageLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          providerName: true,
          model: true,
          inputTokens: true,
          outputTokens: true,
          durationMs: true,
          costUsd: true,
          costEstimated: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.aiUsageLog.count(),
      prisma.aiUsageLog.aggregate({
        _sum: {
          inputTokens: true,
          outputTokens: true,
        },
      }),
      prisma.aiUsageLog.aggregate({
        _sum: {
          costUsd: true,
        },
      }),
    ]);
  const usageLogs = logs as UsageLog[];
  const totalInputTokens = totalTokenSummary._sum.inputTokens ?? 0;
  const totalOutputTokens = totalTokenSummary._sum.outputTokens ?? 0;
  const totalCostUsd = totalCostSummary._sum.costUsd ?? { toString: () => "0" };

  return (
    <main className="cosmic-page cosmic-scroll-page px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
            Monitoring
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                AI usage logs
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-violet-100/75">
                Review privacy-safe conversation telemetry: username, token
                counts, response time, model, and estimated AI provider cost.
                Message contents are not shown here.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <AutoRefresh />
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#100a29]/80 px-4 py-3 text-sm text-violet-100/75 sm:flex-row sm:items-center">
                <span>
                  Signed in as{" "}
                  <span className="font-black text-white">{session.email}</span>
                </span>
                <LogoutButton className="rounded-full border border-rose-200/30 bg-rose-400/15 px-4 py-2 text-sm font-black text-rose-50 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-60" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-violet-100 transition hover:border-amber-200/40 hover:text-amber-100"
            >
              Back to admin dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Logged conversations
            </p>
            <p className="mt-4 text-5xl font-black text-white">
              {totalConversations}
            </p>
          </article>
          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Input tokens
            </p>
            <p className="mt-4 text-5xl font-black text-white">
              {totalInputTokens.toLocaleString()}
            </p>
          </article>
          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Output tokens
            </p>
            <p className="mt-4 text-5xl font-black text-white">
              {totalOutputTokens.toLocaleString()}
            </p>
          </article>
          <article className="rounded-[2rem] border border-white/15 bg-[#100a29]/80 p-6 shadow-2xl shadow-violet-950/20">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Estimated AI cost
            </p>
            <p className="mt-4 text-4xl font-black text-white">
              {formatUsd(totalCostUsd)}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08] shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
          <div className="border-b border-white/10 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Recent activity
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Last 100 AI conversations
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-[#100a29]/70 text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-black">Time</th>
                  <th className="px-5 py-4 font-black">Username</th>
                  <th className="px-5 py-4 font-black">Provider</th>
                  <th className="px-5 py-4 font-black">AI model</th>
                  <th className="px-5 py-4 font-black">Input tokens</th>
                  <th className="px-5 py-4 font-black">Output tokens</th>
                  <th className="px-5 py-4 font-black">Time taken</th>
                  <th className="px-5 py-4 font-black">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {usageLogs.map((log) => (
                  <tr key={log.id} className="align-top text-violet-100/80">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-violet-100">
                      {log.createdAt
                        .toISOString()
                        .replace("T", " ")
                        .slice(0, 19)}{" "}
                      UTC
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-black text-white">
                        {log.user.name || log.user.email}
                      </div>
                      {log.user.name ? (
                        <div className="mt-1 text-xs text-violet-100/50">
                          {log.user.email}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold">
                      {log.providerName}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-amber-100">
                      {log.model}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold">
                      {log.inputTokens.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold">
                      {log.outputTokens.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold">
                      {formatDuration(log.durationMs)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-black text-white">
                      {formatUsd(log.costUsd)}
                      {log.costEstimated ? (
                        <span className="ml-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-amber-100">
                          estimated
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {usageLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-violet-100/60"
                    >
                      No AI usage has been logged yet. New conversations will
                      appear here automatically.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
