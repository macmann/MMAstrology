import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="cosmic-page">
      <div className="cosmic-shell flex flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
          <BottomNavigation />
        </div>
      </div>
    </main>
  );
}
