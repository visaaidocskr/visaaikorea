"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { DatePicker } from "@/app/apply/DatePicker";
import { submitServiceEnquiry } from "@/app/services/actions";
import { searchCities, type CityEntry } from "@/lib/travel/airports";
import { useLocale } from "@/app/components/LocaleProvider";
import { EnquirySuccess } from "@/app/components/reviews/EnquirySuccess";

// Tour builder in the golden-hour tone: one-tap popular destinations, a
// city autocomplete backed by the same directory the flights page uses,
// trip-style chips, adults/children, hotel stars as segmented buttons and
// an optional budget — everything a tour desk wants to know, gathered the
// way a client enjoys telling it. Flows through the existing enquiry
// pipeline: structured summary on top of notes, nothing else changes.

type Place = { city: string; country: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const POPULAR: Array<{ flag: string; city: string; country: string }> = [
  { flag: "🇯🇵", city: "Tokyo", country: "Japan" },
  { flag: "🇯🇵", city: "Osaka", country: "Japan" },
  { flag: "🇹🇼", city: "Taipei", country: "Taiwan" },
  { flag: "🇸🇬", city: "Singapore", country: "Singapore" },
  { flag: "🇻🇳", city: "Da Nang", country: "Vietnam" },
  { flag: "🇻🇳", city: "Nha Trang", country: "Vietnam" },
  { flag: "🇹🇭", city: "Bangkok", country: "Thailand" },
  { flag: "🇹🇭", city: "Phuket", country: "Thailand" },
  { flag: "🇮🇩", city: "Denpasar (Bali)", country: "Indonesia" },
  { flag: "🇪🇸", city: "Barcelona", country: "Spain" },
];

const STYLES = [
  { key: "beach", emoji: "🏖️" },
  { key: "city", emoji: "🏙️" },
  { key: "nature", emoji: "🏔️" },
  { key: "family", emoji: "👨‍👩‍👧" },
  { key: "honeymoon", emoji: "💍" },
  { key: "food", emoji: "🍜" },
  { key: "shopping", emoji: "🛍️" },
  { key: "ski", emoji: "🎿" },
] as const;

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="text-orange-600">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

function CityField({
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
  const [text, setText] = useState(value ? value.city : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    setText(value ? value.city : "");
  }

  const query = text.trim();
  const options = useMemo<CityEntry[]>(() => searchCities(query), [query]);

  function choose(entry: CityEntry) {
    const place: Place = { city: entry.city, country: entry.country };
    onSelect(place);
    setPrevValue(place);
    setText(place.city);
    setOpen(false);
  }

  return (
    <div className="relative">
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
        <div
          id={listId}
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl"
        >
          {options.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">{t("fs.noMatch")}</p>}
          {options.map((entry, i) => (
            <button
              key={entry.city}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                choose(entry);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-start gap-3 px-4 py-2.5 text-left ${i === active ? "bg-amber-50" : ""}`}
            >
              <span aria-hidden className="mt-0.5">📍</span>
              <span>
                <span className="text-sm font-bold text-slate-900">
                  <Highlight text={entry.city} q={query} />
                </span>
                <span className="block text-xs text-slate-500">
                  <Highlight text={entry.country} q={query} />
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const sectionTitle =
  "inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-600";

export function TourRequestForm() {
  const { t } = useLocale();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const [destination, setDestination] = useState<Place | null>(null);
  const [from, setFrom] = useState<Place | null>({ city: "Seoul", country: "South Korea" });
  const [depart, setDepart] = useState("");
  const [ret, setRet] = useState("");
  const [flexible, setFlexible] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [stars, setStars] = useState<"any" | 3 | 4 | 5>("any");
  const [budget, setBudget] = useState<"" | "b1" | "b2" | "b3" | "b4" | "b0">("");
  const [styles, setStyles] = useState<string[]>([]);
  const [pickup, setPickup] = useState(false);
  const [esim, setEsim] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const tourOk = Boolean(destination && from && depart);

  const toggleStyle = (key: string) =>
    setStyles((all) => (all.includes(key) ? all.filter((k) => k !== key) : [...all, key]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setResult(null);
    if (!tourOk) return;

    const styleText = styles.map((k) => t(`ts.${k}`)).join(", ");
    const lines = [
      `[Tour request] ${destination!.city} (${destination!.country})`,
      `Party: ${adults} ${t("ts.adults").toLowerCase()}${children ? ` + ${children} ${t("ts.children").toLowerCase()}` : ""}`,
      `Hotel: ${stars === "any" ? t("ts.hotelAny") : `${stars}★`}`,
      styleText ? `Style: ${styleText}` : "",
      pickup || esim
        ? `Extras: ${[pickup && "airport pick-up", esim && "eSIM"].filter(Boolean).join(", ")}`
        : "",
      budget ? `Budget pp: ${t(`ts.${budget}`)}` : "",
      flexible ? "Dates flexible ±3 days" : "",
    ].filter(Boolean);

    startTransition(async () => {
      const response = await submitServiceEnquiry({
        kind: "tour",
        fullName,
        residentialAddress: "",
        email,
        phone,
        originCountry: from!.country,
        originCity: from!.city,
        destinationCountry: destination!.country,
        destinationCity: destination!.city,
        departureDate: depart,
        returnDate: ret,
        travellers: adults + children,
        baggagePreference: "unsure",
        hotelStars: stars === "any" ? 3 : stars,
        notes: [lines.join("\n"), notes.trim()].filter(Boolean).join("\n\n"),
      });
      setResult(response.ok ? t("form.success") : response.error);
      setEnquiryId(response.ok ? response.id : null);
    });
  }

  const chip = (selected: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
      selected
        ? "border-transparent bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-orange-300/50"
        : "border-slate-300 bg-white text-slate-700 hover:border-amber-400"
    }`;

  if (enquiryId) {
    return (
      <EnquirySuccess
        context="tour_request"
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
      className="enquiry-card enquiry-warm relative space-y-7 rounded-3xl p-6 shadow-xl shadow-orange-200/50 sm:p-8 [--edge-a:#FDBA74] [--edge-b:#C4B5FD]"
    >
      {/* Watermark clipped by its own layer, so the card itself can let the
          calendar popup escape its rounded corners. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <span className="absolute -right-3 -top-4 select-none text-8xl opacity-[.07]">🎈</span>
      </span>

      <div>
        <h2 className="text-sunset-gradient text-2xl font-extrabold">
          {t("form.request")} {t("service.tour").toLowerCase()}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("form.intro")}</p>
      </div>

      {result && !result.startsWith("✓") && (
        <p role="status" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {result}
        </p>
      )}


      {/* Where to */}
      <div className="space-y-3">
        <span className={sectionTitle}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
          {t("ts.whereTo")}
        </span>
        <CityField
          placeholder={t("fs.to")}
          value={destination}
          onSelect={setDestination}
          invalid={tried && !destination}
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("ts.popular")}</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((d) => (
            <button
              key={d.city}
              type="button"
              onClick={() => setDestination({ city: d.city, country: d.country })}
              className={chip(destination?.city === d.city)}
            >
              <span aria-hidden>{d.flag}</span>
              {d.city}
            </button>
          ))}
        </div>
      </div>

      {/* Departing from */}
      <div className="space-y-2">
        <span className={sectionTitle}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
          {t("ts.departFrom")}
        </span>
        <CityField placeholder={t("fs.from")} value={from} onSelect={setFrom} invalid={tried && !from} />
      </div>

      {/* When */}
      <div className="space-y-3">
        <span className={sectionTitle}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
          {t("ts.when")}
        </span>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <DatePicker
            label={t("form.return")}
            value={ret}
            onChange={setRet}
            minISO={depart || todayISO()}
            required={false}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={flexible}
            onChange={(e) => setFlexible(e.target.checked)}
            className="h-4 w-4 rounded accent-amber-500"
          />
          {t("ts.flexible")}
        </label>
      </div>

      {/* Who */}
      <div className="space-y-3">
        <span className={sectionTitle}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
          {t("ts.who")}
        </span>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">{t("ts.adults")}</span>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className={`${inputBase} mt-1 border-slate-300`}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">{t("ts.children")}</span>
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className={`${inputBase} mt-1 border-slate-300`}
            >
              {Array.from({ length: 7 }, (_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Comfort + budget */}
      <div className="space-y-3">
        <span className={sectionTitle}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
          {t("ts.comfort")}
        </span>
        <div className="flex flex-wrap gap-2">
          {([["any", t("ts.hotelAny")], [3, "3★"], [4, "4★"], [5, "5★"]] as const).map(([value, label]) => (
            <button key={String(value)} type="button" onClick={() => setStars(value)} className={chip(stars === value)}>
              {label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">{t("ts.budget")}</span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value as typeof budget)}
            className={`${inputBase} mt-1 border-slate-300`}
          >
            <option value="">—</option>
            <option value="b1">{t("ts.b1")}</option>
            <option value="b2">{t("ts.b2")}</option>
            <option value="b3">{t("ts.b3")}</option>
            <option value="b4">{t("ts.b4")}</option>
            <option value="b0">{t("ts.b0")}</option>
          </select>
        </label>
      </div>

      {/* Trip style */}
      <div className="space-y-3">
        <span className={sectionTitle}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
          {t("ts.style")}
        </span>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleStyle(s.key)}
              className={chip(styles.includes(s.key))}
            >
              <span aria-hidden>{s.emoji}</span>
              {t(`ts.${s.key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Extras */}
      <div className="space-y-3">
        <span className={sectionTitle}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
          {t("ts.extras")}
        </span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPickup((v) => !v)} className={chip(pickup)}>
            <span aria-hidden>🚐</span>
            {t("ts.pickup")}
          </button>
          <button type="button" onClick={() => setEsim((v) => !v)} className={chip(esim)}>
            <span aria-hidden>📶</span>
            {t("ts.esim")}
          </button>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Contact */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className={`${sectionTitle} mb-1`}>
          <span aria-hidden className="sparkle text-amber-500">✦</span>
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
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-slate-800">{t("form.notes")}</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputBase} mt-1 border-slate-300`} placeholder={t("form.notesPlaceholder")} />
        </label>
      </fieldset>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        <strong>{t("form.before")}</strong> {t("form.beforeText")}
      </div>

      <button
        disabled={pending}
        className="btn-glow btn-sunset w-full rounded-2xl px-6 py-4 text-lg font-bold text-white transition disabled:cursor-wait disabled:opacity-60"
      >
        <span aria-hidden className="sparkle mr-2 text-amber-200">✦</span>
        {pending ? t("form.sending") : t("ts.cta")}
      </button>
    </form>
  );
}
