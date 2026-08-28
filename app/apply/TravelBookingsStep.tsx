"use client";

import { useState } from "react";
import type { ApplyFormData, FlightBooking, AccommodationInput } from "@/lib/visa/types";
import { addressLanguageError } from "@/lib/visa/forms";
import { DatePicker } from "@/app/apply/DatePicker";
import { UploadField } from "@/app/apply/UploadField";
import { SupportContactCard } from "@/app/apply/japan/SupportContactCard";
import { Input, Select, BooleanChoice } from "@/app/apply/fields";
import { FlightScanPanel } from "@/app/apply/FlightScanPanel";
import { HotelScanPanel } from "@/app/apply/HotelScanPanel";
import { useLocale } from "@/app/components/LocaleProvider";
import type { FlightReservationFields, HotelReservationFields } from "@/lib/ocr/reservationParse";

type Setter = <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;

// Major international ports of entry, keyed by destination country. "Other"
// (last) reveals a text field. Selected/typed value is stored in the shared
// applications.port_of_entry. This step is shared across EVERY destination
// (Japan/Taiwan's rich flow, and Singapore/Spain's generic flow — see
// ApplyWizard.tsx), so the list — and every "...to Japan" label below —
// switches on `countryLabel` rather than assuming Japan.
const PORTS_OF_ENTRY_BY_COUNTRY: Record<string, string[]> = {
  Japan: [
    "Narita International Airport (NRT)",
    "Haneda Airport (HND)",
    "Kansai International Airport (KIX)",
    "Chubu Centrair International Airport (NGO)",
    "Fukuoka Airport (FUK)",
    "New Chitose Airport (CTS)",
    "Naha Airport (OKA)",
    "Sendai Airport (SDJ)",
    "Hiroshima Airport (HIJ)",
    "Kagoshima Airport (KOJ)",
    "Kumamoto Airport (KMJ)",
    "Kitakyushu Airport (KKJ)",
    "Nagasaki Airport (NGS)",
    "Takamatsu Airport (TAK)",
    "Matsuyama Airport (MYJ)",
    "Okayama Airport (OKJ)",
    "Komatsu Airport (KMQ)",
    "Ibaraki Airport (IBR)",
  ],
  // Taiwan's destination-city selector only offers Taipei (see
  // lib/visa/config.ts DESTINATION_CITIES.Taiwan) — only the two Taipei-area
  // airports belong here; Kaohsiung/Taichung are different cities entirely.
  Taiwan: [
    "Taiwan Taoyuan International Airport (TPE)",
    "Taipei Songshan Airport (TSA)",
  ],
  Singapore: ["Singapore Changi Airport (SIN)", "Seletar Airport (XSP)"],
  Spain: [
    "Adolfo Suárez Madrid–Barajas Airport (MAD)",
    "Barcelona–El Prat Airport (BCN)",
    "Málaga–Costa del Sol Airport (AGP)",
    "Valencia Airport (VLC)",
    "Seville Airport (SVQ)",
  ],
};
const OTHER_PORT = "Other";

const EMPTY_ACCOMMODATION: AccommodationInput = {
  name: "",
  address: "",
  phone: "",
  check_in: "",
  check_out: "",
};

