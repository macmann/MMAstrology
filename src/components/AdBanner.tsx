"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AdBannerProps = {
  className?: string;
  slot?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function normalizePublisherId(publisherId: string) {
  const trimmedPublisherId = publisherId.trim();

  if (!trimmedPublisherId) {
    return "";
  }

  return trimmedPublisherId.startsWith("ca-pub-") ? trimmedPublisherId : `ca-pub-${trimmedPublisherId}`;
}

export function AdBanner({ className = "", slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT }: Readonly<AdBannerProps>) {
  const adClient = useMemo(() => normalizePublisherId(process.env.NEXT_PUBLIC_ADSENSE_PID ?? ""), []);
  const adElementRef = useRef<HTMLModElement | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(!adClient);

  useEffect(() => {
    if (!adClient) {
      return;
    }

    let detectionTimer: number | undefined;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});

      detectionTimer = window.setTimeout(() => {
        const adScript = document.querySelector<HTMLScriptElement>(`script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`);
        const adElement = adElementRef.current;
        const adElementStyle = adElement ? window.getComputedStyle(adElement) : null;
        const adElementWasBlocked = adElementStyle?.display === "none" || adElementStyle?.visibility === "hidden";

        if (!adScript || adElementWasBlocked) {
          setIsUnavailable(true);
        }
      }, 1800);
    } catch {
      detectionTimer = window.setTimeout(() => setIsUnavailable(true), 0);
    }

    return () => {
      if (detectionTimer) {
        window.clearTimeout(detectionTimer);
      }
    };
  }, [adClient]);

  if (!adClient) {
    return null;
  }

  return (
    <aside className={`overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-3 shadow-xl shadow-violet-950/20 backdrop-blur ${className}`} aria-label="Advertisement">
      {isUnavailable ? (
        <div className="flex min-h-16 items-center justify-center rounded-[1.35rem] border border-dashed border-white/10 bg-[#07051a]/30 px-4 text-center text-[0.65rem] font-black uppercase tracking-[0.28em] text-violet-100/35">
          Advertisement
        </div>
      ) : (
        <ins
          ref={adElementRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adClient}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </aside>
  );
}
