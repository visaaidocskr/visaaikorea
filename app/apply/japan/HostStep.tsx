"use client";

import type { ApplyFormData, JapanHostInput, HostType } from "@/lib/visa/types";
import { addressLanguageError } from "@/lib/visa/forms";
import { DatePicker } from "@/app/apply/DatePicker";
import { Input, ChoiceGroup, SEX_OPTIONS } from "@/app/apply/fields";

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
        <h3 className="text-xl font-bold text-slate-900">Inviter / Guarantor in Japan</h3>
        <p className="mt-1 text-sm text-slate-600">
          Only needed if someone in Japan is inviting or guaranteeing your visit.
        </p>
      </div>

      <ChoiceGroup
        label="Do you have an inviter or guarantor in Japan?"
        value={form.host_type === "" ? "" : form.host_type}
        onChange={onTypeChange}
        options={HOST_OPTIONS}
      />

      {showFields && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Input label="Full name" value={h.name} onChange={(v) => setHost({ name: v })} />
            <Input
              label="Phone number"
              value={h.phone}
              onChange={(v) => setHost({ phone: v })}
              inputMode="tel"
            />
            <Input
              label="Address in Japan"
              value={h.address}
              onChange={(v) => setHost({ address: v })}
              error={addressLanguageError(h.address)}
              helpText="Please enter the full address in English."
            />
            <Input
              label="Relationship to you"
              value={h.relationship}
              onChange={(v) => setHost({ relationship: v })}
              placeholder="e.g. friend, employer, relative"
            />
            <DatePicker
              label="Date of birth"
              value={h.date_of_birth}
              onChange={(v) => setHost({ date_of_birth: v })}
              minISO="1900-01-01"
              maxISO={new Date().toISOString().slice(0, 10)}
              required={false}
              showYearMonth
            />
            <ChoiceGroup
              label="Sex"
              value={h.sex}
              onChange={(v) => setHost({ sex: v })}
              options={SEX_OPTIONS}
              required={false}
            />
            <Input
              label="Profession / occupation"
              value={h.occupation}
              onChange={(v) => setHost({ occupation: v })}
              required={false}
            />
            <Input
              label="Nationality"
              value={h.nationality}
              onChange={(v) => setHost({ nationality: v })}
              required={false}
            />
            <Input
              label="Immigration / residence status in Japan"
              value={h.immigration_status}
              onChange={(v) => setHost({ immigration_status: v })}
              required={false}
              helpText="e.g. Japanese national, Permanent Resident, Work visa."
            />
          </div>
        </div>
      )}
    </div>
  );
}
