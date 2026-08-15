import type { ApplicationStatus } from "@/lib/visa/types";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "draft",
  "submitted",
  "reviewing",
  "missing_documents",
  "documents_generating",
  "waiting_manual_reservations",
  "completed",
  "rejected",
  "cancelled",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewing: "Reviewing",
  missing_documents: "Missing documents",
  documents_generating: "Generating documents",
  waiting_manual_reservations: "Waiting on reservations",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

// Tailwind classes for a status badge.
export const STATUS_BADGE: Record<ApplicationStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-indigo-100 text-indigo-700",
  missing_documents: "bg-amber-100 text-amber-800",
  documents_generating: "bg-violet-100 text-violet-700",
  waiting_manual_reservations: "bg-cyan-100 text-cyan-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-200 text-slate-500",
};
