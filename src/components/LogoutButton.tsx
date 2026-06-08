"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  pendingLabel?: string;
};

export function LogoutButton({ className, label = "Log out", pendingLabel = "Logging out..." }: Readonly<LogoutButtonProps>) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isLoggingOut} className={className}>
      {isLoggingOut ? pendingLabel : label}
    </button>
  );
}
