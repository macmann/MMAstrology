import type { ReactNode } from "react";
import { UserAppLayout } from "@/components/UserAppLayout";

export default function ProfileLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <UserAppLayout nextPath="/profile">{children}</UserAppLayout>;
}
