"use client";

import { useEffect } from "react";
import type { ApplyFormData } from "@/lib/visa/types";
import { formatName, hasNonLatinScript } from "@/lib/visa/forms";
import { DatePicker } from "@/app/apply/DatePicker";
import { Input, ChoiceGroup, SEX_OPTIONS, MARITAL_OPTIONS } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Step 1 — Personal information. Names auto-UPPERCASE (formatName), matching the
// existing applicant step. Nationality is chosen on the Destination step.
// `fatherRequired` (true only for Uzbekistan, via patronymicRule) reveals the
// Father's name / Patronymic field, stored in the shared middle_name_or_patronymic.
export function PersonalStep({
  form,
  set,
  fatherRequired,
  maritalOptions = MARITAL_OPTIONS,
  birthCityRequired = false,
  showBirthCity = false,
}: {
  form: ApplyFormData;
  set: Setter;
  fatherRequired: boolean;
  // Taiwan's form lists two more options (Separated, Other) than Japan's;
  // defaults to Japan's set so every existing call site is unaffected.
  maritalOptions?: { value: string; label: string }[];
  // Taiwan's portal form (lib/docs/taiwanData.ts REQUIRED_FIELDS) asks for the
  // city of birth; Japan's does not, so this stays optional there by default.
  birthCityRequired?: boolean;
  // Japan's official form does not require city of birth. Taiwan opts in
  // because its official portal does ask for it.
  showBirthCity?: boolean;
}) {
  const { t } = useLocale();
  // Pre-fill country of birth from the selected nationality (only when empty, so
  // it never overwrites a saved/edited value). The user can still change it.
  useEffect(() => {
    if (form.country_of_birth.trim() === "" && form.nationality.trim() !== "") {
      set("country_of_birth", form.nationality);
    }
  }, [form.nationality, form.country_of_birth, set]);

  // Latin-only check for the father's name (only when the field is shown + filled).
  const fatherError =
    fatherRequired &&
    form.middle_name_or_patronymic.trim() !== "" &&
    hasNonLatinScript(form.middle_name_or_patronymic)
      ? t("japan.personal.fatherLatin")
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("japan.personal.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("japan.personal.intro")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label={t("japan.personal.surname")}
          value={form.surname}
          onChange={(v) => set("surname", formatName(v))}
          autoComplete="family-name"
        />
        <Input
          label={t("japan.personal.givenName")}
          value={form.given_name}
          onChange={(v) => set("given_name", formatName(v))}
          autoComplete="given-name"
        />
        {fatherRequired && (
          <Input
            label={t("japan.personal.father")}
            value={form.middle_name_or_patronymic}
            onChange={(v) => set("middle_name_or_patronymic", v.toUpperCase())}
            error={fatherError}
            placeholder={t("japan.personal.fatherExample")}
            helpText={t("japan.personal.fatherHelp")}
          />
        )}
        <Input
          label={t("japan.personal.otherNames")}
          value={form.other_names}
          onChange={(v) => set("other_names", formatName(v))}
          required={false}
          helpText={t("japan.optionalOtherNames")}
        />
        <Input
          label={t("japan.personal.fullPassportName")}
          value={form.full_name_as_passport}
          onChange={(v) => set("full_name_as_passport", formatName(v))}
          autoComplete="name"
          helpText={t("japan.personal.passportLatin")}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DatePicker
          label={t("japan.dateOfBirth")}
          value={form.date_of_birth}
          onChange={(v) => set("date_of_birth", v)}
          minISO="1900-01-01"
          maxISO={new Date().toISOString().slice(0, 10)}
          showYearMonth
        />
        <ChoiceGroup
          label={t("japan.sex")}
          value={form.gender}
          onChange={(v) => set("gender", v)}
          options={SEX_OPTIONS}
        />
      </div>

      <ChoiceGroup
        label={t("japan.maritalStatus")}
        value={form.marital_status}
        onChange={(v) => set("marital_status", v)}
        options={maritalOptions}
      />

      <div>
        <h4 className="text-sm font-bold text-slate-800">{t("japan.placeOfBirth")}</h4>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          {showBirthCity && (
            <Input
              label={t("japan.city")}
              value={form.birth_city}
              onChange={(v) => set("birth_city", v)}
              required={birthCityRequired}
            />
          )}
          <Input
            label={t("japan.stateProvince")}
            value={form.birth_state}
            onChange={(v) => set("birth_state", v)}
            required={false}
            helpText={t("japan.optional")}
          />
          <Input
            label={t("japan.country")}
            value={form.country_of_birth}
            onChange={(v) => set("country_of_birth", v)}
            helpText={t("japan.personal.birthCountryHelp")}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("apply.nationality")}
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {form.nationality || t("japan.personal.setFirst")}
          </p>
        </div>
        <Input
          label={t("japan.personal.formerNationality")}
          value={form.former_nationality}
          onChange={(v) => set("former_nationality", v)}
          required={false}
          helpText={t("japan.optional")}
        />
        <Input
          label={t("japan.personal.govId")}
          value={form.home_government_id}
          onChange={(v) => set("home_government_id", v)}
          required={false}
          helpText={t("japan.personal.govIdHelp")}
        />
      </div>
    </div>
  );
}
