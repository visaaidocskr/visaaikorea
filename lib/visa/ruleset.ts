// The resolved visa ruleset: one serializable object holding every data slice
// the wizard and server validation need. It is assembled from the TypeScript
// defaults below (DEFAULT_RULESET) and can be overridden/extended from the
// database by the server-only resolver in `rules-source.ts`.
//
// Because the engine is pure + isomorphic and the wizard is a client component,
// we never fetch data inside the wizard. Instead the server resolves a
// VisaRuleset and passes it down as a prop; every selector takes the ruleset's
// slice as an argument (the helpers in config/eligibility/destinations accept
// an optional data map that defaults to these same code tables).

import {
  DESTINATIONS,
  DESTINATION_CITIES,
  NATIONALITIES,
  KOREAN_VISA_STATUSES,
  BASE_DOCUMENTS,
  STATUS_DOCUMENTS,
  patronymicRule,
} from "@/lib/visa/config";
import {
  DESTINATION_RULES,
  COUNTRY_GUIDANCE,
  type DestinationRule,
  type CountryGuidance,
  type ContactCard,
} from "@/lib/visa/destinations";
import {
  DESTINATION_ELIGIBILITY,
  DEMONYMS,
  type DestinationEligibility,
} from "@/lib/visa/eligibility";
import type { DocumentRequirement, PatronymicRule } from "@/lib/visa/types";

export type VisaRuleset = {
  destinations: string[];
  cities: Record<string, string[]>;
  nationalities: string[];
  demonyms: Record<string, string>;
  patronymic: Record<string, PatronymicRule>;
  koreanVisaTypes: string[];
  baseDocuments: DocumentRequirement[];
  statusDocuments: Record<string, DocumentRequirement[]>;
  dateRules: Record<string, DestinationRule>;
  eligibility: Record<string, DestinationEligibility>;
  countryGuidance: Record<string, CountryGuidance>;
  embassies: Record<string, ContactCard[]>;
};

// The canonical default ruleset, built from the in-code tables. When the DB is
// empty/unavailable the resolver returns this verbatim, so behavior is
// identical to the pre-DB engine.
export const DEFAULT_RULESET: VisaRuleset = {
  destinations: [...DESTINATIONS],
  cities: DESTINATION_CITIES,
  nationalities: [...NATIONALITIES],
  demonyms: DEMONYMS,
  patronymic: Object.fromEntries(
    NATIONALITIES.map((n) => [n, patronymicRule(n)])
  ) as Record<string, PatronymicRule>,
  koreanVisaTypes: [...KOREAN_VISA_STATUSES],
  baseDocuments: BASE_DOCUMENTS,
  statusDocuments: STATUS_DOCUMENTS,
  dateRules: DESTINATION_RULES,
  eligibility: DESTINATION_ELIGIBILITY,
  countryGuidance: COUNTRY_GUIDANCE,
  embassies: Object.fromEntries(
    Object.entries(DESTINATION_RULES).map(([k, v]) => [k, v.contacts])
  ),
};
