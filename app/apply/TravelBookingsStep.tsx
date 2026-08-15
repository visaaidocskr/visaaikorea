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
  const f = form.flight;
  const setFlight = (patch: Partial<FlightBooking>) => set("flight", { ...f, ...patch });

  const PORTS_OF_ENTRY =
    PORTS_OF_ENTRY_BY_COUNTRY[countryLabel] ?? PORTS_OF_ENTRY_BY_COUNTRY.Japan;

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
      ? "You haven't booked your flight or accommodation yet."
      : missingFlight
        ? "You haven't booked your flight yet."
        : "You haven't booked your accommodation yet.";

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Travel bookings</h3>
        <p className="mt-1 text-sm text-slate-600">
          Your flight and accommodation for the trip. We never fabricate bookings.
        </p>
      </div>

      {/* Flight */}
      <section className="space-y-5">
        <h4 className="text-sm font-bold text-slate-800">Flight</h4>
        <BooleanChoice
          label={`Have you booked your flight to ${countryLabel}?`}
          value={form.flight_booked}
          onChange={onFlightBooked}
          yesLabel="Yes, I have booked my flight"
          noLabel="No, not yet"
        />
        {form.flight_booked === true && (
          <div className="space-y-6">
            <div className="max-w-md">
              <UploadField
                applicationId={applicationId}
                userId={userId}
                fileType="flight_reservation"
                label="Flight reservation / e-ticket"
                required={false}
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
              <Input label="Airline" value={f.airline} onChange={(v) => setFlight({ airline: v })} />
              <Input
                label="Flight number"
                value={f.flight_number}
                onChange={(v) => setFlight({ flight_number: v })}
                required={false}
                helpText="Optional if not issued yet."
              />
              <Select
                label={`Port of entry into ${countryLabel}`}
                value={portSelectValue}
                onChange={onPortChange}
                options={[...PORTS_OF_ENTRY, OTHER_PORT]}
              />
              {portOther && (
                <Input
                  label="Enter your port of entry"
                  value={form.port_of_entry}
                  onChange={(v) => set("port_of_entry", v)}
                />
              )}
              <DatePicker
                label="Arrival date"
                value={f.arrival_date}
                onChange={(v) => setFlight({ arrival_date: v })}
                minISO={tripStart}
                showYearMonth
              />
            </div>
          </div>
        )}
      </section>

      {/* Accommodation */}
      <section className="space-y-5">
        <h4 className="text-sm font-bold text-slate-800">Accommodation</h4>
        <BooleanChoice
          label={`Have you booked your accommodation in ${countryLabel}?`}
          value={form.accommodation_booked}
          onChange={onAccBooked}
          yesLabel="Yes, I have booked accommodation"
          noLabel="No, not yet"
        />
        {form.accommodation_booked === true && (
          <div className="space-y-6">
            <div className="max-w-md">
              <UploadField
                applicationId={applicationId}
                userId={userId}
                fileType="hotel_booking"
                label="Hotel booking confirmation"
                required={false}
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
                  ? "Check-out must be on or after check-in."
                  : undefined;
              return (
                <div key={i} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-slate-800">
                      Accommodation {i + 1}
                    </h5>
                    {list.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAcc(i)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-6 md:grid-cols-2">
                    <Input
                      label="Hotel / accommodation name"
                      value={a.name}
                      onChange={(v) => updateAcc(i, { name: v })}
                    />
                    <Input
                      label="Phone number"
                      value={a.phone}
                      onChange={(v) => updateAcc(i, { phone: v })}
                      required={false}
                      inputMode="tel"
                    />
                    <Input
                      label="Address"
                      value={a.address}
                      onChange={(v) => updateAcc(i, { address: v })}
                      error={addressError}
                      helpText="Please enter the full address in English."
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker
                        label="Check-in"
                        value={a.check_in}
                        onChange={(v) => updateAcc(i, { check_in: v })}
                        minISO={tripStart}
                        maxISO={tripEnd}
                        showYearMonth
                      />
                      <DatePicker
                        label="Check-out"
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
              + Add another accommodation
            </button>
          </div>
        )}
      </section>

      {/* One combined support card */}
      {showSupport && (
        <SupportContactCard
          title={supportTitle}
          message={`If you need help arranging your flight or accommodation for your ${countryLabel} visa application, please contact our visa support team. You can continue now — any missing details will be marked as “Needs attention.”`}
        />
      )}
    </div>
  );
}
