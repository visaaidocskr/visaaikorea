"use client";

import { useState, useTransition } from "react";
import { submitServiceEnquiry, type ServiceEnquiryInput, type ServiceKind } from "./actions";
import { useLocale } from "@/app/components/LocaleProvider";

const COUNTRIES = ["South Korea", "Uzbekistan", "Japan", "Taiwan", "Singapore", "Spain", "Vietnam", "Other"];

const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function ServiceEnquiryForm({ kind }: { kind: ServiceKind }) {
  const { t } = useLocale();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceEnquiryInput>({
    kind,
    fullName: "", residentialAddress: "", email: "", phone: "", originCountry: "South Korea", originCity: "",
    destinationCountry: "", destinationCity: "", departureDate: "", returnDate: "", travellers: 1,
    baggagePreference: "unsure", hotelStars: 3, notes: "",
  });
  const set = <K extends keyof ServiceEnquiryInput>(key: K, value: ServiceEnquiryInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const response = await submitServiceEnquiry(form);
      if (response.ok) {
        setResult(t("form.success"));
      } else setResult(response.error);
    });
  }

  const label = kind === "flight" ? t("service.flight") : t("service.tour");
  const warm = kind === "tour";
  return (
    <form
      onSubmit={submit}
      className={`enquiry-card relative space-y-7 overflow-hidden rounded-3xl p-6 sm:p-8 ${
        warm
          ? "enquiry-warm shadow-xl shadow-orange-200/50 [--edge-a:#FDBA74] [--edge-b:#C4B5FD]"
          : "shadow-xl shadow-blue-200/40 [--edge-a:#93C5FD] [--edge-b:#A5B4FC]"
      }`}
    >
      {/* Faint travel watermark in the corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-4 select-none text-8xl opacity-[.07]"
      >
        {warm ? "🎈" : "✈️"}
      </span>
      <div>
        <h2 className={`text-2xl font-extrabold ${warm ? "text-sunset-gradient" : "text-sky-gradient"}`}>
          {t("form.request")} {label.toLowerCase()}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("form.intro")}</p>
      </div>
      {result && <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.startsWith("✓") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{result}</p>}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className={`mb-1 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${warm ? "text-orange-600" : "text-blue-700"}`}><span aria-hidden className={`sparkle ${warm ? "text-amber-500" : "text-cyan-500"}`}>✦</span>{t("form.details")}</legend>
        <Field label={t("form.fullName")} required><input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputClass} autoComplete="name" /></Field>
        <Field label={t("form.email")} required><input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} autoComplete="email" /></Field>
        <Field label={t("form.phone")} required><input required value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} autoComplete="tel" /></Field>
        <Field label={t("form.address")} required><input required value={form.residentialAddress} onChange={(e) => set("residentialAddress", e.target.value)} className={inputClass} autoComplete="street-address" /></Field>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className={`mb-1 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${warm ? "text-orange-600" : "text-blue-700"}`}><span aria-hidden className={`sparkle ${warm ? "text-amber-500" : "text-cyan-500"}`}>✦</span>{t("form.travel")}</legend>
        <Field label={t("form.fromCountry")} required><CountrySelect label={t("form.selectCountry")} value={form.originCountry} onChange={(value) => set("originCountry", value)} /></Field>
        <Field label={t("form.fromCity")} required><input required value={form.originCity} onChange={(e) => set("originCity", e.target.value)} className={inputClass} placeholder={t("form.exampleSeoul")} /></Field>
        <Field label={t("form.toCountry")} required><CountrySelect label={t("form.selectCountry")} value={form.destinationCountry} onChange={(value) => set("destinationCountry", value)} /></Field>
        <Field label={t("form.toCity")}><input value={form.destinationCity} onChange={(e) => set("destinationCity", e.target.value)} className={inputClass} placeholder={t("form.exampleTokyo")} /></Field>
        <Field label={t("form.departure")} required><input required type="date" value={form.departureDate} onChange={(e) => set("departureDate", e.target.value)} className={inputClass} /></Field>
        <Field label={t("form.return")}><input type="date" min={form.departureDate || undefined} value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} className={inputClass} /></Field>
        <Field label={t("form.travellers")} required><select value={form.travellers} onChange={(e) => set("travellers", Number(e.target.value))} className={inputClass}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {t("form.travellers").toLowerCase()}</option>)}</select></Field>
        {kind === "flight" ? <Field label={t("form.baggage")}><select value={form.baggagePreference} onChange={(e) => set("baggagePreference", e.target.value as ServiceEnquiryInput["baggagePreference"])} className={inputClass}><option value="included">{t("form.baggageIncluded")}</option><option value="not_needed">{t("form.baggageNone")}</option><option value="unsure">{t("form.baggageUnsure")}</option></select></Field> : <Field label={t("form.hotel")} required><select value={form.hotelStars} onChange={(e) => set("hotelStars", Number(e.target.value) as 2 | 3 | 4 | 5)} className={inputClass}>{[2,3,4,5].map((stars) => <option key={stars} value={stars}>{t("form.starHotel").replace("{stars}", String(stars))}</option>)}</select></Field>}
      </fieldset>
      <Field label={t("form.notes")}><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} rows={4} placeholder={t("form.notesPlaceholder")} /></Field>
      <div className={`rounded-2xl border p-4 text-sm leading-relaxed ${warm ? "border-amber-200 bg-amber-50 text-amber-950" : "border-blue-100 bg-blue-50/60 text-slate-700"}`}><strong>{t("form.before")}</strong> {t("form.beforeText")}</div>
      <button disabled={pending} className={`btn-glow w-full rounded-2xl px-6 py-3.5 font-bold text-white transition disabled:cursor-wait disabled:opacity-60 ${warm ? "btn-sunset" : ""}`}><span aria-hidden className={`sparkle mr-2 ${warm ? "text-amber-200" : "text-cyan-200"}`}>✦</span>{pending ? t("form.sending") : t("action.requestQuote")}</button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-600"> *</span>}{children}</label>;
}

function CountrySelect({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <select required value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">{label}</option>{COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}</select>;
}
