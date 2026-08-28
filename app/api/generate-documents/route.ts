// POST /api/generate-documents  { applicationId: string }
// Generates the Schedule of Stay DOCX from the client's own application
// data — the same generator the admin package uses, so every path produces
// the same document. Auth + RLS scoped: a user can only generate for an
// application they own (admins may access all, per the applications policies).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateItineraryDoc } from "@/lib/docs/generators";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const limit = enforceRateLimit(`itinerary:${user.id}`, { limit: 8, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many document requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { applicationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const applicationId = body.applicationId?.trim();
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
  }

  // RLS restricts these selects to the owner (or an admin).
  const { data: app, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) {
    console.error("[documents] Could not load application:", error.message);
    return NextResponse.json({ error: "Could not prepare the document right now." }, { status: 500 });
  }
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (!app.travel_start_date || !app.travel_end_date) {
    return NextResponse.json({ error: "Travel dates are missing on this application." }, { status: 400 });
  }

  const [{ data: details }, { data: companions }, { data: flight }, { data: accommodations }] =
    await Promise.all([
      supabase.from("applicant_details").select("*").eq("application_id", applicationId).maybeSingle(),
      supabase.from("companions").select("*").eq("application_id", applicationId),
      supabase.from("flight_bookings").select("*").eq("application_id", applicationId).maybeSingle(),
      supabase.from("accommodations").select("*").eq("application_id", applicationId).order("sort_order"),
    ]);

  let buffer: Buffer;
  try {
    buffer = await generateItineraryDoc({
      application: app,
      details,
      companions: companions ?? [],
      flight,
      accommodations: accommodations ?? [],
    });
  } catch (e) {
    console.error("[documents] Itinerary generation failed:", e);
    return NextResponse.json({ error: "Could not generate the itinerary right now. Please try again." }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": `attachment; filename="${(app.destination_country || "travel").toLowerCase()}-schedule-of-stay.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
