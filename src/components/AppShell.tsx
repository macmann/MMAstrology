import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="cosmic-page">
      <div className="cosmic-shell flex flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          <BottomNavigation />
        </div>
      </div>
    </main>
  );
}
