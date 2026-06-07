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

  const profile = await prisma.astrologicalProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
