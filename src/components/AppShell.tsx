import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="cosmic-page">
      <div className="cosmic-shell grid grid-rows-[minmax(0,1fr)_auto]">
        <div className="relative min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
        <BottomNavigation />
      </div>
    </main>
  );
}
