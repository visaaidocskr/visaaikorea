"use client";

import { useState } from "react";
import type { ApplyFormData, DocumentRequirement } from "@/lib/visa/types";
import { visaStatusCode } from "@/lib/visa/config";
import {
  addressLanguageError,
  isValidEmail,
  hasNonLatinScript,
  isCompleteAddress,
} from "@/lib/visa/forms";
import { Input, Select } from "@/app/apply/fields";
import { UploadField } from "@/app/apply/UploadField";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Common fields of study for student visa holders. "Other" reveals a free-text
// input so any value can still be entered (and previously-saved custom values
// load back correctly). Stored in the existing applicant_details.occupation.
const FIELDS_OF_STUDY = [
  "Business Administration",
  "International Business",
  "Global Studies / International Studies",
  "Communication / Media",
  "Computer Science / Information Technology",
  "Software Engineering",
  "Engineering",
  "Economics",
  "Finance / Accounting",
  "Marketing",
  "Korean Language",
  "Education",
  "Hospitality / Tourism",
  "Design / Arts",
  "Social Sciences",
  "Natural Sciences",
  "Healthcare / Medicine",
  "Law",
];
const OTHER_FIELD = "Other";

// Classify the Korean visa status so we ask for the right employer/school info.
export function employmentKind(
  status: string
): "university" | "employer" | "jobseeking" | "other" {
  const code = visaStatusCode(status);
  if (code === "D-2" || code === "D-4") return "university";
  if (code === "D-10") return "jobseeking";
  if (code.startsWith("E") || ["D-7", "D-8", "D-9"].includes(code)) return "employer";
  return "other";
}

