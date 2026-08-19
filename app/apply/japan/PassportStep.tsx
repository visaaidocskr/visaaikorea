"use client";

import type { ApplyFormData } from "@/lib/visa/types";
import { DatePicker } from "@/app/apply/DatePicker";
import { Input, ChoiceGroup, PASSPORT_TYPE_OPTIONS } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Step 2 — Passport information. (These fields will later be auto-filled by
// passport OCR; the structure is ready.)
export function PassportStep({
  form,
  set,
}: {
  form: ApplyFormData;
  set: Setter;
}) {
  const { t } = useLocale();
  const today = new Date().toISOString().slice(0, 10);
  const issue = form.passport_issue_date;
  const expiry = form.passport_expiry_date;

  // Issue: past only (≤ today) and before expiry → cap at the earlier of the two.
  const issueMax = expiry && expiry < today ? expiry : today;
  // Expiry: must be after issue; future years allowed. Cap 15y out so the year
  // dropdown stays a sensible length while still exposing future years.
  const expiryMax = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 15);
    return d.toISOString().slice(0, 10);
  })();
  const expiryError =
    issue && expiry && expiry <= issue
      ? t("japan.passport.expiryError")
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("japan.passport.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("japan.passport.intro")}
        </p>
      </div>

      <ChoiceGroup
        label={t("japan.passport.type")}
        value={form.passport_type || "ordinary"}
        onChange={(v) => set("passport_type", v)}
        options={PASSPORT_TYPE_OPTIONS}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label={t("japan.passport.number")}
          value={form.passport_number}
          onChange={(v) => set("passport_number", v.toUpperCase())}
        />
        <Input
          label={t("japan.passport.placeIssue")}
          value={form.passport_place_of_issue}
          onChange={(v) => set("passport_place_of_issue", v)}
          helpText={t("japan.passport.asPrinted")}
        />
        <DatePicker
          label={t("japan.passport.issueDate")}
          value={form.passport_issue_date}
          onChange={(v) => set("passport_issue_date", v)}
          minISO="1900-01-01"
          maxISO={issueMax}
          showYearMonth
        />
        <DatePicker
          label={t("japan.passport.expiryDate")}
          value={form.passport_expiry_date}
          onChange={(v) => set("passport_expiry_date", v)}
          minISO={issue || undefined}
          maxISO={expiryMax}
          showYearMonth
          error={expiryError}
        />
        <Input
          label={t("japan.passport.authority")}
          value={form.passport_issuing_authority}
          onChange={(v) => set("passport_issuing_authority", v)}
          helpText={t("japan.passport.authorityHelp")}
        />
      </div>
    </div>
  );
}
