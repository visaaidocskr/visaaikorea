// Data shapes for the family-invitation flow (C-3-1 short-term visit to Korea).
//
// Direction of travel is the opposite of `lib/visa/types.ts`: the account
// holder stays in Korea and is the INVITER; the people who apply for the visa
// are their relatives abroad. See supabase/migrations/0009_invitations.sql.

export type InviteeInput = {
  surname: string;
  given_name: string;
  middle_name: string;
  date_of_birth: string; // YYYY-MM-DD
  sex: string; // "male" | "female" | ""
  nationality: string;
  passport_number: string;
  address_home: string;
  phone_home: string;
  // 관계 — how the invitee is related to the inviter, written from the
  // inviter's side (e.g. "mother", "father", "brother").
  relationship: string;
};

export type InviteFormData = {
  // --- Inviter (the account holder, in Korea) ------------------------------
  inviter_full_name: string;
  inviter_nationality: string;
  inviter_sex: string;
  inviter_date_of_birth: string;
  inviter_passport_number: string;
  inviter_phone: string;
  // Korean address, written in Korean — it is read by Korean officials.
  inviter_address_korea: string;
  korean_visa_status: string;
  inviter_org_name: string;
  inviter_position: string;
  inviter_org_address: string;

  // --- The visit -----------------------------------------------------------
  invitation_start_date: string;
  invitation_end_date: string;
  // The guarantee must cover the whole invitation window; 3 months is the
  // value on the sample documents and the practical default.
  guarantee_months: number;
  destination_mission: string;

  // Applicant's own words for 초청 사유서. Never auto-filled.
  invitation_reason: string;

  // --- Requirements acknowledgement ---------------------------------------
  requirements_ack: boolean;

  // --- People being invited ------------------------------------------------
  invitees: InviteeInput[];

  client_email: string;
};

export const EMPTY_INVITEE: InviteeInput = {
  surname: "",
  given_name: "",
  middle_name: "",
  date_of_birth: "",
  sex: "",
  nationality: "Uzbekistan",
  passport_number: "",
  address_home: "",
  phone_home: "",
  relationship: "",
};

export type InvitationStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "missing_documents"
  | "documents_generating"
  | "completed"
  | "cancelled";

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewing: "Under review",
  missing_documents: "Missing documents",
  documents_generating: "Preparing documents",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const INVITATION_STATUS_BADGE: Record<InvitationStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-amber-100 text-amber-700",
  missing_documents: "bg-red-100 text-red-700",
  documents_generating: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-200 text-slate-500",
};
