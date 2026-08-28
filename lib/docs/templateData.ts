// Builds the data passed to document generators + docxtemplater templates.
import { generateItinerary, type ItineraryDay } from "@/lib/visa/itinerary";

// Loose row shapes (no generated DB types yet).
export type AppRow = {
  id: string;
  destination_country: string | null;
  destination_city: string | null;
  nationality: string | null;
  korean_visa_status: string | null;
  travel_purpose: string | null;
  travel_start_date: string | null;
  travel_end_date: string | null;
  stay_days: number | null;
  current_korea_address: string | null;
  client_email: string | null;
  client_phone: string | null;
  japan_processing_type: string | null;
  trip_reason: string | null;
};

export type DetailRow = {
  surname: string | null;
  given_name: string | null;
  middle_name_or_patronymic: string | null;
  full_name_as_passport: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  nationality: string | null;
  occupation: string | null;
  position_title: string | null;
  employer_or_school_name: string | null;
} | null;

export type CompanionRow = {
  full_name: string;
  nationality: string | null;
  relationship: string | null;
  is_family_member: boolean | null;
};

export type FlightRow = {
  airline: string | null;
  flight_number: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  departure_date: string | null;
  return_airline: string | null;
  return_flight_number: string | null;
  return_date: string | null;
} | null;

export type AccommodationRow = {
  name: string | null;
  address: string | null;
  phone: string | null;
  check_in: string | null;
  check_out: string | null;
};

export type GenBundle = {
  application: AppRow;
  details: DetailRow;
  companions: CompanionRow[];
  // Optional: the Schedule of Stay uses these when present (flight lines on
  // the first/last day, hotel name + phone per day).
  flight?: FlightRow;
  accommodations?: AccommodationRow[];
};

export type TemplateData = {
  applicant: {
    full_name: string;
    surname: string;
    given_name: string;
    middle_name_or_patronymic: string;
    passport_number: string;
    nationality: string;
    date_of_birth: string;
    occupation: string;
    position_title: string;
    employer_or_school_name: string;
  };
  application: {
    destination_country: string;
    destination_city: string;
    travel_start_date: string;
    travel_end_date: string;
    stay_days: string;
    current_korea_address: string;
    korean_visa_status: string;
    travel_purpose: string;
    trip_reason: string;
    client_email: string;
    client_phone: string;
  };
  companions: { full_name: string; nationality: string; relationship: string }[];
  itinerary_days: {
    date: string;
    city: string;
    morning: string;
    afternoon: string;
    evening: string;
  }[];
};

function s(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export function buildItinerary(bundle: GenBundle): ItineraryDay[] {
  const a = bundle.application;
  return generateItinerary({
    destinationCountry: s(a.destination_country),
    destinationCity: s(a.destination_city),
    travelStart: s(a.travel_start_date),
    travelEnd: s(a.travel_end_date),
    seed: `${a.id}-${s(a.travel_start_date)}-${s(a.nationality)}`,
  });
}

// Flat object consumed by docxtemplater placeholders + programmatic generators.
export function buildTemplateData(bundle: GenBundle): TemplateData {
  const a = bundle.application;
  const d = bundle.details;
  const itinerary = buildItinerary(bundle);

  return {
    applicant: {
      full_name: s(d?.full_name_as_passport),
      surname: s(d?.surname),
      given_name: s(d?.given_name),
      middle_name_or_patronymic: s(d?.middle_name_or_patronymic),
      passport_number: s(d?.passport_number),
      nationality: s(a.nationality) || s(d?.nationality),
      date_of_birth: s(d?.date_of_birth),
      occupation: s(d?.occupation),
      position_title: s(d?.position_title),
      employer_or_school_name: s(d?.employer_or_school_name),
    },
    application: {
      destination_country: s(a.destination_country),
      destination_city: s(a.destination_city),
      travel_start_date: s(a.travel_start_date),
      travel_end_date: s(a.travel_end_date),
      stay_days: a.stay_days != null ? String(a.stay_days) : "",
      current_korea_address: s(a.current_korea_address),
      korean_visa_status: s(a.korean_visa_status),
      travel_purpose: s(a.travel_purpose) || "Tourism and sightseeing",
      trip_reason: s(a.trip_reason),
      client_email: s(a.client_email),
      client_phone: s(a.client_phone),
    },
    companions: bundle.companions
      .filter((c) => s(c.full_name) !== "")
      .map((c) => ({
        full_name: s(c.full_name),
        nationality: s(c.nationality),
        relationship: s(c.relationship),
      })),
    itinerary_days: itinerary,
  };
}
