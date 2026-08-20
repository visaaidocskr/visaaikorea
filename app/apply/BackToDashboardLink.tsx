"use client";

// Looks like the old link, but asks the LeaveGuard first instead of
// navigating straight out of a half-finished application.
export function BackToDashboardLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("visaai:leave-request", { detail: "/dashboard" })
        )
      }
      className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
    >
      ← {label}
    </button>
  );
}
