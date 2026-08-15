/**
 * Supabase connectivity + integration check — uses your EXISTING keys in
 * .env.local, creates no new config. Confirms the (auth-disabled) integration
 * end to end: URL reachable, anon key valid, service-role key valid, the
 * applicant-uploads bucket exists, and a real Storage upload/delete works.
 *
 *   npx tsx scripts/check-supabase.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file: string) {
  let text = "";
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
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env.local");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = "applicant-uploads";

const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => console.log(`  ❌ ${m}`);

async function main() {
  console.log("Supabase integration check\n");
  console.log(`URL:            ${URL || "(missing)"}`);
  console.log(`anon key:       ${ANON ? ANON.slice(0, 15) + "… (len " + ANON.length + ")" : "(missing)"}`);
  console.log(`service key:    ${SERVICE ? SERVICE.slice(0, 12) + "… (len " + SERVICE.length + ")" : "(missing)"}\n`);

  if (!URL || !ANON || !SERVICE) {
    bad("One or more values are missing from .env.local — cannot continue.");
    process.exit(1);
  }

  // 1. Reachability + anon key
  try {
    const r = await fetch(`${URL}/auth/v1/health`, { headers: { apikey: ANON } });
    if (r.ok) ok(`Project reachable (auth health ${r.status})`);
    else bad(`Auth health returned ${r.status}`);
  } catch (e) {
    bad(`Project UNREACHABLE: ${(e as Error).message}`);
    console.log("\n→ Your Supabase project appears offline/paused. Open the dashboard and Resume it.");
    process.exit(1);
  }

  const admin = createClient(URL, SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Service-role key valid? List buckets.
  const { data: buckets, error: bucketErr } = await admin.storage.listBuckets();
  if (bucketErr) {
    bad(`Service-role key rejected by Storage: ${bucketErr.message}`);
  } else {
    ok(`Service-role key works (buckets: ${buckets.map((b) => b.name).join(", ") || "none"})`);
    if (!buckets.some((b) => b.name === BUCKET)) {
      bad(`Bucket "${BUCKET}" is MISSING — run migration 0002.`);
    } else {
      ok(`Bucket "${BUCKET}" exists`);
    }
  }

  // 3. Real upload + delete round-trip (what the form does).
  const testPath = `__healthcheck__/${Date.now()}.txt`;
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(testPath, Buffer.from("ok"), { contentType: "text/plain", upsert: true });
  if (upErr) {
    bad(`Storage upload FAILED: ${upErr.message}`);
  } else {
    ok("Storage upload works");
    await admin.storage.from(BUCKET).remove([testPath]);
  }

  // 4. DB read via service role.
  const { error: dbErr } = await admin.from("applications").select("id").limit(1);
  if (dbErr) bad(`DB read failed: ${dbErr.message}`);
  else ok("DB read works (service role bypasses RLS)");

  // 5. Japan migration 0006 — the columns/tables the app writes on every save.
  console.log("\nMigration 0006 (Japan) schema check:");
  const cols0006 = [
    "port_of_entry",
    "flight_booked",
    "accommodation_booked",
    "has_previous_japan_visits",
    "host_type",
    "remarks",
    "background_answers",
  ];
  const { error: colErr } = await admin
    .from("applications")
    .select(cols0006.join(","))
    .limit(1);
  if (colErr) {
    bad(`applications is MISSING 0006 columns: ${colErr.message}`);
  } else {
    ok(`applications has all 0006 columns (${cols0006.length})`);
  }
  for (const t of ["flight_bookings", "accommodations", "previous_japan_visits", "japan_hosts"]) {
    const { error } = await admin.from(t).select("application_id").limit(1);
    if (error) bad(`table "${t}" MISSING: ${error.message}`);
    else ok(`table "${t}" exists`);
  }

  console.log(
    "\nIf the 0006 lines are ❌: run supabase/migrations/0006_japan_application.sql." +
      "\nIf you already ran it but they're still ❌: reload the API schema cache" +
      " (Supabase → Settings → API → “Reload schema”, or: NOTIFY pgrst, 'reload schema';)."
  );
}

main().catch((e) => {
  console.error("Check crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
