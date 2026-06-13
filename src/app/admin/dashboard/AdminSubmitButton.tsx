"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type AdminSubmitButtonProps = {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
  pendingText?: string;
  successText?: string;
};

export function AdminSubmitButton({
  children,
  className,
  disabled = false,
  pendingText = "Saving...",
  successText = "Saved successfully.",
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();
  const wasPendingRef = useRef(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (pending) {
      wasPendingRef.current = true;
      return;
    }

    if (wasPendingRef.current) {
      wasPendingRef.current = false;
      const showTimeoutId = window.setTimeout(() => {
        setShowSuccessToast(true);
      }, 0);
      const hideTimeoutId = window.setTimeout(() => {
        setShowSuccessToast(false);
      }, 3500);

      return () => {
        window.clearTimeout(showTimeoutId);
        window.clearTimeout(hideTimeoutId);
      };
    }
  }, [pending]);

  return (
    <>
      <button
        type="submit"
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={() => setShowSuccessToast(false)}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="inline-flex items-center justify-center gap-2">
          {pending ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          ) : null}
          {pending ? pendingText : children}
        </span>
      </button>
      {showSuccessToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 max-w-sm rounded-2xl border border-emerald-200/30 bg-emerald-500/95 px-4 py-3 text-sm font-black text-emerald-50 shadow-2xl shadow-black/30 backdrop-blur"
        >
          {successText}
        </div>
      ) : null}
    </>
  );
}
