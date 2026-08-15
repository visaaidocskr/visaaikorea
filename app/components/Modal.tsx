"use client";

import { useEffect } from "react";

// Accessible modal. variant="center" = centered dialog; variant="right" =
// slide-over panel. Closes on Escape and backdrop click; locks body scroll.
export function Modal({
  open,
  onClose,
  variant = "center",
  children,
}: {
  open: boolean;
  onClose: () => void;
  variant?: "center" | "right";
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isRight = variant === "right";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex ${
        isRight ? "justify-end" : "items-center justify-center p-4"
      }`}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 animate-fade-in backdrop-blur-sm"
      />
      <div
        className={
          isRight
            ? "relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl animate-slide-in-right sm:rounded-l-3xl"
            : "relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl animate-scale-in"
        }
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