// Step 3 — Status in Korea. Employer/university fields are conditional on the
// Korean visa status (D-2/D-4 → university, E-series → employer, D-10 → prior).
export function KoreaStatusStep({
  form,
  set,
  koreanVisaTypes,
  applicationId,
  userId,
  uploads,
  onUploaded,
  statusDocs,
  showContactFields = true,
}: {
  form: ApplyFormData;
  set: Setter;
  koreanVisaTypes: string[];
  applicationId: string;
  userId: string;
  uploads: Record<string, string>;
  onUploaded: (fileType: string, filename: string) => void;
  // Status-specific required documents (e.g. Enrollment Certificate for a
  // D-2 student), pre-filtered for the current korean_visa_status — computed
  // once in ApplyWizard.tsx (also reused by SeoulChecklistModal) and passed
  // down rather than recomputed here.
  statusDocs: DocumentRequirement[];
  // The generic (Singapore/Spain) flow already asks phone/mobile/email/Korea
  // address earlier on the same "Applicant" page, so this step only adds the
  // visa-status-specific fields there — set to false to skip the duplicate
  // contact inputs. Japan/Taiwan's rich flow (where this is a dedicated step
  // and those fields aren't asked anywhere else) keeps the default of true.
  showContactFields?: boolean;
}) {
  const { t } = useLocale();
  const kind = employmentKind(form.korean_visa_status);
  const orgLabel =
    kind === "university"
      ? t("japan.status.school")
      : kind === "jobseeking"
        ? t("japan.status.recentOrg")
        : t("japan.status.employer");
  // University + employer sections require all org fields; D-10 (jobseeking)
  // keeps them optional so we don't force employment on a job seeker.
  const orgRequired = kind === "university" || kind === "employer";

  // Field-of-study "Other" mode. Seeded from the loaded value so a previously
  // saved custom field of study shows the free-text input on return.
  const [studyOther, setStudyOther] = useState(
    form.occupation !== "" && !FIELDS_OF_STUDY.includes(form.occupation)
  );
  const studySelectValue = studyOther
    ? OTHER_FIELD
    : FIELDS_OF_STUDY.includes(form.occupation)
      ? form.occupation
      : "";
  function onStudyChange(v: string) {
    if (v === OTHER_FIELD) {
      setStudyOther(true);
      // Clear only a preset value so the applicant types fresh; keep an
      // already-custom value.
      if (FIELDS_OF_STUDY.includes(form.occupation)) set("occupation", "");
    } else {
      setStudyOther(false);
      set("occupation", v);
    }
  }

  const addr = form.current_korea_address;
  const addressError =
    addr.trim() === ""
      ? t("japan.status.addressRequired")
      : hasNonLatinScript(addr)
        ? t("japan.status.addressEnglish")
        : !isCompleteAddress(addr)
          ? t("japan.status.addressComplete")
          : undefined;
  const emailError =
    form.client_email.trim() !== "" && !isValidEmail(form.client_email)
      ? t("japan.status.emailInvalid")
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("japan.status.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("japan.status.intro")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label={t("japan.status.visaStatus")}
          value={form.korean_visa_status}
          onChange={(v) => set("korean_visa_status", v)}
          options={koreanVisaTypes}
        />
        {showContactFields && (
          <>
            <Input
              label={t("japan.status.address")}
              value={form.current_korea_address}
              onChange={(v) => set("current_korea_address", v)}
              error={addressError}
              helpText={t("japan.status.addressHelp")}
            />
            <Input
              label={t("japan.status.phone")}
              value={form.client_phone}
              onChange={(v) => set("client_phone", v)}
              autoComplete="tel"
              inputMode="tel"
            />
            <Input
              label={t("japan.status.mobile")}
              value={form.mobile}
              onChange={(v) => set("mobile", v)}
              required={false}
              inputMode="tel"
              helpText={t("japan.status.mobileHelp")}
            />
            <Input
              label={t("japan.status.email")}
              value={form.client_email}
              onChange={(v) => set("client_email", v)}
              type="email"
              autoComplete="email"
              error={emailError}
            />
          </>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-800">
          {kind === "university" ? t("japan.status.study") : t("japan.status.occupation")}
        </h4>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          {kind === "university" ? (
            <>
              <Select
                label={t("japan.status.study")}
                value={studySelectValue}
                onChange={onStudyChange}
                required
                options={[...FIELDS_OF_STUDY, OTHER_FIELD].map((value) => ({ value, label: value === OTHER_FIELD ? t("japan.status.other") : value }))}
              />
              {studyOther && (
                <Input
                  label={t("japan.status.enterStudy")}
                  value={form.occupation}
                  onChange={(v) => set("occupation", v)}
                />
              )}
            </>
          ) : (
            <>
              <Input
                label={t("japan.status.occupation")}
                value={form.occupation}
                onChange={(v) => set("occupation", v)}
                required={kind === "employer"}
                helpText={kind === "employer" ? undefined : t("japan.status.occupationHelp")}
              />
              <Input
                label={t("japan.status.position")}
                value={form.position_title}
                onChange={(v) => set("position_title", v)}
                required={kind === "employer"}
                helpText={kind === "employer" ? undefined : t("japan.optional")}
              />
            </>
          )}
        </div>
      </div>

      {kind !== "other" && (
        <div>
          <h4 className="text-sm font-bold text-slate-800">{orgLabel}</h4>
          {kind === "jobseeking" && (
            <p className="mt-1 text-xs text-slate-500">
              {t("japan.status.jobSeekingHelp")}
            </p>
          )}
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <Input
              label={`${orgLabel} — ${t("japan.status.name")}`}
              value={form.employer_or_school_name}
              onChange={(v) => set("employer_or_school_name", v)}
              required={orgRequired}
            />
            <Input
              label={`${orgLabel} — ${t("japan.status.phone")}`}
              value={form.employer_phone}
              onChange={(v) => set("employer_phone", v)}
              required={orgRequired}
              inputMode="tel"
            />
            <Input
              label={`${orgLabel} — ${t("japan.status.orgAddress")}`}
              value={form.employer_or_school_address}
              onChange={(v) => set("employer_or_school_address", v)}
              required={orgRequired}
              error={addressLanguageError(form.employer_or_school_address)}
              helpText={t("japan.status.fullAddressEnglish")}
            />
          </div>
        </div>
      )}

      {/* Documents required specifically because of the chosen visa status
          (e.g. an Enrollment Certificate for a D-2 student, a Business
          Registration Certificate for an employer) — asked right here, next
          to the university/employer fields that make them relevant, instead
          of a separate later step disconnected from this context. */}
      {statusDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            {t("japan.status.documentsFor").replace("{status}", visaStatusCode(form.korean_visa_status) || t("japan.status.yourVisaStatus"))}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {t("japan.status.documentsHelp")}
          </p>
          <div className="mt-3 grid gap-6 md:grid-cols-2">
            {statusDocs.map((doc) => (
              <UploadField
                key={doc.key}
                applicationId={applicationId}
                userId={userId}
                fileType={doc.key}
                label={doc.labelEn}
                labelKo={doc.labelKo}
                hint={doc.hint}
                required={doc.required}
                initialFilename={uploads[doc.key]}
                onUploaded={onUploaded}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
