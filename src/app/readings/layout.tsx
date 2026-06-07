import type { ReactNode } from "react";
import { UserAppLayout } from "@/components/UserAppLayout";

export default function ReadingsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <UserAppLayout nextPath="/readings">{children}</UserAppLayout>;
}
