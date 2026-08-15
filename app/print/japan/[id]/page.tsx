// Token-protected print route. Rendered headlessly by the PDF generator so the
// Japan visa form is produced with the real React component + Tailwind styles.
// Not linked anywhere in the UI; access requires a valid short-lived token.
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPrintToken } from "@/lib/docs/printToken";
import { toJapanVisaData } from "@/lib/docs/japanData";
import JapanVisaForm from "@/components/forms/JapanVisaForm";

export const dynamic = "force-dynamic";

export default async function JapanPrintPage({
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

  const data = toJapanVisaData({
    application,
    details,
    flight,
    accommodations: accommodations ?? undefined,
    previousVisits: previousVisits ?? undefined,
    host,
  });
  return <JapanVisaForm data={data} />;
}
