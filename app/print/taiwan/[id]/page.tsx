// Token-protected print route. Rendered headlessly by the PDF generator so the
// Taiwan visa reference form is produced with the real React component +
// Tailwind styles. Not linked anywhere in the UI; access requires a valid
// short-lived token. Mirrors app/print/japan/[id]/page.tsx.
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPrintToken } from "@/lib/docs/printToken";
import { toTaiwanVisaData } from "@/lib/docs/taiwanData";
import TaiwanVisaForm from "@/components/forms/TaiwanVisaForm";

export const dynamic = "force-dynamic";

export default async function TaiwanPrintPage({
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
  const [{ data: application }, { data: details }, { data: accommodations }] =
    await Promise.all([
      admin.from("applications").select("*").eq("id", id).maybeSingle(),
      admin.from("applicant_details").select("*").eq("application_id", id).maybeSingle(),
      admin.from("accommodations").select("*").eq("application_id", id).order("sort_order"),
    ]);
  if (!application) notFound();

  const data = toTaiwanVisaData({
    application,
    details,
    accommodations: accommodations ?? undefined,
  });
  return <TaiwanVisaForm data={data} />;
}
