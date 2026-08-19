import Link from "next/link";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser, isSupabaseConfigured } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDraft, createFreshDraft } from "@/app/apply/actions";
import { ApplyWizard } from "@/app/apply/ApplyWizard";
import { resolveRuleset } from "@/lib/visa/rules-source";
import { resolveEmbassyClosures } from "@/lib/visa/embassyClosures-source";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import {
  EMPTY_FLIGHT,
  EMPTY_HOST,
  EMPTY_BACKGROUND,
  EMPTY_TAIWAN_BACKGROUND,
} from "@/lib/visa/types";
import type {
  ApplyFormData,
  CompanionInput,
  AccommodationInput,
  PreviousJapanVisit,
} from "@/lib/visa/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function resolveOwnedId(
  supabase: SupabaseServerClient,
  appId: string
): Promise<string> {
  const { data } = await supabase
    .from("applications")
    .select("id")
    .eq("id", appId)
    .maybeSingle();
  return data?.id ?? "";
}

async function loadDraftData(supabase: SupabaseServerClient, id: string) {
  const rows = await Promise.all([
    supabase.from("applications").select("*").eq("id", id).maybeSingle(),
    supabase.from("applicant_details").select("*").eq("application_id", id).maybeSingle(),
    supabase.from("companions").select("*").eq("application_id", id),
    supabase.from("uploaded_files").select("file_type, original_filename").eq("application_id", id),
    supabase.from("flight_bookings").select("*").eq("application_id", id).maybeSingle(),
    supabase.from("accommodations").select("*").eq("application_id", id).order("sort_order"),
    supabase.from("previous_japan_visits").select("*").eq("application_id", id).order("sort_order"),
    supabase.from("japan_hosts").select("*").eq("application_id", id).maybeSingle(),
  ]);
  const [a, d, c, f, flight, accs, visits, host] = rows;
  return {
    app: a.data,
    details: d.data,
    companions: c.data ?? [],
    files: f.data ?? [],
    flight: flight.data,
    accommodations: accs.data ?? [],
    visits: visits.data ?? [],
    host: host.data,
  };
}

export const metadata: Metadata = { title: "New Application · VisaAI Korea" };

function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <div className="max-w-lg rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-2xl font-extrabold">Supabase not configured yet</h1>
        <p className="mt-3 text-slate-700">
          The application form needs a Supabase project. Add your keys to{" "}
          <code className="rounded bg-white px-1">.env.local</code> and run the
          SQL migrations, then reload this page.
        </p>
        <Link href="/" className="mt-6 inline-block font-semibold text-blue-700">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

