import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";

type AppShellProps = Readonly<{
  children: ReactNode;
  profileInitial?: string;
}>;

export function AppShell({ children, profileInitial = "✦" }: AppShellProps) {
  return (
    <main className="cosmic-page">
      <div className="cosmic-shell flex flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <Link
              href="/profile/settings"
              aria-label="Open profile settings"
              className="fixed right-[max(1rem,calc((100vw-430px)/2+1rem))] top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border-4 border-amber-200/25 bg-amber-200 text-sm font-black text-[#160b2f] shadow-2xl shadow-fuchsia-950/40 transition hover:scale-105 hover:bg-amber-100 active:scale-95"
            >
              {profileInitial}
            </Link>
            {children}
          </div>
          <BottomNavigation />
        </div>
      </div>
    </main>
  );
}
