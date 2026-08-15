// Token-protected print route for the Japan Document Checklist. Rendered
// headlessly by the PDF generator (same pattern as the visa form). Not linked
// anywhere; access requires a valid short-lived token.
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPrintToken } from "@/lib/docs/printToken";
import { getJapanChecklistData } from "@/lib/docs/japanChecklist";
import JapanChecklist from "@/components/forms/JapanChecklist";

export const dynamic = "force-dynamic";

export default async function JapanChecklistPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  if (!token || !verifyPrintToken(id, token)) notFound();

  const admin = createAdminClient();
  const [
    { data: application },
    { data: details },
    { data: flight },
    { data: accommodations },
    { data: previousVisits },
    { data: host },
  ] = await Promise.all([
    admin.from("applications").select("*").eq("id", id).maybeSingle(),
    admin.from("applicant_details").select("*").eq("application_id", id).maybeSingle(),
    admin.from("flight_bookings").select("*").eq("application_id", id).maybeSingle(),
    admin.from("accommodations").select("*").eq("application_id", id).order("sort_order"),
    admin.from("previous_japan_visits").select("*").eq("application_id", id).order("sort_order"),
    admin.from("japan_hosts").select("*").eq("application_id", id).maybeSingle(),
  ]);
  if (!application) notFound();

  const data = getJapanChecklistData({
    application,
    details,
    flight,
    accommodations: accommodations ?? undefined,
    previousVisits: previousVisits ?? undefined,
    host,
  });
  return <JapanChecklist data={data} />;
}
