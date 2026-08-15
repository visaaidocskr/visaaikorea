"use client";

// Auto-read helper shown once the applicant has uploaded their passport
// photo page. The scan itself now runs automatically the moment a passport
// file is present — no button click required. Every field stays fully
// editable afterwards, same as if it had been typed by hand, so this is
// still just a head start, not a silent auto-submit: if the applicant
// spots a mistake, they correct it themselves.
import { useEffect, useRef, useState } from "react";
import { scanUploadedPassport } from "@/app/apply/ocrActions";
import type { ApplyFormData } from "@/lib/visa/types";
import type { PassportMrzFields } from "@/lib/ocr/passportMrz";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Central Asian passports (Uzbekistan and neighbors) have no separate MRZ
// field for the patronymic — it's appended to the given names instead, e.g.
// "SHUKHRATBEK AZIZBEK UGLI" (given name "Shukhratbek", father's name
// "Azizbek", suffix "ugli" = son of). Split it off so it lands in "Father's
// name / Patronymic" instead of being glued onto the given name.
const PATRONYMIC_SUFFIXES = new Set(["UGLI", "OGLI", "O'G'LI", "QIZI", "KIZI"]);
function splitGivenName(raw: string): { givenName: string; patronymic: string } {
  const words = raw.trim().split(/\s+/);
  const last = words[words.length - 1]?.toUpperCase();
  if (words.length >= 3 && last && PATRONYMIC_SUFFIXES.has(last)) {
    return {
      givenName: words.slice(0, -2).join(" "),
      patronymic: words.slice(-2).join(" "),
    };
  }
  return { givenName: raw, patronymic: "" };
}

const FIELD_LABELS: { key: keyof PassportMrzFields; label: string }[] = [
  { key: "fullName", label: "Full name" },
  { key: "passportNumber", label: "Passport number" },
  { key: "nationality", label: "Nationality" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "passportExpiryDate", label: "Passport expiry" },
];

export function PassportScanPanel({
  applicationId,
  passportFilename,
  set,
}: {
  applicationId: string;
  // Current passport filename, so a scan auto-runs once on first upload and
  // auto-re-runs if the applicant replaces the file — but doesn't repeat
  // (and doesn't clobber a manual correction) just from revisiting the step.
  passportFilename?: string;
  set: Setter;
}) {
  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<PassportMrzFields | null>(null);
  const [valid, setValid] = useState(false);
  const scannedForRef = useRef<string | null>(null);

  function apply(f: PassportMrzFields) {
    if (f.surname) set("surname", f.surname);
    if (f.givenName) {
      const { givenName, patronymic } = splitGivenName(f.givenName);
      set("given_name", givenName);
      if (patronymic) set("middle_name_or_patronymic", patronymic);
    }
    if (f.fullName) set("full_name_as_passport", f.fullName);
    if (f.passportNumber) set("passport_number", f.passportNumber.toUpperCase());
    if (f.nationality) set("nationality", f.nationality);
    if (f.dateOfBirth) set("date_of_birth", f.dateOfBirth);
    if (f.sex) set("gender", f.sex);
    if (f.passportExpiryDate) set("passport_expiry_date", f.passportExpiryDate);
  }

  async function scan() {
    setStatus("scanning");
    setError("");
    const res = await scanUploadedPassport(applicationId);
    if (!res.ok) {
      setStatus("error");
      setError(res.error);
      return;
    }
    setFields(res.fields);
    setValid(res.valid);
    setStatus("done");
    apply(res.fields); // fill the form immediately — still fully editable after
  }

  // Auto-run the scan the moment a passport file is present — no click
  // needed. Keyed on the filename so it fires again if the applicant
  // replaces the file, but not on every remount of an already-scanned file
  // (e.g. navigating back to this step), so it never silently overwrites a
  // correction the applicant already typed in.
  useEffect(() => {
    if (!passportFilename) return;
    if (scannedForRef.current === passportFilename) return;
    scannedForRef.current = passportFilename;
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passportFilename]);

  return (
    <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-blue-900">🔍 Auto-read from passport (beta)</p>
          <p className="mt-0.5 text-xs text-blue-800/80">
            {status === "scanning"
              ? "Reading the passport photo page…"
              : "Reads the code lines at the bottom of the photo page and fills the matching fields automatically — you can still edit them."}
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={status === "scanning"}
          className="shrink-0 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
        >
          {status === "scanning"
            ? "Reading…"
            : status === "idle"
              ? "Scan passport"
              : "Scan again"}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      {status === "done" && fields && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3">
          <p
            className={`text-xs font-bold ${valid ? "text-emerald-600" : "text-amber-600"}`}
          >
            {valid
              ? "✓ Filled in automatically — checksum OK. Review on the next step."
              : "⚠ Filled in automatically, but some fields could not be fully verified — check carefully on the next step."}
          </p>
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {FIELD_LABELS.map(({ key, label }) => {
              const v = fields[key];
              if (!v) return null;
              return (
                <div key={key} className="flex justify-between gap-3 text-sm">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-900">{v}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </div>
  );
}
