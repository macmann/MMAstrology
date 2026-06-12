"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLocalization, type TranslationKey } from "@/lib/localization";

type NavItem = {
  labelKey: TranslationKey;
  href: string;
  icon: (isActive: boolean) => ReactNode;
};

const navItems: NavItem[] = [
  {
    labelKey: "nav.home",
    href: "/dashboard",
    icon: (isActive) => (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="M3.75 10.85 12 4.2l8.25 6.65v8.3a1.6 1.6 0 0 1-1.6 1.6h-4.1v-5.6h-5.1v5.6h-4.1a1.6 1.6 0 0 1-1.6-1.6v-8.3Z"
          fill={isActive ? "currentColor" : "none"}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.85"
        />
      </svg>
    ),
  },
  {
    labelKey: "nav.dailyReading",
    href: "/readings",
    icon: () => (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M12 3.25a8.75 8.75 0 1 0 8.75 8.75 6.4 6.4 0 0 1-8.75-8.75Z" fill="currentColor" opacity="0.95" />
        <path d="m17.85 4.15.48 1.07 1.07.48-1.07.48-.48 1.07-.48-1.07-1.07-.48 1.07-.48.48-1.07Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    labelKey: "nav.profileReading",
    href: "/profile",
    icon: () => (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M12 2.75 14.75 9 21 12l-6.25 3L12 21.25 9.25 15 3 12l6.25-3L12 2.75Z" fill="currentColor" />
        <path d="m18.6 3.4.65 1.45 1.45.65-1.45.65-.65 1.45-.65-1.45-1.45-.65 1.45-.65.65-1.45Z" fill="currentColor" opacity="0.75" />
      </svg>
    ),
  },
  {
    labelKey: "nav.history",
    href: "/history",
    icon: () => (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="M6.15 7.2A7.8 7.8 0 1 1 4.6 12"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path d="M6.15 3.75v3.5h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M12 7.75v4.5l3.05 1.85" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    ),
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useLocalization();

  return (
    <nav className="z-30 -mx-5 shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2" aria-label="Primary">
      <div className="grid grid-cols-4 rounded-[2.25rem] border border-white/15 bg-[#170d39]/95 p-2 text-center text-[0.62rem] font-black shadow-2xl shadow-fuchsia-950/40 backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex min-h-[4.15rem] flex-col items-center justify-center gap-1 rounded-[1.65rem] px-2 py-2 transition active:scale-[0.98] ${
                isActive
                  ? "bg-amber-200/15 text-amber-100 shadow-inner shadow-amber-100/10"
                  : "text-violet-100/55 hover:bg-white/[0.06] hover:text-violet-50"
              }`}
            >
              <span className={`transition ${isActive ? "drop-shadow-[0_0_12px_rgba(253,230,138,0.45)]" : "opacity-80 group-hover:opacity-100"}`}>
                {item.icon(isActive)}
              </span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
