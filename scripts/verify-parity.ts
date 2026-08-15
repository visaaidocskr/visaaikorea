/**
 * Parity check (temporary, safe to delete): proves that threading the resolved
 * VisaRuleset through the engine produces byte-identical results to the original
 * module-level calls. This is the core risk of the P0 refactor — that passing
 * ruleset slices changes behavior. With no DB, resolveRuleset() returns
 * DEFAULT_RULESET, so DEFAULT_RULESET parity == running-app parity.
 *
 *   npx tsx scripts/verify-parity.ts
 */
import { DEFAULT_RULESET as rs } from "../lib/visa/ruleset";
import {
  documentsForStatus,
  patronymicRule,
  KOREAN_VISA_STATUSES,
  NATIONALITIES,
  DESTINATIONS,
} from "../lib/visa/config";
import {
  getDestinationRule,
  getRecommendation,
  travelStartWindow,
  validateDates,
  getCountryGuidance,
} from "../lib/visa/destinations";
import { evaluateEligibility } from "../lib/visa/eligibility";

let checks = 0;
let diffs = 0;
function eq(label: string, a: unknown, b: unknown) {
  checks++;
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    diffs++;
    console.error(`✗ DIFF ${label}\n   default: ${sa}\n   ruleset: ${sb}`);
  }
}

const sampleDates = [
  { planned_submission_date: "", travel_start_date: "", travel_end_date: "" },
  {
    planned_submission_date: "2026-07-01",
    travel_start_date: "2026-07-15",
    travel_end_date: "2026-07-18",
  },
  {
    planned_submission_date: "2026-07-01",
    travel_start_date: "2026-07-02",
    travel_end_date: "2026-08-30",
  },
];

// Eligibility: every nationality × destination (+ self-destination cases).
const allNats = Array.from(new Set([...NATIONALITIES, ...DESTINATIONS]));
for (const dest of DESTINATIONS) {
  for (const nat of allNats) {
    eq(
      `eligibility ${nat}->${dest}`,
      evaluateEligibility(nat, dest),
      evaluateEligibility(nat, dest, rs.eligibility, rs.demonyms)
    );
  }
}

// Patronymic rule per nationality.
for (const nat of NATIONALITIES) {
  eq(`patronymic ${nat}`, patronymicRule(nat), patronymicRule(nat, rs.patronymic));
}

// Documents per Korean visa status.
for (const status of KOREAN_VISA_STATUSES) {
  eq(
    `documents ${status}`,
    documentsForStatus(status),
    documentsForStatus(status, rs.baseDocuments, rs.statusDocuments)
  );
}

// Date rules, recommendations, windows, validation, guidance per destination.
for (const dest of DESTINATIONS) {
  eq(`dateRule ${dest}`, getDestinationRule(dest), getDestinationRule(dest, rs.dateRules));
  eq(`guidance ${dest}`, getCountryGuidance(dest), getCountryGuidance(dest, rs.countryGuidance));
  for (const anchor of ["", "2026-07-01"]) {
    eq(
      `recommendation ${dest} @${anchor}`,
      getRecommendation(dest, anchor),
      getRecommendation(dest, anchor, rs.dateRules)
    );
    eq(
      `window ${dest} @${anchor}`,
      travelStartWindow(dest, anchor),
      travelStartWindow(dest, anchor, rs.dateRules)
    );
  }
  for (const d of sampleDates) {
    eq(
      `validateDates ${dest} ${d.travel_start_date}`,
      validateDates(dest, d),
      validateDates(dest, d, rs.dateRules)
    );
  }
}

// Lists carried on the ruleset must match the source tables.
eq("destinations list", [...DESTINATIONS], rs.destinations);
eq("nationalities list", [...NATIONALITIES], rs.nationalities);
eq("koreanVisaTypes list", [...KOREAN_VISA_STATUSES], rs.koreanVisaTypes);

console.log(`\n${checks} checks, ${diffs} diffs`);
if (diffs > 0) {
  console.error("PARITY FAILED");
  process.exit(1);
}
console.log("PARITY OK — ruleset-threaded engine matches the code defaults.");
