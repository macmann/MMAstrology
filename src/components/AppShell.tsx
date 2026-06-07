import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="cosmic-page">
      <div className="cosmic-shell flex flex-col">
        <div className="flex min-h-screen flex-1 flex-col sm:min-h-[calc(100vh-3rem)]">
          <div className="flex-1">{children}</div>
          <BottomNavigation />
        </div>
      </div>
    </main>
  );
}
