"use client";

// Auto-read helper for the flight reservation / e-ticket upload. Mirrors
// PassportScanPanel.tsx: runs automatically the moment a file is uploaded (no
// button click needed), fills the matching fields, and stays fully editable
// afterwards. Unlike passport MRZ, e-tickets have no standard format or
// checksum — this is a best-effort heuristic read (see
// lib/ocr/reservationParse.ts) and will miss fields on many real documents,
// so it's labeled "beta" and every value is just a starting point.
import { useEffect, useRef, useState } from "react";
import { scanUploadedFlightReservation } from "@/app/apply/reservationActions";
import type { FlightReservationFields } from "@/lib/ocr/reservationParse";
import { useLocale } from "@/app/components/LocaleProvider";

export function FlightScanPanel({
  applicationId,
  flightFilename,
  onApply,
}: {
  applicationId: string;
  // Current flight-reservation filename — a scan auto-runs once on first
  // upload and re-runs if the applicant replaces the file, but not just from
  // revisiting this step, so it never silently overwrites a correction the
  // applicant already typed in.
  flightFilename?: string;
  onApply: (fields: FlightReservationFields) => void;
}) {
  const { t } = useLocale();
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FlightReservationFields | null>(null);
  const scannedForRef = useRef<string | null>(null);

  async function scan() {
    setStatus("scanning");
    setError("");
    const res = await scanUploadedFlightReservation(applicationId);
    if (!res.ok) {
      setStatus("error");
      setError(res.error);
      return;
    }
    const found = Object.values(res.fields).some(Boolean);
    if (!found) {
      setStatus("error");
      setError(
        t("scan.flightNotFound")
      );
      return;
    }
    setFields(res.fields);
    setStatus("done");
    onApply(res.fields);
  }

  useEffect(() => {
    if (!flightFilename) return;
    if (scannedForRef.current === flightFilename) return;
    scannedForRef.current = flightFilename;
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightFilename]);

  return (
    <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-blue-900">🔍 {t("scan.flightTitle")}</p>
          <p className="mt-0.5 text-xs text-blue-800/80">
            {status === "scanning"
              ? t("scan.readingReservation")
              : t("scan.flightHelp")}
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={status === "scanning"}
          className="shrink-0 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
        >
          {status === "scanning" ? t("scan.reading") : status === "idle" ? t("scan.document") : t("scan.again")}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-3 text-sm font-semibold text-amber-700">{error}</p>
      )}

      {status === "done" && fields && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3">
          <p className="text-xs font-bold text-amber-600">
            ⚠ {t("scan.warning")}
          </p>
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {fields.airline && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("booking.airline")}</dt>
                <dd className="font-semibold text-slate-900">{fields.airline}</dd>
              </div>
            )}
            {fields.flightNumber && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("booking.flightNumber")}</dt>
                <dd className="font-semibold text-slate-900">{fields.flightNumber}</dd>
              </div>
            )}
            {fields.arrivalAirportCode && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("scan.arrivalAirport")}</dt>
                <dd className="font-semibold text-slate-900">{fields.arrivalAirportCode}</dd>
              </div>
            )}
            {fields.arrivalDate && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("booking.arrivalDate")}</dt>
                <dd className="font-semibold text-slate-900">{fields.arrivalDate}</dd>
              </div>
            )}
            {fields.departureTime && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("scan.depTime")}</dt>
                <dd className="font-semibold text-slate-900">{fields.departureTime}</dd>
              </div>
            )}
            {fields.arrivalTime && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("scan.arrTime")}</dt>
                <dd className="font-semibold text-slate-900">{fields.arrivalTime}</dd>
              </div>
            )}
            {fields.returnDepartureTime && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("scan.retDepTime")}</dt>
                <dd className="font-semibold text-slate-900">{fields.returnDepartureTime}</dd>
              </div>
            )}
            {fields.returnArrivalTime && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">{t("scan.retArrTime")}</dt>
                <dd className="font-semibold text-slate-900">{fields.returnArrivalTime}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