// Combined Flight + Accommodation step. Both booking statuses are asked here so
// the applicant is only sent to support once (a single combined card).
export function TravelBookingsStep({
  form,
  set,
  applicationId,
  userId,
  uploads,
  onUploaded,
  countryLabel = "Japan",
}: {
  form: ApplyFormData;
  set: Setter;
  applicationId: string;
  userId: string;
  uploads: Record<string, string>;
  onUploaded: (fileType: string, filename: string) => void;
  countryLabel?: string;
}) {
  const { t } = useLocale();
  const f = form.flight;
  const setFlight = (patch: Partial<FlightBooking>) => set("flight", { ...f, ...patch });

  const PORTS_OF_ENTRY =
    PORTS_OF_ENTRY_BY_COUNTRY[countryLabel] ?? PORTS_OF_ENTRY_BY_COUNTRY.Japan;
  const cityName = form.destination_city || countryLabel;

  // Port of entry — reuses the shared port_of_entry field; "Other" → free text.
  const [portOther, setPortOther] = useState(
    form.port_of_entry !== "" && !PORTS_OF_ENTRY.includes(form.port_of_entry)
  );
  const portSelectValue = portOther
    ? OTHER_PORT
    : PORTS_OF_ENTRY.includes(form.port_of_entry)
      ? form.port_of_entry
      : "";
  function onPortChange(v: string) {
    if (v === OTHER_PORT) {
      setPortOther(true);
      if (PORTS_OF_ENTRY.includes(form.port_of_entry)) set("port_of_entry", "");
    } else {
      setPortOther(false);
      set("port_of_entry", v);
    }
  }

  // Accommodations (multiple).
  const list = form.accommodations;
  const updateAcc = (i: number, patch: Partial<AccommodationInput>) =>
    set("accommodations", list.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const addAcc = () => set("accommodations", [...list, { ...EMPTY_ACCOMMODATION }]);
  const removeAcc = (i: number) =>
    set("accommodations", list.filter((_, idx) => idx !== i));

  function onFlightBooked(v: boolean) {
    set("flight_booked", v);
    if (v && !f.arrival_date && form.travel_start_date) {
      setFlight({ arrival_date: form.travel_start_date });
    }
  }
  // Applies a FlightScanPanel result. Suggestions only — every field stays
  // fully editable afterwards, same as if typed by hand.
  function applyFlightFields(fields: FlightReservationFields) {
    const patch: Partial<FlightBooking> = {};
    if (fields.airline) patch.airline = fields.airline;
    if (fields.flightNumber) patch.flight_number = fields.flightNumber;
    if (fields.arrivalDate) patch.arrival_date = fields.arrivalDate;
    if (fields.departureTime) patch.departure_time = fields.departureTime;
    if (fields.arrivalTime) patch.arrival_time = fields.arrivalTime;
    if (fields.returnDepartureTime) patch.return_departure_time = fields.returnDepartureTime;
    if (fields.returnArrivalTime) patch.return_arrival_time = fields.returnArrivalTime;
    if (Object.keys(patch).length) setFlight(patch);

    if (fields.arrivalAirportCode) {
      const matched = PORTS_OF_ENTRY.find((p) => p.includes(`(${fields.arrivalAirportCode})`));
      if (matched) {
        setPortOther(false);
        set("port_of_entry", matched);
      } else {
        // No match in our known list — still hand the code over via the
        // free-text "Other" field rather than silently dropping it.
        setPortOther(true);
        set("port_of_entry", fields.arrivalAirportCode);
      }
    }
  }
  // Applies a HotelScanPanel result to the first accommodation entry. The
  // upload only appears once accommodation_booked is true, and onAccBooked
  // (below) already ensures at least one entry exists by then.
  function applyHotelFields(fields: HotelReservationFields) {
    if (list.length === 0) return;
    const patch: Partial<AccommodationInput> = {};
    if (fields.name) patch.name = fields.name;
    if (fields.address) patch.address = fields.address;
    if (fields.phone) patch.phone = fields.phone;
    if (fields.checkIn) patch.check_in = fields.checkIn;
    if (fields.checkOut) patch.check_out = fields.checkOut;
    if (Object.keys(patch).length) updateAcc(0, patch);
  }

  function onAccBooked(v: boolean) {
    set("accommodation_booked", v);
    if (v && list.length === 0) addAcc();
  }

  const tripStart = form.travel_start_date || null;
  const tripEnd = form.travel_end_date || null;

  const missingFlight = form.flight_booked === false;
  const missingAcc = form.accommodation_booked === false;
  const showSupport = missingFlight || missingAcc;
  const supportTitle =
    missingFlight && missingAcc
      ? t("booking.supportBoth")
      : missingFlight
        ? t("booking.supportFlight")
        : t("booking.supportHotel");

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("booking.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("booking.intro")}
        </p>
      </div>

      {/* Flight */}
      <section className="space-y-5">
        <h4 className="text-sm font-bold text-slate-800">{t("booking.flight")}</h4>
        <BooleanChoice
          label={t("booking.flightQuestion").replace("{country}", countryLabel)}
          value={form.flight_booked}
          onChange={onFlightBooked}
          yesLabel={t("booking.yesFlight")}
          noLabel={t("booking.notYet")}
        />
        {form.flight_booked === true && (
          <div className="space-y-6">
            <div className="max-w-md">
              <UploadField
                applicationId={applicationId}
                userId={userId}
                fileType="flight_reservation"
                label={t("booking.flightUpload")}
                required
                initialFilename={uploads["flight_reservation"]}
                onUploaded={onUploaded}
              />
              {uploads["flight_reservation"] && (
                <FlightScanPanel
                  applicationId={applicationId}
                  flightFilename={uploads["flight_reservation"]}
                  onApply={applyFlightFields}
                />
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Input label={t("booking.airline")} value={f.airline} onChange={(v) => setFlight({ airline: v })} />
              <Input
                label={t("booking.flightNumber")}
                value={f.flight_number}
                onChange={(v) => setFlight({ flight_number: v })}
              />
              <Select
                label={t("booking.portEntry").replace("{country}", countryLabel)}
                value={portSelectValue}
                onChange={onPortChange}
                options={[...PORTS_OF_ENTRY, OTHER_PORT]}
              />
              {portOther && (
                <Input
                  label={t("booking.enterPort")}
                  value={form.port_of_entry}
                  onChange={(v) => set("port_of_entry", v)}
                />
              )}
              <DatePicker
                label={t("booking.arrivalDate")}
                value={f.arrival_date}
                onChange={(v) => setFlight({ arrival_date: v })}
                minISO={tripStart}
                showYearMonth
              />
              <Input
                label={t("booking.arrivalTime")}
                value={f.arrival_time}
                onChange={(v) => setFlight({ arrival_time: v })}
                required={false}
                type="time"
                helpText={t("booking.arrivalTimeHelp").replace("{city}", cityName)}
              />
              <Input
                label={t("booking.returnDepTime")}
                value={f.return_departure_time}
                onChange={(v) => setFlight({ return_departure_time: v })}
                required={false}
                type="time"
                helpText={t("booking.returnDepTimeHelp").replace("{city}", cityName)}
              />
            </div>
          </div>
        )}
      </section>

      {/* Accommodation */}
      <section className="space-y-5">
        <h4 className="text-sm font-bold text-slate-800">{t("booking.accommodation")}</h4>
        <BooleanChoice
          label={t("booking.hotelQuestion").replace("{country}", countryLabel)}
          value={form.accommodation_booked}
          onChange={onAccBooked}
          yesLabel={t("booking.yesHotel")}
          noLabel={t("booking.notYet")}
        />
        {form.accommodation_booked === true && (
          <div className="space-y-6">
            <div className="max-w-md">
              <UploadField
                applicationId={applicationId}
                userId={userId}
                fileType="hotel_booking"
                label={t("booking.hotelUpload")}
                required
                initialFilename={uploads["hotel_booking"]}
                onUploaded={onUploaded}
              />
              {uploads["hotel_booking"] && (
                <HotelScanPanel
                  applicationId={applicationId}
                  hotelFilename={uploads["hotel_booking"]}
                  onApply={applyHotelFields}
                />
              )}
            </div>
            {list.map((a, i) => {
              const addressError = addressLanguageError(a.address);
              const orderError =
                a.check_in && a.check_out && a.check_out < a.check_in
                  ? t("booking.dateOrder")
                  : undefined;
              return (
                <div key={i} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-slate-800">
                      {t("booking.accommodation")} {i + 1}
                    </h5>
                    {list.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAcc(i)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        {t("booking.remove")}
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-6 md:grid-cols-2">
                    <Input
                      label={t("booking.hotelName")}
                      value={a.name}
                      onChange={(v) => updateAcc(i, { name: v })}
                    />
                    <Input
                      label={t("booking.phone")}
                      value={a.phone}
                      onChange={(v) => updateAcc(i, { phone: v })}
                      inputMode="tel"
                    />
                    <Input
                      label={t("booking.address")}
                      value={a.address}
                      onChange={(v) => updateAcc(i, { address: v })}
                      error={addressError}
                      helpText={t("booking.addressHelp")}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker
                        label={t("booking.checkIn")}
                        value={a.check_in}
                        onChange={(v) => updateAcc(i, { check_in: v })}
                        minISO={tripStart}
                        maxISO={tripEnd}
                        showYearMonth
                      />
                      <DatePicker
                        label={t("booking.checkOut")}
                        value={a.check_out}
                        onChange={(v) => updateAcc(i, { check_out: v })}
                        minISO={a.check_in || tripStart}
                        maxISO={tripEnd}
                        error={orderError}
                        showYearMonth
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addAcc}
              className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
            >
              + {t("booking.addAccommodation")}
            </button>
          </div>
        )}
      </section>

      {/* One combined support card */}
      {showSupport && (
        <SupportContactCard
          title={supportTitle}
          message={t("booking.supportMessage").replace("{country}", countryLabel)}
        />
      )}
    </div>
  );
}
