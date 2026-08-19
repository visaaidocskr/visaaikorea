"use client";

import type { ApplyFormData, JapanHostInput, HostType } from "@/lib/visa/types";
import { addressLanguageError } from "@/lib/visa/forms";
import { DatePicker } from "@/app/apply/DatePicker";
import { Input, ChoiceGroup, SEX_OPTIONS } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

const HOST_OPTIONS = [
  { value: "none", label: "No, I am travelling independently as a tourist" },
  { value: "inviter", label: "Yes, I have an inviter" },
  { value: "guarantor", label: "Yes, I have a guarantor" },
];

// Step 8 — Inviter / Guarantor. Independent tourists aren't forced to fill any
// host fields. When a host applies, we collect the fields the official form needs.
export function HostStep({
  form,
  set,
}: {
  form: ApplyFormData;
  set: Setter;
}) {
  const { t } = useLocale();
  const h = form.host;
  const setHost = (patch: Partial<JapanHostInput>) => set("host", { ...h, ...patch });
  const showFields = form.host_type === "inviter" || form.host_type === "guarantor";

  function onTypeChange(v: string) {
    const t = v as HostType;
    set("host_type", t);
    if (t === "inviter" || t === "guarantor") {
      setHost({ role: t });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("japan.host.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("japan.host.intro")}
        </p>
      </div>

      <ChoiceGroup
        label={t("japan.host.question")}
        value={form.host_type === "" ? "" : form.host_type}
        onChange={onTypeChange}
        options={HOST_OPTIONS.map((option) => ({ ...option, label: t(`japan.host.${option.value}`) }))}
      />

      {showFields && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Input label={t("japan.host.fullName")} value={h.name} onChange={(v) => setHost({ name: v })} />
            <Input
              label={t("japan.status.phone")}
              value={h.phone}
              onChange={(v) => setHost({ phone: v })}
              inputMode="tel"
            />
            <Input
              label={t("japan.host.address")}
              value={h.address}
              onChange={(v) => setHost({ address: v })}
              error={addressLanguageError(h.address)}
              helpText={t("japan.status.fullAddressEnglish")}
            />
            <Input
              label={t("japan.host.relationship")}
              value={h.relationship}
              onChange={(v) => setHost({ relationship: v })}
              placeholder={t("japan.host.relationshipExample")}
            />
            <DatePicker
              label={t("japan.dateOfBirth")}
              value={h.date_of_birth}
              onChange={(v) => setHost({ date_of_birth: v })}
              minISO="1900-01-01"
              maxISO={new Date().toISOString().slice(0, 10)}
              required={false}
              showYearMonth
            />
            <ChoiceGroup
              label={t("japan.sex")}
              value={h.sex}
              onChange={(v) => setHost({ sex: v })}
              options={SEX_OPTIONS}
              required={false}
            />
            <Input
              label={t("japan.host.occupation")}
              value={h.occupation}
              onChange={(v) => setHost({ occupation: v })}
              required={false}
            />
            <Input
              label={t("apply.nationality")}
              value={h.nationality}
              onChange={(v) => setHost({ nationality: v })}
              required={false}
            />
            <Input
              label={t("japan.host.status")}
              value={h.immigration_status}
              onChange={(v) => setHost({ immigration_status: v })}
              required={false}
              helpText={t("japan.host.statusExample")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