export default async function ApplyPage({
  searchParams,
}: {
  // `step` lets us deep-link into a specific wizard step — used by the
  // "Open my application to fix this" button on the client's application
  // page, which should land on the fields/uploads, not back on Destination.
  searchParams: Promise<{ new?: string; app?: string; step?: string }>;
}) {
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { user } = await requireUser();
  const sp = await searchParams;

  // "New application" → create a fresh, EMPTY draft, then drop the query param
  // so a new application never inherits previous data.
  if (sp?.new) {
    const fresh = await createFreshDraft();
    if (fresh.ok) redirect("/apply");
  }

  const supabase = await createClient();

  // Obtain the draft id: resume ?app= (owner-scoped), else the latest/create one.
  // This is always a real persisted row, so uploads/saves reference a valid id.
  let applicationId = "";
  if (sp?.app) {
    applicationId = await resolveOwnedId(supabase, sp.app);
  }
  if (!applicationId) {
    const draft = await getOrCreateDraft();
    if (!draft.ok) {
      return (
        <main className="flex min-h-screen items-center justify-center px-6 text-center text-red-600">
          {draft.error}
        </main>
      );
    }
    applicationId = draft.data!.id;
  }

  // Load the persisted draft's saved data.
  const { app, details, companions, files, flight, accommodations, visits, host } =
    await loadDraftData(supabase, applicationId);

  const initialForm: ApplyFormData = {
    destination_country: app?.destination_country ?? "",
    destination_city: app?.destination_city ?? "",
    nationality: app?.nationality ?? details?.nationality ?? "",
    surname: details?.surname ?? "",
    given_name: details?.given_name ?? "",
    middle_name_or_patronymic: details?.middle_name_or_patronymic ?? "",
    full_name_as_passport: details?.full_name_as_passport ?? "",
    client_phone: app?.client_phone ?? "",
    client_email: app?.client_email ?? user.email ?? "",
    korean_visa_status: app?.korean_visa_status ?? "",
    current_korea_address: app?.current_korea_address ?? "",
    korea_region: app?.city_region_detected ?? "",
    planned_submission_date: app?.planned_submission_date ?? "",
    travel_start_date: app?.travel_start_date ?? "",
    travel_end_date: app?.travel_end_date ?? "",
    trip_reason: app?.trip_reason ?? "",
    companions: (companions ?? []).map(
      (c): CompanionInput => ({
        full_name: c.full_name ?? "",
        nationality: c.nationality ?? "",
        relationship: c.relationship ?? "",
        passport_number: c.passport_number ?? "",
        is_family_member: c.is_family_member ?? false,
      })
    ),

    // --- Japan application fields (0006) -----------------------------------
    other_names: details?.other_names ?? "",
    former_nationality: details?.former_nationality ?? "",
    date_of_birth: details?.date_of_birth ?? "",
    birth_city: details?.birth_city ?? "",
    birth_state: details?.birth_state ?? "",
    country_of_birth: details?.country_of_birth ?? "",
    gender: details?.gender ?? "",
    marital_status: details?.marital_status ?? "",
    home_government_id: details?.home_government_id ?? "",

    passport_type: details?.passport_type ?? "",
    passport_number: details?.passport_number ?? "",
    passport_place_of_issue: details?.passport_place_of_issue ?? "",
    passport_issue_date: details?.passport_issue_date ?? "",
    passport_issuing_authority: details?.passport_issuing_authority ?? "",
    passport_expiry_date: details?.passport_expiry_date ?? "",

    occupation: details?.occupation ?? "",
    position_title: details?.position_title ?? "",
    employer_or_school_name: details?.employer_or_school_name ?? "",
    employer_or_school_address: details?.employer_or_school_address ?? "",
    employer_phone: details?.employer_phone ?? "",
    mobile: details?.mobile ?? "",

    travel_purpose: app?.travel_purpose ?? "",
    port_of_entry: app?.port_of_entry ?? "",

    flight_booked: app?.flight_booked ?? null,
    flight: flight
      ? {
          airline: flight.airline ?? "",
          flight_number: flight.flight_number ?? "",
          departure_airport: flight.departure_airport ?? "",
          arrival_airport: flight.arrival_airport ?? "",
          departure_date: flight.departure_date ?? "",
          arrival_date: flight.arrival_date ?? "",
          return_airline: flight.return_airline ?? "",
          return_flight_number: flight.return_flight_number ?? "",
          return_date: flight.return_date ?? "",
        }
      : { ...EMPTY_FLIGHT },

    accommodation_booked: app?.accommodation_booked ?? null,
    accommodations: (accommodations ?? []).map(
      (h): AccommodationInput => ({
        name: h.name ?? "",
        address: h.address ?? "",
        phone: h.phone ?? "",
        check_in: h.check_in ?? "",
        check_out: h.check_out ?? "",
      })
    ),

    has_previous_japan_visits: app?.has_previous_japan_visits ?? null,
    previous_japan_visits: (visits ?? []).map(
      (v): PreviousJapanVisit => ({
        visited_from: v.visited_from ?? "",
        visited_to: v.visited_to ?? "",
        duration_note: v.duration_note ?? "",
      })
    ),

    host_type: app?.host_type ?? "",
    host: host
      ? {
          role: host.role ?? "",
          same_as_guarantor: host.same_as_guarantor ?? false,
          name: host.name ?? "",
          address: host.address ?? "",
          phone: host.phone ?? "",
          date_of_birth: host.date_of_birth ?? "",
          sex: host.sex ?? "",
          relationship: host.relationship ?? "",
          occupation: host.occupation ?? "",
          nationality: host.nationality ?? "",
          immigration_status: host.immigration_status ?? "",
        }
      : { ...EMPTY_HOST },

    spouse_or_parent_occupation: details?.spouse_or_parent_occupation ?? "",
    remarks: app?.remarks ?? "",
    background_answers: app?.background_answers ?? { ...EMPTY_BACKGROUND },

    // --- Taiwan application fields (0007) -----------------------------------
    home_country_address: details?.home_country_address ?? "",
    home_country_phone: details?.home_country_phone ?? "",
    taiwan_travel_purpose: app?.taiwan_travel_purpose ?? "",
    taiwan_travel_purpose_other: app?.taiwan_travel_purpose_other ?? "",
    taiwan_background_answers:
      app?.taiwan_background_answers ?? { ...EMPTY_TAIWAN_BACKGROUND },

    // --- Vietnam application fields (0012) -----------------------------------
    vietnam_family_member_name: details?.vietnam_family_member_name ?? "",
    vietnam_family_member_phone: details?.vietnam_family_member_phone ?? "",
    vietnam_family_member_address: details?.vietnam_family_member_address ?? "",
    vietnam_family_member_relationship:
      details?.vietnam_family_member_relationship ?? "",
    vietnam_family_member_relationship_other:
      details?.vietnam_family_member_relationship_other ?? "",
    vietnam_insurance_purchased: app?.vietnam_insurance_purchased ?? null,
    vietnam_financing_source: details?.vietnam_financing_source ?? "",
    vietnam_financier_name: details?.vietnam_financier_name ?? "",
    vietnam_financier_relationship: details?.vietnam_financier_relationship ?? "",
    vietnam_financier_phone: details?.vietnam_financier_phone ?? "",
    vietnam_financier_address: details?.vietnam_financier_address ?? "",
    vietnam_express_requested: app?.vietnam_express_requested ?? null,
  };

  const initialUploads: Record<string, string> = {};
  for (const f of files ?? []) {
    initialUploads[f.file_type] = f.original_filename ?? "Uploaded";
  }

  // Resolve the visa ruleset server-side (DB overrides over code defaults).
  const [ruleset, japanEmbassyClosures] = await Promise.all([
    resolveRuleset(),
    resolveEmbassyClosures("Japan"),
  ]);

  return (
    <main className="relative min-h-screen px-6 py-12 text-slate-900">
      <AuroraBackdrop />
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
              ← {t("apply.backDashboard")}
            </Link>
            <LanguageSelector />
          </div>
          <h1 className="text-sky-gradient mt-3 text-4xl font-extrabold">{t("apply.title")}</h1>
          <p className="mt-3 text-lg text-slate-600">
            {t("apply.autosave")}
          </p>
        </div>

        <ApplyWizard
          applicationId={applicationId}
          userId={user.id}
          initialForm={initialForm}
          initialUploads={initialUploads}
          ruleset={ruleset}
          japanEmbassyClosures={japanEmbassyClosures}
          initialStepName={sp?.step}
        />
      </div>
    </main>
  );
}
