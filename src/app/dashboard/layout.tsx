import type { ReactNode } from "react";
import { UserAppLayout } from "@/components/UserAppLayout";

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <UserAppLayout nextPath="/dashboard">{children}</UserAppLayout>;
}
