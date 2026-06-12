import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function UserAppLayout({ children, nextPath }: Readonly<{ children: ReactNode; nextPath: string }>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const [profile, user] = await Promise.all([
    prisma.astrologicalProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    }),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  const displayName = user?.name?.trim() || user?.email || "";
  const profileInitial = displayName ? displayName.slice(0, 1).toUpperCase() : "✦";

  return <AppShell profileInitial={profileInitial}>{children}</AppShell>;
}
