/**
 * Seed the visa-engine tables (migration 0004) from the in-code defaults.
 *
 * The TypeScript ruleset (lib/visa/*) stays the single source of truth for the
 * DEFAULTS; this script copies them into the database so they become editable
 * and extensible (new countries/nationalities) without a redeploy. The app
 * reads through the DB and falls back to the same code defaults, so seeding is
 * optional and changes nothing observable until you edit a row.
 *
 * Idempotent: each table is wiped and re-inserted, so the DB always matches the
 * current code defaults after a run.
 *
 *   npx tsx scripts/seed-visa-rules.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (from .env.local).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_RULESET } from "../lib/visa/ruleset";
import { visaStatusCode } from "../lib/visa/config";
import { COUNTRIES } from "../lib/visa/countryContent";

// --- load .env.local (tsx does not auto-load it) ---------------------------
function loadEnv(file: string) {
  let text: string;
  try {
    text = readFileSync(resolve(process.cwd(), file), "utf8");
  } catch {
    return;
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."
  );
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function wipeAndInsert(table: string, rows: Record<string, unknown>[]) {
  const del = await db.from(table).delete().not("id", "is", null);
  if (del.error) {
    throw new Error(`delete ${table}: ${del.error.message}`);
  }
  if (rows.length) {
    const ins = await db.from(table).insert(rows);
    if (ins.error) throw new Error(`insert ${table}: ${ins.error.message}`);
  }
  console.log(`  ✓ ${table}: ${rows.length} rows`);
}

async function main() {
  const rs = DEFAULT_RULESET;
  console.log("Seeding visa-engine tables from code defaults…");

  // 1. destinations (display fields from countryContent)
  const display = Object.fromEntries(COUNTRIES.map((c) => [c.country, c]));
  await wipeAndInsert(
    "destinations",
    rs.destinations.map((country, i) => ({
      country,
      flag: display[country]?.flag ?? null,
      visa_type: display[country]?.visaType ?? null,
      cities: rs.cities[country] ?? [],
      accent: display[country]?.accent ?? null,
      sort_order: (i + 1) * 10,
    }))
  );

  // 2. nationalities
  await wipeAndInsert(
    "nationalities",
    rs.nationalities.map((name, i) => ({
      name,
      demonym: rs.demonyms[name] ?? name,
      patronymic_rule: rs.patronymic[name] ?? "optional",
      sort_order: (i + 1) * 10,
    }))
  );

  // 3. korean_visa_types
  await wipeAndInsert(
    "korean_visa_types",
    rs.koreanVisaTypes.map((label, i) => ({
      code: visaStatusCode(label),
      label,
      sort_order: (i + 1) * 10,
    }))
  );

  // 4. embassies
  const embassyRows: Record<string, unknown>[] = [];
  for (const [destination, contacts] of Object.entries(rs.embassies)) {
    contacts.forEach((c, i) =>
      embassyRows.push({
        destination_country: destination,
        office: c.office,
        address: c.address,
        phone: c.phone,
        email: c.email ?? null,
        sort_order: (i + 1) * 10,
      })
    );
  }
  await wipeAndInsert("embassies", embassyRows);

  // 5. eligibility_rules (default row = nationality null)
  const eligRows: Record<string, unknown>[] = [];
  for (const [destination, entry] of Object.entries(rs.eligibility)) {
    const push = (nationality: string | null, rule: typeof entry.default) =>
      eligRows.push({
        destination_country: destination,
        nationality,
        outcome: rule.outcome,
        max_stay_days: rule.maxStayDays ?? null,
        note: rule.note ?? null,
        entry_conditions: rule.entryConditions ?? null,
        travel_guidance: rule.travelGuidance ?? null,
      });
    push(null, entry.default);
    for (const [nat, rule] of Object.entries(entry.byNationality)) {
      push(nat, rule);
    }
  }
  await wipeAndInsert("eligibility_rules", eligRows);

  // 6. destination_date_rules
  await wipeAndInsert(
    "destination_date_rules",
    Object.entries(rs.dateRules).map(([destination, r]) => ({
      destination_country: destination,
      anchor_label: r.anchorLabel,
      anchor_required: r.anchorRequired,
      lead_min_days: r.leadMinDays,
      lead_max_days: r.leadMaxDays ?? null,
      lead_max_months: r.leadMaxMonths ?? null,
      min_stay_days: r.minStayDays,
      max_stay_days: r.maxStayDays,
      recommended_stay_min: r.recommendedStayMin,
      recommended_stay_max: r.recommendedStayMax,
      max_stay_error: r.maxStayError,
      lead_too_soon_error: r.leadTooSoonError,
      bank_recommendation_krw: r.bankRecommendationKRW,
      guidance: r.guidance,
      processing_text: r.processingText,
      requires_appointment: r.requiresAppointment ?? false,
      appointment_info: r.appointmentInfo ?? null,
    }))
  );

  // 7. required_documents (destination-independent base + status checklist)
  const docRows: Record<string, unknown>[] = [];
  rs.baseDocuments.forEach((d, i) =>
    docRows.push({
      destination_country: null,
      korean_visa_code: null,
      doc_key: d.key,
      label_en: d.labelEn,
      label_ko: d.labelKo ?? null,
      required: d.required,
      hint: d.hint ?? null,
      category: "base",
      sort_order: (i + 1) * 10,
    })
  );
  for (const [code, docs] of Object.entries(rs.statusDocuments)) {
    docs.forEach((d, i) =>
      docRows.push({
        destination_country: null,
        korean_visa_code: code,
        doc_key: d.key,
        label_en: d.labelEn,
        label_ko: d.labelKo ?? null,
        required: d.required,
        hint: d.hint ?? null,
        category: "status",
        sort_order: (i + 1) * 10,
      })
    );
  }
  await wipeAndInsert("required_documents", docRows);

  // 8. country_guidance
  await wipeAndInsert(
    "country_guidance",
    Object.entries(rs.countryGuidance).map(([destination, g]) => ({
      destination_country: destination,
      visa_validity: g.visaValidity,
      max_stay: g.maxStay,
      processing_time: g.processingTime,
      why_recommended_dates: g.whyRecommendedDates,
      risks_too_close: g.risksTooClose,
      recommended_duration: g.recommendedDuration,
      important_notes: g.importantNotes,
    }))
  );

  console.log("Done. financial_requirements / faqs / latest_updates left empty (P1/P2).");
}

main().catch((e) => {
  console.error("Seed failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
