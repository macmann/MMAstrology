import type { ReactNode } from "react";
import { UserAppLayout } from "@/components/UserAppLayout";

export default function HistoryLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <UserAppLayout nextPath="/history">{children}</UserAppLayout>;
}
