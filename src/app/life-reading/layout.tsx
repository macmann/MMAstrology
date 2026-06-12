import type { ReactNode } from "react";
import { UserAppLayout } from "@/components/UserAppLayout";

export default function LifeReadingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <UserAppLayout nextPath="/life-reading">{children}</UserAppLayout>;
}
