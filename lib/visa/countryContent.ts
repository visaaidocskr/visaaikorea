// Marketing/display content for the landing country cards + slide-overs.
// Composed from the real rule engine (DESTINATION_RULES) so documents, embassy
// contacts, and processing notes never drift from the application logic.
// To add a new country: add it to DESTINATION_RULES, then add one entry here.
import { DESTINATION_RULES, type ContactCard } from "@/lib/visa/destinations";

export type CountryContent = {
  country: string;
  flag: string;
  visaType: string;
  tagline: string;
  processingTime: string;
  overview: string;
  documents: string[];
  notes: string[];
  contacts: ContactCard[];
  /** Tailwind gradient classes for the card accent. */
  accent: string;
};

const DISPLAY: Record<
  string,
  {
    flag: string;
    visaType: string;
    tagline: string;
    processingTime: string;
    overview: string;
    notes: string[];
    accent: string;
  }
> = {
  Japan: {
    flag: "🇯🇵",
    visaType: "Tourist Visa",
    tagline: "Tokyo · Osaka · Fukuoka",
    processingTime: "About 7–10 days",
    overview:
      "We prepare your complete Japan tourist visa package — application form or information letter, a day-by-day itinerary, and a travel purpose statement — matched to the Busan sticker route or the eVISA route based on your address in Korea.",
    notes: [
      "Sticker route (Busan Consulate) submits the original passport through a designated agency.",
      "eVISA route does not require sending the original passport.",
      "Recommended bank balance: at least 5,000,000 KRW per applicant.",
      "Plan your stay between 1 and 15 days, 10–30 days after submission.",
    ],
    accent: "from-rose-500/15 to-red-500/5",
  },
  Spain: {
    flag: "🇪🇸",
    visaType: "Schengen Tourist Visa",
    tagline: "Madrid · Barcelona · Valencia",
    processingTime: "About 15 days (Schengen)",
    overview:
      "A full Schengen document package for residents of Korea: cover letter, itinerary, and a supporting checklist aligned with Embassy of Spain in Seoul guidance — including the travel-insurance and financial-proof requirements.",
    notes: [
      "Processed for applicants living in Korea with a valid ARC.",
      "Travel medical insurance covering the Schengen area is required.",
      "Choose a travel date at least 21 days after your appointment.",
    ],
    accent: "from-amber-500/15 to-orange-500/5",
  },
  Taiwan: {
    flag: "🇹🇼",
    visaType: "Tourist Visa",
    tagline: "Taipei · Taichung · Kaohsiung",
    processingTime: "About 10 working days",
    overview:
      "A Taiwan tourist visa package with itinerary and travel purpose statement, prepared for the Taipei Mission in Korea (Seoul or Busan office), including the 2026 bank-history checklist.",
    notes: [
      "Sticker visa — the original passport is held during processing.",
      "From 1 June 2026: include recent bank transaction history, not just a one-day balance.",
      "Keep your stay within 7 days for this service flow.",
    ],
    accent: "from-sky-500/15 to-blue-500/5",
  },
  Singapore: {
    flag: "🇸🇬",
    visaType: "Tourist Visa",
    tagline: "Singapore",
    processingTime: "A few working days",
    overview:
      "A clean, tourism-focused Singapore document package — Form 14A support, itinerary, and travel purpose statement — prepared for the by-appointment process at the Embassy in Seoul.",
    notes: [
      "Applications are by appointment only — no walk-ins.",
      "There are no authorised visa agents in Korea; we only prepare documents.",
      "Choose a travel date 10–30 days after your appointment.",
    ],
    accent: "from-violet-500/15 to-fuchsia-500/5",
  },
};

// Order shown on the landing page.
const ORDER = ["Japan", "Spain", "Taiwan", "Singapore"];

export const COUNTRIES: CountryContent[] = ORDER.map((country) => {
  const d = DISPLAY[country];
  const rule = DESTINATION_RULES[country];
  return {
    country,
    flag: d.flag,
    visaType: d.visaType,
    tagline: d.tagline,
    processingTime: d.processingTime,
    overview: d.overview,
    documents: rule?.documents ?? [],
    notes: d.notes,
    contacts: rule?.contacts ?? [],
    accent: d.accent,
  };
});
