// POST /api/generate-documents  { applicationId: string }
// Generates a downloadable Japan daily itinerary DOCX from the client's own
// application data. Auth + RLS scoped: a user can only generate for an
// application they own (admins may access all, per the applications policies).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
// (Historical) the renderer this archive referenced was replaced by
// lib/docs/generators.ts generateItineraryDoc; kept commented so the
// archive still type-checks.
// import { renderJapanItineraryDocx } from "@/lib/docs/japanItinerary";
declare function renderJapanItineraryDocx(input: {
  applicantName: string;
  nationality: string;
  destinationCity: string;
  travelStart: string;
  travelEnd: string;
  seed: string;
}): Buffer;

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
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
