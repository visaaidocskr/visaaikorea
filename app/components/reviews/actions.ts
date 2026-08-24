"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestLocale } from "@/lib/locale-server";

export type ReviewContext =
  | "visa_application"
  | "flight_request"
  | "tour_request"
  | "invite_request";

export type ReviewResult = { ok: true } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Which table proves that a subject id really came from a submission, per
// flow. The public flight/tour forms have no session, so there the enquiry
// id itself — handed out only at submission time — is the proof of
// participation; guessing someone else's UUID is not feasible.
const SUBJECT_TABLE: Record<ReviewContext, { table: string; anonymous: boolean }> = {
  visa_application: { table: "applications", anonymous: false },
  flight_request: { table: "service_enquiries", anonymous: true },
  tour_request: { table: "service_enquiries", anonymous: true },
  invite_request: { table: "invitations", anonymous: false },
};

export async function submitReview(input: {
  context: ReviewContext;
  subjectId: string;
  rating: number;
  comment: string;
}): Promise<ReviewResult> {
  const spec = SUBJECT_TABLE[input.context];
  if (!spec) return { ok: false, error: "Unknown review context." };
  if (!UUID_RE.test(input.subjectId)) return { ok: false, error: "Invalid reference." };
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be between 1 and 5." };
  }
  const comment = String(input.comment ?? "").trim().slice(0, 1000);
  const locale = await getRequestLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!spec.anonymous && !user) return { ok: false, error: "Please sign in." };

  // The subject must exist — and for signed-in flows, belong to the reviewer.
  const admin = createAdminClient();
  let subjectQuery = admin.from(spec.table).select("id").eq("id", input.subjectId);
  if (!spec.anonymous) subjectQuery = subjectQuery.eq("user_id", user!.id);
  const { data: subject } = await subjectQuery.maybeSingle();
  if (!subject) return { ok: false, error: "We could not find that submission." };

  const { error } = await admin.from("reviews").insert({
    user_id: user?.id ?? null,
    context: input.context,
    subject_id: input.subjectId,
    rating,
    comment,
    locale,
  });
  if (error) {
    // The unique index turns a second attempt into a friendly no-op.
    if (error.code === "23505") return { ok: true };
    console.error("review insert failed", error.code, error.message);
    return { ok: false, error: "Could not save your rating. Please try again." };
  }
  return { ok: true };
}
