import type { ReactNode } from "react";

/**
 * Data model for the official MOFA "Visa Application Form to Enter Japan"
 * (docs/1japan_visa_application_form.pdf, current revision). Fields map 1:1
 * to the labelled lines on the paper form. Fields that exist on the form but
 * are not part of this interface (Inviter block, criminal-history question
 * details, partner profession, remarks) are rendered blank for fidelity.
 *
 * IMPORTANT — this component's markup is a deliberate, line-by-line replica
 * of the ACTUAL rendered appearance of docs/1japan_visa_application_form.pdf
 * (plain label + underline, no boxes/grid around fields — the source PDF is a
 * dynamic XFA form that most viewers, including the embassy's, cannot fill
 * programmatically, so this print route reproduces its exact visual layout
 * instead). Do not reintroduce bordered "table cell" styling — compare any
 * change against a fresh render of the source PDF (`pdftoppm docs/1japan_visa_application_form.pdf`)
 * before merging.
 */
export interface JapanVisaData {
  surname: string;
  givenName: string;
  otherNames: string;
  birthDate: string;
  birthCity: string;
  birthState: string;
  birthCountry: string;
  sex: "male" | "female";
  maritalStatus: "single" | "married" | "widowed" | "divorced";
  nationality: string;
  formerNationality: string;
  governmentId: string;

  passportType: "diplomatic" | "official" | "ordinary" | "other";
  passportNumber: string;
  passportIssuePlace: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  issuingAuthority: string;

  purposeOfVisit: string;
  intendedStay: string;
  arrivalDate: string;
  portOfEntry: string;
  airlineName: string;

  hotelName: string;
  hotelPhone: string;
  hotelAddress: string;

  previousJapanVisits: string;

  residentialAddress: string;
  phone: string;
  mobile: string;
  // Not on the official form — added for the agency to reach the applicant.
  // Small, clearly a service addition (see "Prepared via Vitamin VisaAI"
  // footer), never mistaken for an official field.
  email: string;

  occupation: string;
  employerName: string;
  employerPhone: string;
  employerAddress: string;

  guarantorName: string;
  guarantorPhone: string;
  guarantorAddress: string;
  guarantorBirthDate: string;
  // "" when no guarantor was selected/entered — must NOT default to a sex, or
  // the printed form shows a checked box for a section the applicant left blank.
  guarantorSex: "male" | "female" | "";
  guarantorRelationship: string;
  guarantorOccupation: string;
  guarantorStatus: string;

  // Same shape as guarantor* above, but for the separate "Inviter in Japan"
  // box. The applicant selects exactly one host role (HostStep.tsx); whichever
  // box doesn't match their role stays blank ("" fields render empty).
  inviterName: string;
  inviterPhone: string;
  inviterAddress: string;
  inviterBirthDate: string;
  inviterSex: "male" | "female" | "";
  inviterRelationship: string;
  inviterOccupation: string;
  inviterStatus: string;

  // Page-2 declarations — applicant-answered only, never fabricated. `null`
  // means the applicant hasn't answered (renders both Yes/No boxes empty).
  backgroundAnswers: {
    crime: boolean | null;
    imprisonment: boolean | null;
    drugs: boolean | null;
    deported: boolean | null;
    prostitution: boolean | null;
    trafficking: boolean | null;
  };
  remarks: string;
}

/* ------------------------------------------------------------------ *
 * Print / layout styles. Plain <style> so it is fully SSR-rendered and
 * honored by Puppeteer's print pipeline (no styled-jsx runtime needed).
 * No grid/box lines here — fields are plain "label + underline", matching
 * the source PDF's flat, non-tabular layout.
 * ------------------------------------------------------------------ */
const PRINT_STYLES = `
.jp-visa-root { background:#9ca3af; }
.jp-visa-page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 18mm 20mm;
  background:#ffffff;
  color:#000000;
  box-sizing: border-box;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.jp-visa-page + .jp-visa-page { margin-top: 8mm; }
@media screen { .jp-visa-page { box-shadow: 0 1px 8px rgba(0,0,0,.35); } }
@media print {
  .jp-visa-root { background:#ffffff; }
  @page { size: A4 portrait; margin: 0; }
  html, body { margin:0; padding:0; background:#fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .jp-visa-page { box-shadow:none; margin:0; page-break-inside: avoid; }
  .jp-page-break { page-break-after: always; break-after: page; }
}
.jp-blank { border-bottom: 1px solid #000; min-height: 12px; }
`;

