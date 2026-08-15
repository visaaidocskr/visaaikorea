// Dev-only smoke test for generateTravelPurposeDoc's redesigned layout
// (title block, info tables, per-country watermark, trip_reason quote block,
// and the AI translate/polish step in lib/ai/polishTripReason.ts).
// Not wired into the app — run manually with `npx tsx scripts/_tmp_test_travel_purpose.ts`
// after temporarily stubbing the `server-only` package (it throws in plain
// Node otherwise); writes sample .docx files to /tmp/wm_test for visual review.
import fs from "node:fs";
import path from "node:path";
import { generateTravelPurposeDoc } from "../lib/docs/generators";
import type { GenBundle } from "../lib/docs/templateData";

async function run() {
  const uzbekBundle: GenBundle = {
    application: {
      id: "test-uzbek",
      destination_country: "Taiwan",
      destination_city: "Taipei",
      nationality: "Uzbekistan",
      korean_visa_status: "E-7",
      travel_purpose: "Tourism",
      travel_start_date: "2026-09-10",
      travel_end_date: "2026-09-17",
      stay_days: 7,
      current_korea_address: "Seoul, Korea",
      client_email: "client@example.com",
      client_phone: "+82-10-1234-5678",
      japan_processing_type: null,
      trip_reason:
        "men doim tayvanga borishni orzu qilganman, chunki u yerda tabiat va tog'lar juda chiroyli, va mashhur Taroko darasini ozim korishni hoxlayman. ishdosh do'stim otgan yili tayvanga borgan va menga juda maslahat berdi, ovqatlari ham mazali ekan.",
    },
    details: {
      surname: "Karimov",
      given_name: "Jasur",
      middle_name_or_patronymic: "",
      full_name_as_passport: "KARIMOV JASUR",
      date_of_birth: "1992-03-14",
      passport_number: "AB1234567",
      nationality: "Uzbekistan",
      occupation: "Engineer",
      position_title: "Software Engineer",
      employer_or_school_name: "Samsung Electronics",
    },
    companions: [],
  };

  console.log("ANTHROPIC_API_KEY set:", Boolean(process.env.ANTHROPIC_API_KEY));
  const buf = await generateTravelPurposeDoc(uzbekBundle);

  const outDir = "/tmp/wm_test2";
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "uzbek_trip_reason.docx"), buf);
  console.log("Doc size:", buf.length);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
