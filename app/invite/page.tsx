import Link from "next/link";
import { Footer } from "@/app/components/landing/Footer";
import { AuroraBackdrop } from "@/app/components/landing/AuroraBackdrop";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateInvitationDraft } from "@/app/invite/actions";
import { InviteWizard } from "@/app/invite/InviteWizard";
import type { InviteFormData, InviteeInput } from "@/lib/invite/types";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Invite family to Korea",
};

export default async function InvitePage() {
  const { user, profile } = await requireUser();
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);

  const draft = await getOrCreateInvitationDraft();
  if (!draft.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-red-600">
        {draft.error}
      </main>
    );
  }
  const invitationId = draft.data!.id;

  const supabase = await createClient();
  const [{ data: inv }, { data: invitees }] = await Promise.all([
    supabase.from("invitations").select("*").eq("id", invitationId).maybeSingle(),
    supabase
      .from("invitation_invitees")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("sort_order"),
  ]);

  const initialForm: InviteFormData = {
    inviter_full_name: inv?.inviter_full_name ?? "",
    inviter_nationality: inv?.inviter_nationality ?? "Uzbekistan",
    inviter_sex: inv?.inviter_sex ?? "",
    inviter_date_of_birth: inv?.inviter_date_of_birth ?? "",
    inviter_passport_number: inv?.inviter_passport_number ?? "",
    inviter_phone: inv?.inviter_phone ?? "",
    inviter_address_korea: inv?.inviter_address_korea ?? "",
    korean_visa_status: inv?.korean_visa_status ?? "",
    inviter_org_name: inv?.inviter_org_name ?? "",
    inviter_position: inv?.inviter_position ?? "",
    inviter_org_address: inv?.inviter_org_address ?? "",
    submission_date: inv?.submission_date ?? "",
    invitation_start_date: inv?.invitation_start_date ?? "",
    invitation_end_date: inv?.invitation_end_date ?? "",
    guarantee_months: inv?.guarantee_months ?? 3,
    destination_mission:
      inv?.destination_mission ?? "Embassy of the Republic of Korea in Uzbekistan",
    reason_invitation: inv?.reason_invitation ?? "",
    reason_statement: inv?.reason_statement ?? "",
    reason_guarantee: inv?.reason_guarantee ?? "",
    requirements_ack: inv?.requirements_ack ?? false,
    client_email: inv?.client_email ?? user.email ?? "",
    invitees: (invitees ?? []).map(
      (p): InviteeInput => ({
        surname: p.surname ?? "",
        given_name: p.given_name ?? "",
        middle_name: p.middle_name ?? "",
        date_of_birth: p.date_of_birth ?? "",
        sex: p.sex ?? "",
        nationality: p.nationality ?? "Uzbekistan",
        passport_number: p.passport_number ?? "",
        address_home: p.address_home ?? "",
        phone_home: p.phone_home ?? "",
        relationship: p.relationship ?? "",
      })
    ),
  };

  return (
    <>
    <main className="relative min-h-screen px-6 py-12 text-slate-900">
      <AuroraBackdrop />
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
            ← {t("dashboard.eyebrow")}
          </Link>
          <h1 className="text-sky-gradient mt-3 text-4xl font-extrabold">{t("invite.pageTitle")}</h1>
          <p className="mt-3 text-lg text-slate-600">
            {t("invite.pageDescription")}
          </p>
        </div>

        <InviteWizard invitationId={invitationId} initialForm={initialForm} isAdmin={profile?.role === "admin"} />
      </div>
    </main>
      <Footer />
    </>
  );
}