const NBSP = " ";

/** Render a value, falling back to a non-breaking space to preserve height. */
function val(v?: string): string {
  return v && v.trim().length > 0 ? v : NBSP;
}

/* ------------------------------------------------------------------ *
 * Reusable primitives — all plain text + underline, no borders/boxes.
 * ------------------------------------------------------------------ */

/** One label immediately followed by an underlined blank, single line. */
function Field({
  label,
  children,
  indent = false,
  className = "",
}: {
  label: ReactNode;
  children?: ReactNode;
  indent?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline text-[10px] leading-tight text-black ${indent ? "pl-6" : ""} ${className}`}>
      <span className="whitespace-nowrap">{label}</span>
      <span className="jp-blank ml-1 flex-1 px-1">{children ?? NBSP}</span>
    </div>
  );
}

/** Like Field, but adds a small "(Day)/(Month)/(Year)" caption under the blank. */
function DateField({
  label,
  children,
  indent = false,
}: {
  label: ReactNode;
  children?: ReactNode;
  indent?: boolean;
}) {
  return (
    <div className={indent ? "pl-6" : ""}>
      <div className="flex items-baseline text-[10px] leading-tight text-black">
        <span className="whitespace-nowrap">{label}</span>
        <span className="jp-blank ml-1 flex-1 px-1">{children ?? NBSP}</span>
      </div>
      <div className="flex items-baseline text-[10px] leading-tight text-black">
        <span className="invisible whitespace-nowrap">{label}</span>
        <span className="ml-1 flex-1 px-1 text-[6.5px] text-black/70">(Day)/(Month)/(Year)</span>
      </div>
    </div>
  );
}

/** A standalone label line with no blank on the same line. */
function LabelLine({
  children,
  bold = false,
  indent = false,
}: {
  children: ReactNode;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div className={`text-[10px] leading-tight text-black ${bold ? "font-bold" : ""} ${indent ? "pl-6" : ""}`}>
      {children}
    </div>
  );
}

/** A full-width underlined blank on its own line (continuation of a label above). */
function BlankLine() {
  return <div className="jp-blank">{" "}</div>;
}

/** A small square checkbox with label; renders the checked state. */
function Check({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <span className="mr-3 inline-flex items-center gap-1 text-[10px] leading-none text-black">
      <span className="relative inline-block h-[9px] w-[9px] border border-black align-middle">
        {checked && (
          <span className="absolute -inset-[3px] flex items-center justify-center text-[9px] font-bold leading-none">
            ✓
          </span>
        )}
      </span>
      {label}
    </span>
  );
}

/** "Yes / No" checkbox pair, right-aligned at the end of a question row. */
function YesNo({ value }: { value?: boolean }) {
  return (
    <span className="ml-3 flex shrink-0 items-center gap-3 text-[9px]">
      <Check label="Yes" checked={value === true} />
      <Check label="No" checked={value === false} />
    </span>
  );
}

/** The three-part "Place of birth" blank (City / State or Province / Country). */
function PlaceOfBirth({ city, state, country }: { city?: string; state?: string; country?: string }) {
  return (
    <div className="flex-1">
      <div className="flex items-baseline gap-2 text-[10px] text-black">
        <span className="jp-blank flex-1 px-1">{val(city)}</span>
        <span className="jp-blank flex-1 px-1">{val(state)}</span>
        <span className="jp-blank flex-1 px-1">{val(country)}</span>
      </div>
      <div className="flex gap-2 text-[6.5px] text-black/70">
        <span className="flex-1 text-center">(City)</span>
        <span className="flex-1 text-center">(State or Province)</span>
        <span className="flex-1 text-center">(Country)</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Main component
 * ------------------------------------------------------------------ */

const CRIMINAL_QUESTIONS: {
  key: keyof JapanVisaData["backgroundAnswers"];
  text: string;
}[] = [
  { key: "crime", text: "been convicted of a crime or offence in any country?" },
  { key: "imprisonment", text: "been sentenced to imprisonment for 1 year or more in any country?**" },
  {
    key: "deported",
    text: "been deported or removed from Japan or any country for overstaying your visa or violating any law or regulation?",
  },
  {
    key: "drugs",
    text: "been convicted and sentenced for a drug offence in any country in violation of law concerning narcotics, marijuana, opium, stimulants or psychotropic substances?**",
  },
  {
    key: "prostitution",
    text: "engaged in prostitution, or in the intermediation or solicitation of a prostitute for other persons, or in the provision of a place for prostitution, or any other activity directly connected to prostitution?",
  },
  { key: "trafficking", text: "committed trafficking in persons or incited or aided another to commit such an offence?" },
];

/** A host/contact block (used for both Guarantor and Inviter sections). */
function ContactBlock({
  heading,
  name,
  phone,
  address,
  birthDate,
  sex,
  relationship,
  occupation,
  status,
}: {
  heading: ReactNode;
  name?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  sex?: "male" | "female" | "";
  relationship?: string;
  occupation?: string;
  status?: string;
}) {
  return (
    <div className="space-y-1.5">
      <LabelLine bold>{heading}</LabelLine>
      <div className="flex gap-6 pl-6">
        <div className="w-3/5">
          <Field label="Name">{val(name)}</Field>
        </div>
        <div className="w-2/5">
          <Field label="Tel.">{val(phone)}</Field>
        </div>
      </div>
      <div className="pl-6">
        <Field label="Address">{val(address)}</Field>
      </div>
      <div className="flex gap-6 pl-6">
        <div className="w-1/2">
          <DateField label="Date of birth">{val(birthDate)}</DateField>
        </div>
        <div className="flex w-1/2 items-center gap-1 pt-[1px] text-[10px] text-black">
          <span>Sex:</span>
          <Check label="Male" checked={sex === "male"} />
          <Check label="Female" checked={sex === "female"} />
        </div>
      </div>
      <div className="pl-6">
        <Field label="Relationship to applicant">{val(relationship)}</Field>
      </div>
      <div className="pl-6">
        <Field label="Profession or occupation and position">{val(occupation)}</Field>
      </div>
      <div className="pl-6">
        <Field label="Nationality and immigration status">{val(status)}</Field>
      </div>
    </div>
  );
}

export default function JapanVisaForm({ data }: { data: JapanVisaData }) {
  return (
    <div className="jp-visa-root">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ============================== PAGE 1 ============================== */}
      <section className="jp-visa-page jp-page-break">
        <h1 className="mb-4 text-center text-[15px] font-bold text-black">
          Visa Application Form to Enter Japan
        </h1>

        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-[55px] w-[140px] items-center justify-center border border-black text-center text-[8px] text-black">
            *Official use only
          </div>
          <div className="flex h-[125px] w-[105px] flex-col items-center justify-center gap-1 border border-black text-center text-[7.5px] leading-tight text-black">
            <span>(Paste photo here)</span>
            <span className="font-semibold">45mm × 45mm</span>
            <span>or 2in × 2in</span>
          </div>
        </div>

        <div className="space-y-[7px]">
          <Field label="Surname (as shown in passport)">{val(data.surname)}</Field>
          <Field label="Given and middle names (as shown in passport)">{val(data.givenName)}</Field>
          <div>
            <LabelLine indent>Other names (including any other names you are or have been known by)</LabelLine>
            <BlankLine />
          </div>

          <div className="flex gap-6">
            <div className="w-[38%]">
              <DateField label="Date of birth">{val(data.birthDate)}</DateField>
            </div>
            <div className="flex flex-1 items-baseline gap-2">
              <span className="whitespace-nowrap text-[10px] text-black">Place of birth</span>
              <PlaceOfBirth city={data.birthCity} state={data.birthState} country={data.birthCountry} />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex w-[38%] items-center gap-1 text-[10px] text-black">
              <span>Sex:</span>
              <Check label="Male" checked={data.sex === "male"} />
              <Check label="Female" checked={data.sex === "female"} />
            </div>
            <div className="flex flex-1 items-center gap-1 text-[10px] text-black">
              <span>Marital status:</span>
              <Check label="Single" checked={data.maritalStatus === "single"} />
              <Check label="Married" checked={data.maritalStatus === "married"} />
              <Check label="Widowed" checked={data.maritalStatus === "widowed"} />
              <Check label="Divorced" checked={data.maritalStatus === "divorced"} />
            </div>
          </div>

          <Field label="Nationality or citizenship">{val(data.nationality)}</Field>
          <Field label="Former and/or other nationalities or citizenships" indent>
            {val(data.formerNationality)}
          </Field>
          <Field label="ID No. issued to you by your government">{val(data.governmentId)}</Field>

          <div className="flex items-center gap-1 text-[10px] text-black">
            <span>Passport type:</span>
            <Check label="Diplomatic" checked={data.passportType === "diplomatic"} />
            <Check label="Official" checked={data.passportType === "official"} />
            <Check label="Ordinary" checked={data.passportType === "ordinary"} />
            <Check label="Other" checked={data.passportType === "other"} />
          </div>

          <Field label="Passport No.">{val(data.passportNumber)}</Field>

          <div className="flex gap-6">
            <div className="w-[58%]">
              <Field label="Place of issue">{val(data.passportIssuePlace)}</Field>
            </div>
            <div className="flex-1">
              <DateField label="Date of issue">{val(data.passportIssueDate)}</DateField>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-[58%]">
              <Field label="Issuing authority">{val(data.issuingAuthority)}</Field>
            </div>
            <div className="flex-1">
              <DateField label="Date of expiry">{val(data.passportExpiryDate)}</DateField>
            </div>
          </div>

          <Field label="Purpose of visit to Japan">{val(data.purposeOfVisit)}</Field>
          <Field label="Intended length of stay in Japan">{val(data.intendedStay)}</Field>
          <Field label="Date of arrival in Japan">{val(data.arrivalDate)}</Field>

          <div className="flex gap-6">
            <div className="w-1/2">
              <Field label="Port of entry into Japan">{val(data.portOfEntry)}</Field>
            </div>
            <div className="w-1/2">
              <Field label="Name of ship or airline">{val(data.airlineName)}</Field>
            </div>
          </div>

          <LabelLine>Names and addresses of hotels or persons with whom applicant intends to stay</LabelLine>
          <div className="flex gap-6 pl-6">
            <div className="w-3/5">
              <Field label="Name">{val(data.hotelName)}</Field>
            </div>
            <div className="w-2/5">
              <Field label="Tel.">{val(data.hotelPhone)}</Field>
            </div>
          </div>
          <div className="pl-6">
            <Field label="Address">{val(data.hotelAddress)}</Field>
          </div>

          <Field label="Dates and duration of previous stays in Japan">{val(data.previousJapanVisits)}</Field>

          <LabelLine>
            Your current residential address (if you have more than one address, please list them all)
          </LabelLine>
          <div className="pl-6">
            <Field label="Address">{val(data.residentialAddress)}</Field>
          </div>
          <div className="flex gap-4 pl-6">
            <div className="w-1/3">
              <Field label="Tel.">{val(data.phone)}</Field>
            </div>
            <div className="w-1/3">
              <Field label="Mobile No.">{val(data.mobile)}</Field>
            </div>
            <div className="w-1/3">
              <Field label="Email">{val(data.email)}</Field>
            </div>
          </div>

          <Field label="Current profession or occupation and position">{val(data.occupation)}</Field>

          <LabelLine>Name and address of employer</LabelLine>
          <div className="flex gap-6 pl-6">
            <div className="w-3/5">
              <Field label="Name">{val(data.employerName)}</Field>
            </div>
            <div className="w-2/5">
              <Field label="Tel.">{val(data.employerPhone)}</Field>
            </div>
          </div>
          <div className="pl-6">
            <Field label="Address">{val(data.employerAddress)}</Field>
          </div>
        </div>

        <PageFooter page={1} />
      </section>

      {/* ============================== PAGE 2 ============================== */}
      <section className="jp-visa-page">
        <div className="space-y-[7px]">
          <div>
            <LabelLine>*Partner&apos;s profession/occupation (or that of parents, if applicant is a minor):</LabelLine>
            <BlankLine />
          </div>

          <ContactBlock
            heading={
              <>
                Guarantor or reference in Japan
                <span className="font-normal">
                  {" "}
                  (Please provide details of the guarantor or the person to be visited in Japan)
                </span>
              </>
            }
            name={data.guarantorName}
            phone={data.guarantorPhone}
            address={data.guarantorAddress}
            birthDate={data.guarantorBirthDate}
            sex={data.guarantorSex}
            relationship={data.guarantorRelationship}
            occupation={data.guarantorOccupation}
            status={data.guarantorStatus}
          />

          {/* Filled only when the applicant's host role is "inviter"; blank otherwise. */}
          <ContactBlock
            heading={
              <>
                Inviter in Japan
                <span className="font-normal">
                  {" "}
                  (Please write &apos;same as above&apos; if the inviting person and the guarantor are the same)
                </span>
              </>
            }
            name={data.inviterName}
            phone={data.inviterPhone}
            address={data.inviterAddress}
            birthDate={data.inviterBirthDate}
            sex={data.inviterSex}
            relationship={data.inviterRelationship}
            occupation={data.inviterOccupation}
            status={data.inviterStatus}
          />

          <Field label="*Remarks/Special circumstances, if any">{val(data.remarks)}</Field>

          <LabelLine bold>Have you ever:</LabelLine>
          {CRIMINAL_QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-start gap-3 text-[9px] leading-snug text-black">
              <span className="flex-1">● {q.text}</span>
              <YesNo value={data.backgroundAnswers[q.key] ?? undefined} />
            </div>
          ))}
          <p className="text-[8px] leading-snug text-black">
            ** Please tick &ldquo;Yes&rdquo; if you have received any sentence, even if the sentence was suspended.
          </p>

          <div>
            <LabelLine>
              If you answered &ldquo;Yes&rdquo; to any of the above questions, please provide relevant details.
            </LabelLine>
            <div className="mt-1 min-h-[70px] w-full border border-black p-1.5 text-[9px] leading-snug text-black">
              {data.remarks || ""}
            </div>
          </div>

          <div className="space-y-2 pt-1 text-[9px] leading-snug text-black">
            <p>
              &ldquo;I hereby declare that the statement given above is true and correct. I understand that
              immigration status and period of stay to be granted are decided by the Japanese immigration
              authorities upon my arrival. I understand that possession of a visa does not entitle the bearer to
              enter Japan upon arrival at port of entry if he or she is found inadmissible.&rdquo;
            </p>
            <p>
              &ldquo;I hereby consent to the provision of my personal information (by an accredited travel agent,
              within its capacity of representing my visa application) to the Japanese embassy/consulate-general
              and (entrust the agent with) the payment of my visa fee to the Japanese embassy/consulate-general,
              when such payment is necessary.&rdquo;
            </p>
          </div>

          <div className="flex gap-10 pt-1">
            <div className="flex-1">
              <DateField label="Date of application">{NBSP}</DateField>
            </div>
            <div className="flex-1">
              <Field label="Signature of applicant">{NBSP}</Field>
            </div>
          </div>

          <p className="pt-1 text-[8px] text-black">* It is not mandatory to complete these items.</p>

          <p className="pt-2 text-[7px] leading-snug text-black/90">
            Any personal information gathered in this application as well as additional information submitted
            for the visa application (hereinafter referred to as &ldquo;Retained Personal Information&rdquo;) will
            be handled appropriately in accordance with the Act on the Protection of Personal Information Held
            by Administrative Organs (Act No. 58 of 2003, hereinafter, &ldquo;the Act&rdquo;). Retained Personal
            Information will only be used for the purpose of processing the visa application and to the extent
            necessary for the purposes stated in Article 8 of the Act.
          </p>
        </div>

        <PageFooter page={2} />
      </section>
    </div>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <div className="mt-3 flex items-center justify-between text-[6.5px] text-black/70">
      <span>
        Prepared via Vitamin VisaAI. Visa approval is decided solely by the embassy / consulate-general of Japan.
      </span>
      <span>Page {page} of 2</span>
    </div>
  );
}
