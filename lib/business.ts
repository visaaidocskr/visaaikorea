// Public business information. Keep this separate from payment credentials so
// the website can be reviewed by a bank without ever exposing secrets.
export const BUSINESS = {
  legalName: "Vitamin Travel",
  brandName: "VisaAI Korea",
  email: "vitaminartikov@gmail.com",
  phones: {
    uzbekistan: "+998 93 236 22 77",
    korea: "+82 10 3396 4499",
  },
  telegram: "https://t.me/rich_visa",
  whatsapp: "https://wa.me/821033964499",
  address:
    "4-home, Yashlik Street, Tashkent MFY, Jomboy District, Samarkand Region, Uzbekistan",
  // Official registration number of the operating company. Shown in the
  // footer only once filled in — an empty string hides the line entirely.
  registrationNumber: "",
} as const;

// Clients live in Korea, so customer-facing prices display KRW-first. USD
// stays the internal source of truth; this is the display rate, owned by the
// operator — update this one number and every price on the site follows.
// With integer USD fees the maths stays exact, so part prices always add up
// to the shown total.
export const KRW_PER_USD = 1400;

export function usdToKrw(usd: number) {
  return usd * KRW_PER_USD;
}

export function formatKrw(usd: number) {
  return `₩${usdToKrw(usd).toLocaleString("en-US")}`;
}

export type VisaPrice = {
  destination: string;
  embassyFeeUsd: number;
  serviceFeeUsd: number;
  note?: string;
};

// These are transparent planning prices. Embassy fees can change, so the
// checkout integration must confirm the current amount before charging.
export const VISA_PRICES: VisaPrice[] = [
  { destination: "Vietnam", embassyFeeUsd: 25, serviceFeeUsd: 10 },
  { destination: "Japan", embassyFeeUsd: 36, serviceFeeUsd: 10 },
  { destination: "Taiwan", embassyFeeUsd: 50, serviceFeeUsd: 13 },
  {
    destination: "Singapore",
    embassyFeeUsd: 0,
    serviceFeeUsd: 13,
    note: "You submit to the embassy yourself. Embassy fees, if any, are paid separately.",
  },
  {
    destination: "Spain",
    embassyFeeUsd: 0,
    serviceFeeUsd: 55,
    note: "$40 of this service package is reserved for travel insurance arranged for the client. Embassy fees are paid separately.",
  },
];

export function totalVisaPrice(price: VisaPrice) {
  return price.embassyFeeUsd + price.serviceFeeUsd;
}

export const REFUND_POLICY = {
  effectiveDate: "19 August 2026",
  beforeWork: "A full refund is available before our team begins work on your request.",
  afterWork:
    "After document preparation, booking research, insurance purchase, or another requested service has begun, the completed-work portion is non-refundable.",
  embassyFees:
    "Embassy, government, card-processing, insurance, airline, hotel, and other third-party charges follow the relevant provider's own refund rules and may be non-refundable.",
  visaDecision:
    "A visa refusal or delay does not by itself create a refund because the service is document preparation and travel support, not a visa approval guarantee.",
  request:
    "To request a refund, contact us by email with your full name, order reference, and reason. We will confirm the result within 5 business days.",
} as const;
