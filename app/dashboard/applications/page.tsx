import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { statusLabel, STATUS_BADGE } from "@/lib/visa/status";
import type { ApplicationStatus } from "@/lib/visa/types";
import { getRequestLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const metadata: Metadata = { title: "My Applications · VisaAI Korea" };

export default async function MyApplicationsPage() {
  await requireUser();
  const locale = await getRequestLocale();
  const t = (key: string) => translate(locale, key);
  const supabase = await createClient();
  const { data: apps } = await supabase
    .from("applications")
    .select("id, destination_country, destination_city, status, travel_start_date, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">{t("dashboard.applications")}</h1>
        <Link
          href="/apply?new=1"
          className="rounded-2xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800"
        >
          {t("dashboard.newApplication")}
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {(apps ?? []).map((a) => (
          <Link
            key={a.id}
            // Drafts resume into the wizard; submitted apps open their status page.
            href={
              a.status === "draft"
                ? `/apply?app=${a.id}`
                : `/dashboard/applications/${a.id}`
            }
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
          >
            <div>
              <p className="font-bold">
                {[a.destination_country, a.destination_city].filter(Boolean).join(" · ") ||
                  t("dashboard.draftApplication")}
              </p>
              <p className="text-sm text-slate-500">
                {a.travel_start_date ? `${t("dashboard.travelFrom")} ${a.travel_start_date}` : t("dashboard.noTravelDate")}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[a.status as ApplicationStatus]}`}
            >
              {statusLabel(a.status as ApplicationStatus, locale)}
            </span>
          </Link>
        ))}
        {(apps ?? []).length === 0 && (
          <p className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            {t("dashboard.noApplications")}
          </p>
        )}
      </div>
    </main>
  );
}
