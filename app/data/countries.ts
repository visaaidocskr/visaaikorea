export const countries = {
  Japan: {
    visaType: "Tourist Visa",

    requiredDocuments: [
      "Passport Copy",
      "Korean ARC Copy",
      "Visa Application Form",
      "Recent ID Photo",
      "Bank Statement",
      "Employment Certificate or University Enrollment Certificate",
      "Travel Itinerary",
      "Hotel Reservation",
      "Flight Reservation",
      "Cover Letter",
    ],

    financialRequirement:
      "Applicant should show enough money to cover the full trip. A stable bank balance is recommended.",

    embassyStyle:
      "Japan tourist visa documents should be clear, simple, realistic, and consistent. The applicant should show a strong reason to return to Korea.",

    riskFactors: [
      "Low bank balance",
      "No clear reason to return to Korea",
      "Travel dates do not match hotel or flight reservation",
      "Unclear job or student status",
      "Weak travel purpose explanation",
    ],

    aiNotes: [
      "Travel dates should match hotel and flight reservations.",
      "Applicant should explain why they will return to Korea.",
      "Cover letter should be polite, simple, and professional.",
      "Itinerary should look realistic, not too crowded.",
    ],
  },

  Spain: {
    visaType: "Schengen Tourist Visa",

    requiredDocuments: [
      "Passport Copy",
      "Korean ARC Copy",
      "Schengen Visa Application Form",
      "Recent Biometric Photo",
      "Travel Insurance",
      "Bank Statement",
      "Employment Certificate or University Enrollment Certificate",
      "Travel Itinerary",
      "Hotel Reservation",
      "Flight Reservation",
      "Cover Letter",
    ],

    financialRequirement:
      "Applicant should show enough funds for Schengen travel. Travel insurance is usually required.",

    embassyStyle:
      "Spain Schengen documents should be detailed and consistent. Insurance, hotel, flight, and itinerary dates must match.",

    riskFactors: [
      "No travel insurance",
      "Weak bank statement",
      "Hotel dates and flight dates do not match",
      "Unclear Schengen travel plan",
      "No strong Korea residence explanation",
    ],

    aiNotes: [
      "Travel insurance is important for Schengen visa.",
      "Itinerary should match hotel and flight reservation.",
      "Financial explanation should be realistic.",
    ],
  },

  Taiwan: {
    visaType: "Tourist Visa",

    requiredDocuments: [
      "Passport Copy",
      "Korean ARC Copy",
      "Visa Application Form or Travel Authorization Details",
      "Recent ID Photo",
      "Bank Statement",
      "Employment Certificate or University Enrollment Certificate",
      "Travel Itinerary",
      "Hotel Reservation",
      "Flight Reservation",
      "Cover Letter",
    ],

    financialRequirement:
      "Applicant should show stable financial condition and clear travel purpose.",

    embassyStyle:
      "Taiwan tourist visa documents should clearly explain tourism purpose, travel schedule, and return plan to Korea.",

    riskFactors: [
      "Unclear eligibility",
      "No clear travel purpose",
      "Weak return plan",
      "Incomplete Korean residence documents",
    ],

    aiNotes: [
      "Travel purpose should be explained clearly.",
      "Return plan to Korea should be shown.",
      "Applicant information should match all documents.",
    ],
  },

  Singapore: {
    visaType: "Tourist Visa",

    requiredDocuments: [
      "Passport Copy",
      "Korean ARC Copy",
      "Visa Application Form",
      "Recent ID Photo",
      "Bank Statement",
      "Employment Certificate or University Enrollment Certificate",
      "Travel Itinerary",
      "Hotel Reservation",
      "Flight Reservation",
      "Cover Letter",
    ],

    financialRequirement:
      "Applicant should show enough funds and clear short-term tourism purpose.",

    embassyStyle:
      "Singapore tourist visa documents should be short, clean, and focused on tourism purpose.",

    riskFactors: [
      "Unclear travel purpose",
      "No stable Korea status",
      "Travel dates do not match reservations",
      "Weak financial proof",
    ],

    aiNotes: [
      "Documents should show tourism purpose clearly.",
      "Travel dates should match all reservations.",
      "Applicant status in Korea should be explained professionally.",
    ],
  },
};