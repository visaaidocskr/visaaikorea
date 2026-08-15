"use client";

// Auto-read helper for the hotel booking confirmation upload. Mirrors
// FlightScanPanel.tsx / PassportScanPanel.tsx: runs automatically the moment
// a file is uploaded, fills the matching fields, stays fully editable. Best-
// effort heuristic read only (see lib/ocr/reservationParse.ts) — booking
// confirmations have no standard format, so this is labeled "beta".
import { useEffect, useRef, useState } from "react";
import { scanUploadedHotelReservation } from "@/app/apply/reservationActions";
import type { HotelReservationFields } from "@/lib/ocr/reservationParse";

export function HotelScanPanel({
  applicationId,
  hotelFilename,
  onApply,
}: {
  applicationId: string;
  // Same auto-run-once-per-file logic as FlightScanPanel/PassportScanPanel.
  hotelFilename?: string;
  onApply: (fields: HotelReservationFields) => void;
}) {
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<HotelReservationFields | null>(null);
  const scannedForRef = useRef<string | null>(null);

  async function scan() {
    setStatus("scanning");
    setError("");
    const res = await scanUploadedHotelReservation(applicationId);
    if (!res.ok) {
      setStatus("error");
      setError(res.error);
      return;
    }
    const found = Object.values(res.fields).some(Boolean);
    if (!found) {
      setStatus("error");
      setError(
        "Couldn't find any recognizable booking details in this document. Please fill the fields in below."
      );
      return;
    }
    setFields(res.fields);
    setStatus("done");
    onApply(res.fields);
  }

  useEffect(() => {
    if (!hotelFilename) return;
    if (scannedForRef.current === hotelFilename) return;
    scannedForRef.current = hotelFilename;
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelFilename]);

  return (
    <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-blue-900">🔍 Auto-read from booking confirmation (beta)</p>
          <p className="mt-0.5 text-xs text-blue-800/80">
            {status === "scanning"
              ? "Reading the booking document…"
              : "Tries to fill the hotel name, address, phone, and dates below — always double-check them, confirmation formats vary a lot."}
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={status === "scanning"}
          className="shrink-0 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
        >
          {status === "scanning" ? "Reading…" : status === "idle" ? "Scan document" : "Scan again"}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-3 text-sm font-semibold text-amber-700">{error}</p>
      )}

      {status === "done" && fields && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3">
          <p className="text-xs font-bold text-amber-600">
            ⚠ Best-effort read — please check every field carefully below.
          </p>
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {fields.name && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">Hotel name</dt>
                <dd className="font-semibold text-slate-900">{fields.name}</dd>
              </div>
            )}
            {fields.address && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">Address</dt>
                <dd className="font-semibold text-slate-900">{fields.address}</dd>
              </div>
            )}
            {fields.phone && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-semibold text-slate-900">{fields.phone}</dd>
              </div>
            )}
            {fields.checkIn && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">Check-in</dt>
                <dd className="font-semibold text-slate-900">{fields.checkIn}</dd>
              </div>
            )}
            {fields.checkOut && (
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-slate-500">Check-out</dt>
                <dd className="font-semibold text-slate-900">{fields.checkOut}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
