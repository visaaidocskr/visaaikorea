// POST /api/generate-documents  { applicationId: string }
// Generates a downloadable Japan daily itinerary DOCX from the client's own
// application data. Auth + RLS scoped: a user can only generate for an
// application they own (admins may access all, per the applications policies).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderJapanItineraryDocx } from "@/lib/docs/japanItinerary";
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

  // RLS restricts this select to the owner (or an admin).
  const { data: app, error } = await supabase
    .from("applications")
    .select("destination_country, destination_city, nationality, travel_start_date, travel_end_date")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) {
    console.error("[documents] Could not load application:", error.message);
    return NextResponse.json({ error: "Could not prepare the document right now." }, { status: 500 });
  }
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (app.destination_country !== "Japan") {
    return NextResponse.json(
      { error: "This endpoint currently generates Japan itineraries only." },
      { status: 400 }
    );
  }
  if (!app.travel_start_date || !app.travel_end_date) {
    return NextResponse.json({ error: "Travel dates are missing on this application." }, { status: 400 });
  }

  const { data: details } = await supabase
    .from("applicant_details")
    .select("full_name_as_passport")
    .eq("application_id", applicationId)
    .maybeSingle();

  let buffer: Buffer;
  try {
    buffer = renderJapanItineraryDocx({
      applicantName: details?.full_name_as_passport ?? "",
      nationality: app.nationality ?? "",
      destinationCity: app.destination_city ?? "Tokyo",
      travelStart: app.travel_start_date,
      travelEnd: app.travel_end_date,
      // Stable per application + dates -> reproducible, but varies per client.
      seed: `${applicationId}-${app.travel_start_date}`,
    });
  } catch (e) {
    console.error("[documents] Itinerary generation failed:", e);
    return NextResponse.json({ error: "Could not generate the itinerary right now. Please try again." }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": 'attachment; filename="japan-itinerary.docx"',
      "Cache-Control": "no-store",
    },
  });
}
