"use client";

// Shared form-field primitives used by the wizard and the Japan step components.
// Input + Select are extracted verbatim from ApplyWizard (same markup/behavior);
// ChoiceGroup is added for enum fields (sex, marital status, passport type).
import { useId } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

// Every "this field isn't done yet" message carries this attribute, so the
// wizard can jump the applicant to the first unfinished field when they press
// Continue — without any field needing to register itself. See
// FIELD_ERROR_ATTR / scrollToFirstIncompleteField in ApplyWizard.tsx.
export const FIELD_ERROR_ATTR = "data-field-incomplete";

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  error,
  helpText,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { t } = useLocale();
  const id = useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const showRequired = required && value.trim() === "" && !error;
  const describedBy =
    [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-100"
        }`}
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          {...{ [FIELD_ERROR_ATTR]: "" }}
          className="mt-1 text-xs font-semibold text-red-500"
        >
          {error}
        </p>
      ) : helpText ? (
        <>
          <p id={helpId} className="mt-1 text-xs text-slate-500">
            {helpText}
          </p>
          {/* A field can be both explained and unfinished — keep the marker
              so "jump to the first incomplete field" doesn't skip it. */}
          {showRequired && <span {...{ [FIELD_ERROR_ATTR]: "" }} className="hidden" />}
        </>
      ) : (
        showRequired && (
          <p
            {...{ [FIELD_ERROR_ATTR]: "" }}
            className="mt-1 text-xs font-semibold text-red-500"
          >
            {t("field.required")}
          </p>
        )
      )}
    </div>
  );
}

// Count words the same simple way everywhere (also used by the wizard's
// validity check) — split on whitespace, drop empty tokens.
export function countWords(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

// Free-text box with a live "X / maxWords words" counter. Optional (0 words
// is fine) but caps out at `maxWords` — going over shows an inline error
// instead of silently truncating while the applicant is still typing.
export function Textarea({
  label,
  value,
  onChange,
  helpText,
  placeholder,
  maxWords,
  rows = 5,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helpText?: string;
  placeholder?: string;
  maxWords?: number;
  rows?: number;
  required?: boolean;
}) {
  const { t } = useLocale();
  const id = useId();
  const words = countWords(value);
  const overLimit = maxWords != null && words > maxWords;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        {maxWords != null && (
          <span className={`text-xs font-semibold ${overLimit ? "text-red-500" : "text-slate-400"}`}>
            {words} / {maxWords} words
          </span>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={overLimit}
        className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition focus:outline-none focus:ring-2 ${
          overLimit
            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-blue-100"
        }`}
      />
      {overLimit ? (
        <p
          role="alert"
          {...{ [FIELD_ERROR_ATTR]: "" }}
          className="mt-1 text-xs font-semibold text-red-500"
        >
          {t("field.wordLimit").replace("{count}", String(maxWords))}
        </p>
      ) : (
        helpText && <p className="mt-1 text-xs text-slate-500">{helpText}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { value: string; label: string }>;
  required?: boolean;
}) {
  const { t } = useLocale();
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        id={id}
        value={value}
        aria-invalid={required && value === ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{t("field.select")} {label.toLowerCase()}</option>
        {options.map((option) => {
          const o = typeof option === "string" ? { value: option, label: option } : option;
          return (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
          );
        })}
      </select>
      {required && value === "" && (
        <p
          {...{ [FIELD_ERROR_ATTR]: "" }}
          className="mt-1 text-xs font-semibold text-red-500"
        >
          {t("field.required")}
        </p>
      )}
    </div>
  );
}

// Pill-style single-choice group for small enums (sex, marital status, etc.).
export function ChoiceGroup({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {required && value === "" && (
        <p
          {...{ [FIELD_ERROR_ATTR]: "" }}
          className="mt-1 text-xs font-semibold text-red-500"
        >
          {t("field.required")}
        </p>
      )}
    </div>
  );
}

// Yes/No control backed by a nullable boolean. `value === null` means unanswered
// (nothing highlighted) — used for booked? questions and the background
// declarations, which must never be pre-selected.
export function BooleanChoice({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
  required = true,
  helpText,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  required?: boolean;
  helpText?: string;
}) {
  const { t } = useLocale();
  const opt = (active: boolean, on: () => void, text: string) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={on}
      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      {text}
    </button>
  );
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="flex flex-wrap gap-2">
        {opt(value === true, () => onChange(true), yesLabel ?? t("field.yes"))}
        {opt(value === false, () => onChange(false), noLabel ?? t("field.no"))}
      </div>
      {helpText && <p className="mt-1 text-xs text-slate-500">{helpText}</p>}
      {required && value === null && (
        <p
          {...{ [FIELD_ERROR_ATTR]: "" }}
          className="mt-1 text-xs font-semibold text-red-500"
        >
          {t("field.choose")}
        </p>
      )}
    </div>
  );
}

export const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

// Taiwan's official form lists two extra options beyond Japan's set.
export const TAIWAN_MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "other", label: "Other" },
];

export const PASSPORT_TYPE_OPTIONS = [
  { value: "ordinary", label: "Ordinary" },
  { value: "diplomatic", label: "Diplomatic" },
  { value: "official", label: "Official" },
  { value: "other", label: "Other" },
];
