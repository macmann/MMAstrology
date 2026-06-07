import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/dashboard");
  }

  const profile = await prisma.astrologicalProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return children;
}
