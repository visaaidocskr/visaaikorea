"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { DatePicker } from "@/app/apply/DatePicker";
import { submitServiceEnquiry } from "@/app/services/actions";
import { searchCities, type CityEntry } from "@/lib/travel/airports";
import { useLocale } from "@/app/components/LocaleProvider";
import { EnquirySuccess } from "@/app/components/reviews/EnquirySuccess";

// Trip.com-style flight request: typed letters resolve to cities and their
// airports, the trip can be one-way / round-trip / multi-city, and the whole
// structured itinerary flows into the existing service-enquiry pipeline
// (primary leg in the dedicated columns, the full picture in notes).

type Place = { city: string; country: string; code?: string };
type Leg = { from: Place | null; to: Place | null; date: string };

const todayISO = () => new Date().toISOString().slice(0, 10);
const placeLabel = (p: Place | null) => (p ? (p.code ? `${p.city} (${p.code})` : p.city) : "");

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

/** Bolds the first case-insensitive occurrence of the query. */
function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="text-blue-700">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

type Option =
  | { kind: "city"; entry: CityEntry }
  | { kind: "airport"; entry: CityEntry; code: string; name: string };

function AirportField({
  placeholder,
  value,
  onSelect,
  invalid,
}: {
  placeholder: string;
  value: Place | null;
  onSelect: (p: Place | null) => void;
  invalid?: boolean;
}) {
  const { t } = useLocale();
  const listId = useId();
  const [text, setText] = useState(placeLabel(value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [prevValue, setPrevValue] = useState(value);

  // Derived-state sync: when the parent swaps values (⇄ button), adopt the
  // new label. Setting state during render is React's endorsed pattern here.
  if (prevValue !== value) {
    setPrevValue(value);
    setText(placeLabel(value));
  }

  const query = text.trim();
  const options = useMemo<Option[]>(() => {
    const groups = searchCities(query);
    const flat: Option[] = [];
    for (const entry of groups) {
      flat.push({ kind: "city", entry });
      for (const a of entry.airports) flat.push({ kind: "airport", entry, code: a.code, name: a.name });
    }
    return flat;
  }, [query]);

  function choose(opt: Option) {
    const place: Place =
      opt.kind === "city"
        ? { city: opt.entry.city, country: opt.entry.country }
        : { city: opt.entry.city, country: opt.entry.country, code: opt.code };
    onSelect(place);
    setPrevValue(place);
    setText(placeLabel(place));
    setOpen(false);
  }

  return (
    <div className="relative flex-1">
      <input
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onSelect(null);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || options.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(options[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={`${inputBase} ${invalid ? "border-red-400" : "border-slate-300"}`}
      />
      {open && query.length >= 2 && (
        <div id={listId} className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
          {options.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-500">{t("fs.noMatch")}</p>
          )}
          {options.map((opt, i) => (
            <button
              key={opt.kind === "city" ? `c-${opt.entry.city}` : `a-${opt.code}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                choose(opt);
              }}
              onMouseEnter={() => setActive(i)}
              className={`block w-full text-left ${i === active ? "bg-blue-50" : ""}`}
            >
              {opt.kind === "city" ? (
                <span className="flex items-start gap-3 px-4 py-2.5">
                  <span aria-hidden className="mt-0.5">📍</span>
                  <span>
                    <span className="text-sm font-bold text-slate-900">
                      <Highlight text={opt.entry.city} q={query} /> · {t("fs.allAirports")}
                    </span>
                    <span className="block text-xs text-slate-500">
                      <Highlight text={opt.entry.country} q={query} />
                    </span>
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-3 py-2 pl-11 pr-4">
                  <span aria-hidden>✈️</span>
                  <span className="text-sm text-slate-700">
                    <strong className="mr-1.5 text-blue-700">
                      <Highlight text={opt.code} q={query} />
                    </strong>
                    <Highlight text={opt.name} q={query} />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlightSearchForm() {
  const { t } = useLocale();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const [tripType, setTripType] = useState<"round" | "oneway" | "multi">("round");
  const [nonstop, setNonstop] = useState(false);
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [depart, setDepart] = useState("");
  const [ret, setRet] = useState("");
  const [legs, setLegs] = useState<Leg[]>([
    { from: null, to: null, date: "" },
    { from: null, to: null, date: "" },
  ]);
  const [travellers, setTravellers] = useState(1);
  const [cabin, setCabin] = useState<"economy" | "premium" | "business" | "first">("economy");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [baggage, setBaggage] = useState<"included" | "not_needed" | "unsure">("unsure");
  const [notes, setNotes] = useState("");

  const setLeg = (i: number, patch: Partial<Leg>) =>
    setLegs((all) => all.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const flightsOk =
    tripType === "multi"
      ? legs.every((l) => l.from && l.to && l.date)
      : Boolean(from && to && depart && (tripType === "oneway" || ret));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setResult(null);
    if (!flightsOk) return;

    const primary: Leg = tripType === "multi" ? legs[0] : { from, to, date: depart };
    const cabinLabel = t(`fs.${cabin}`);
    const tripLabel =
      tripType === "round" ? t("fs.roundTrip") : tripType === "oneway" ? t("fs.oneWay") : t("fs.multiCity");
    const lines = [
      `[Flight request] ${tripLabel}${nonstop ? " · nonstop only" : ""} · ${cabinLabel} · ${travellers} pax`,
      ...(tripType === "multi"
        ? legs.map((l, i) => `Leg ${i + 1}: ${placeLabel(l.from)} → ${placeLabel(l.to)}, ${l.date}`)
        : [
            `Route: ${placeLabel(from)} → ${placeLabel(to)}, ${depart}${
              tripType === "round" ? ` — ${ret}` : ""
            }`,
          ]),
    ];

    startTransition(async () => {
      const response = await submitServiceEnquiry({
        kind: "flight",
        fullName,
        residentialAddress: "",
        email,
        phone,
        originCountry: primary.from!.country,
        originCity: placeLabel(primary.from),
        destinationCountry: primary.to!.country,
        destinationCity: placeLabel(primary.to),
        departureDate: primary.date,
        returnDate: tripType === "round" ? ret : "",
        travellers,
        baggagePreference: baggage,
        notes: [lines.join("\n"), notes.trim()].filter(Boolean).join("\n\n"),
      });
      setResult(response.ok ? t("form.success") : response.error);
      setEnquiryId(response.ok ? response.id : null);
    });
  }

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const radio = (checked: boolean) =>
    `flex cursor-pointer items-center gap-2 text-sm font-semibold ${
      checked ? "text-blue-700" : "text-slate-600 hover:text-slate-900"
    }`;

  if (enquiryId) {
    return (
      <EnquirySuccess
        context="flight_request"
        enquiryId={enquiryId}
        onReset={() => {
          setEnquiryId(null);
          setResult(null);
        }}
      />
    );
  }

  return (
    <form
      onSubmit={submit}
      className="enquiry-card relative space-y-6 overflow-hidden rounded-3xl p-6 shadow-xl shadow-blue-200/40 sm:p-8 [--edge-a:#93C5FD] [--edge-b:#A5B4FC]"
    >
      <span aria-hidden className="pointer-events-none absolute -right-3 -top-4 select-none text-8xl opacity-[.07]">
        ✈️
      </span>

      <div>
        <h2 className="text-sky-gradient text-2xl font-extrabold">
          {t("form.request")} {t("service.flight").toLowerCase()}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("form.intro")}</p>
      </div>

      {result && !result.startsWith("✓") && (
        <p role="status" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {result}
        </p>
      )}


      {/* Trip type */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {(
          [
            ["round", t("fs.roundTrip")],
            ["oneway", t("fs.oneWay")],
            ["multi", t("fs.multiCity")],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className={radio(tripType === value)}>
            <input
              type="radio"
              name="tripType"
              checked={tripType === value}
              onChange={() => setTripType(value)}
              className="h-4 w-4 accent-blue-600"
            />
            {label}
          </label>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={nonstop}
            onChange={(e) => setNonstop(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-600"
          />
          {t("fs.nonstop")}
        </label>
      </div>

      {/* Route */}
      {tripType !== "multi" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AirportField
              placeholder={t("fs.from")}
              value={from}
              onSelect={setFrom}
              invalid={tried && !from}
            />
            <button
              type="button"
              onClick={swap}
              aria-label={t("fs.swap")}
              title={t("fs.swap")}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-300 text-blue-600 transition hover:rotate-180 hover:border-blue-400"
            >
              ⇄
            </button>
            <AirportField
              placeholder={t("fs.to")}
              value={to}
              onSelect={setTo}
              invalid={tried && !to}
            />
          </div>
          <div className={`grid gap-4 ${tripType === "round" ? "sm:grid-cols-2" : ""}`}>
            <DatePicker
              label={t("form.departure")}
              value={depart}
              onChange={(iso) => {
                setDepart(iso);
                if (ret && ret < iso) setRet("");
              }}
              minISO={todayISO()}
              error={tried && !depart ? " " : undefined}
            />
            {tripType === "round" && (
              <DatePicker
                label={t("form.return")}
                value={ret}
                onChange={setRet}
                minISO={depart || todayISO()}
                error={tried && !ret ? " " : undefined}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {legs.map((leg, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                  {t("fs.flightN").replace("{n}", String(i + 1))}
                </span>
                {legs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setLegs((all) => all.filter((_, j) => j !== i))}
                    className="text-xs font-semibold text-slate-400 transition-colors hover:text-red-600"
                  >
                    ✕ {t("fs.removeFlight")}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AirportField
                    placeholder={t("fs.from")}
                    value={leg.from}
                    onSelect={(p) => setLeg(i, { from: p })}
                    invalid={tried && !leg.from}
                  />
                  <button
                    type="button"
                    onClick={() => setLeg(i, { from: leg.to, to: leg.from })}
                    aria-label={t("fs.swap")}
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-300 text-blue-600 transition hover:rotate-180 hover:border-blue-400"
                  >
                    ⇄
                  </button>
                  <AirportField
                    placeholder={t("fs.to")}
                    value={leg.to}
                    onSelect={(p) => setLeg(i, { to: p })}
                    invalid={tried && !leg.to}
                  />
                </div>
                <DatePicker
                  label={t("form.departure")}
                  value={leg.date}
                  onChange={(iso) => setLeg(i, { date: iso })}
                  minISO={i > 0 ? legs[i - 1].date || todayISO() : todayISO()}
                  error={tried && !leg.date ? " " : undefined}
                />
              </div>
            </div>
          ))}
          {legs.length < 4 && (
            <button
              type="button"
              onClick={() => setLegs((all) => [...all, { from: null, to: null, date: "" }])}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition-colors hover:text-blue-800"
            >
              ⊕ {t("fs.addFlight")}
            </button>
          )}
        </div>
      )}

      {/* Travellers · cabin */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t("form.travellers")}
          </span>
          <select
            value={travellers}
            onChange={(e) => setTravellers(Number(e.target.value))}
            className={`${inputBase} mt-1 border-slate-300`}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {t("fs.adults")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("fs.cabin")}</span>
          <select
            value={cabin}
            onChange={(e) => setCabin(e.target.value as typeof cabin)}
            className={`${inputBase} mt-1 border-slate-300`}
          >
            <option value="economy">{t("fs.economy")}</option>
            <option value="premium">{t("fs.premium")}</option>
            <option value="business">{t("fs.business")}</option>
            <option value="first">{t("fs.first")}</option>
          </select>
        </label>
      </div>

      <hr className="border-slate-200" />

      {/* Contact */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-700">
          <span aria-hidden className="sparkle text-cyan-500">✦</span>
          {t("form.details")}
        </legend>
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">{t("form.fullName")} <span className="text-red-500">*</span></span>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${inputBase} mt-1 border-slate-300`} autoComplete="name" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">{t("form.email")} <span className="text-red-500">*</span></span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputBase} mt-1 border-slate-300`} autoComplete="email" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">{t("form.phone")} <span className="text-red-500">*</span></span>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputBase} mt-1 border-slate-300`} autoComplete="tel" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">{t("form.baggage")}</span>
          <select value={baggage} onChange={(e) => setBaggage(e.target.value as typeof baggage)} className={`${inputBase} mt-1 border-slate-300`}>
            <option value="included">{t("form.baggageIncluded")}</option>
            <option value="not_needed">{t("form.baggageNone")}</option>
            <option value="unsure">{t("form.baggageUnsure")}</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-800">{t("form.notes")}</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputBase} mt-1 border-slate-300`} placeholder={t("form.notesPlaceholder")} />
        </label>
      </fieldset>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-relaxed text-slate-700">
        <strong>{t("form.before")}</strong> {t("form.beforeText")}
      </div>

      <button
        disabled={pending}
        className="btn-glow w-full rounded-2xl px-6 py-4 text-lg font-bold text-white transition disabled:cursor-wait disabled:opacity-60"
      >
        <span aria-hidden className="sparkle mr-2 text-cyan-200">✦</span>
        {pending ? t("form.sending") : t("fs.searchCta")}
      </button>
    </form>
  );
}
