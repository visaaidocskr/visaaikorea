import type { ReactNode } from "react";

/**
 * Data model for the official "Visa Application Form for Entry into Taiwan,
 * R.O.C." Unlike Japan's Busan form, Taiwan's official system generates the
 * final filled PDF only AFTER data is entered on Taiwan's own online portal —
 * there is no blank fillable template we can source. This component is a
 * faithful REFERENCE replica (bordered layout matching the real form's boxed
 * style, same field numbers 1–23 and declarations A–H) so office staff can
 * see every collected field in one place before re-entering it on Taiwan's
 * portal — the same role Japan's Seoul eVisa "Personal Information" sheet
 * plays for the eVisa route. It is not itself the document submitted to the
 * mission.
 */
export interface TaiwanVisaData {
  surname: string;
  givenName: string;
  // Field 4 "Former or other name(s)" — also where a patronymic lands, since
  // Taiwan's form has no dedicated patronymic slot (see lib/docs/taiwanData.ts).
  formerOrOtherName: string;
  nationality: string;
  formerNationality: string;
  sex: "male" | "female" | "";
  maritalStatus: "single" | "married" | "widowed" | "separated" | "divorced" | "other" | "";
  dateOfBirth: string;
  birthCity: string;
  birthCountry: string;
  occupation: string;
  institutionName: string;

  taiwanAddress: string;
  taiwanPhone: string;

  homeAddress: string;
  homePhone: string;

  passportType: "diplomatic" | "official" | "regular" | "other";
  passportNumber: string;
  passportIssuePlace: string;
  passportIssueDate: string;
  passportExpiryDate: string;

  purposeOfTravel:
    | ""
    | "tourism"
    | "business"
    | "study"
    | "employment"
    | "family"
    | "religion"
    | "entrepreneur"
    | "other";
  purposeOfTravelOther: string;
  arrivalDate: string;
  departureDate: string;

  email: string;
  applicationDate: string;

  // Page-2 declarations (A–H) — applicant-answered only, never fabricated.
  // `null` means unanswered (renders both Yes/No boxes empty).
  backgroundAnswers: {
    criminalRecord: boolean | null;
    illegalEntry: boolean | null;
    communicableDisease: boolean | null;
    overstayedOrIllegalWork: boolean | null;
    drugTrafficking: boolean | null;
    visaRefused: boolean | null;
    differentName: boolean | null;
    workedInTaiwan: boolean | null;
  };
}

const PRINT_STYLES = `
.tw-visa-root { background:#9ca3af; }
.tw-visa-page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 12mm 14mm;
  background:#ffffff;
  color:#000000;
  box-sizing: border-box;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.tw-visa-page + .tw-visa-page { margin-top: 8mm; }
@media screen { .tw-visa-page { box-shadow: 0 1px 8px rgba(0,0,0,.35); } }
@media print {
  .tw-visa-root { background:#ffffff; }
  @page { size: A4 portrait; margin: 0; }
  html, body { margin:0; padding:0; background:#fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tw-visa-page { box-shadow:none; margin:0; page-break-inside: avoid; }
  .tw-page-break { page-break-after: always; break-after: page; }
}
.tw-cell { border: 1px solid #000; }
`;

const NBSP = " ";
function val(v?: string): string {
  return v && v.trim().length > 0 ? v : NBSP;
}

/** A bordered box: small Chinese/English field number + label, value below/beside. */
function Field({
  no,
  labelZh,
  labelEn,
  children,
  className = "",
}: {
  no?: string;
  labelZh?: string;
  labelEn: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`tw-cell px-2 py-1.5 ${className}`}>
      <div className="text-[7.5px] leading-tight text-black/80">
        {no ? `${no}. ` : ""}
        {labelZh ? `${labelZh} ` : ""}
        {labelEn}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold leading-tight text-black">
        {children ?? NBSP}
      </div>
    </div>
  );
}

function Check({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <span className="mr-3 inline-flex items-center gap-1 text-[9px] leading-none text-black">
      <span className="relative inline-block h-[9px] w-[9px] border border-black align-middle">
        {checked && (
          <span className="absolute -inset-[3px] flex items-center justify-center text-[9px] font-bold leading-none">
            ■
          </span>
        )}
      </span>
      {label}
    </span>
  );
}

function YesNo({ value }: { value?: boolean | null }) {
  return (
    <span className="ml-3 flex shrink-0 items-center gap-3 text-[9px]">
      <Check label="YES" checked={value === true} />
      <Check label="NO" checked={value === false} />
    </span>
  );
}

const QUESTIONS: {
  key: keyof TaiwanVisaData["backgroundAnswers"];
  letter: string;
  textZh: string;
  textEn: string;
}[] = [
  {
    key: "criminalRecord",
    letter: "A",
    textZh: "是否在中華民國境內或境外曾有犯罪紀錄或曾遭中華民國政府拒絕入境、限令出境或驅逐出境？",
    textEn:
      "Do you have a criminal record within or outside the territory of the R.O.C. or have you ever been denied entry, ordered to leave or deported by the R.O.C. government?",
  },
  { key: "illegalEntry", letter: "B", textZh: "是否曾非法入境中華民國者？", textEn: "Have you ever entered Taiwan illegally?" },
  {
    key: "communicableDisease",
    letter: "C",
    textZh: "是否患有足以妨害公共衛生或社會安寧之傳染病、精神病，或吸毒或其他疾病或吸毒成癮者？",
    textEn:
      "Have you ever had a communicable disease of public health significance, a dangerous physical or mental disorder, or been a drug abuser or addict?",
  },
  {
    key: "overstayedOrIllegalWork",
    letter: "D",
    textZh: "是否曾在中華民國境內逾期停留、逾期居留或非法工作？",
    textEn: "Have you ever overstayed or worked illegally in Taiwan, R.O.C.?",
  },
  { key: "drugTrafficking", letter: "E", textZh: "是否曾從事管制藥品(如毒品)交易？", textEn: "Have you ever been a controlled substance (drug) trafficker?" },
  { key: "visaRefused", letter: "F", textZh: "你是否曾遭中華民國駐外代表機構拒發簽證？", textEn: "Have you ever been refused a visa by an R.O.C. mission abroad?" },
  { key: "differentName", letter: "G", textZh: "是否曾以其他姓名申請中華民國簽證？", textEn: "Have you ever applied for an R.O.C. visa using a different name?" },
  { key: "workedInTaiwan", letter: "H", textZh: "是否曾在中華民國境內工作？", textEn: "Have you ever worked in Taiwan?" },
];

const PURPOSE_LABELS: Record<string, string> = {
  tourism: "Tourism",
  business: "Business",
  study: "Study",
  employment: "Employment",
  family: "Joining or visiting family",
  religion: "Religion",
  entrepreneur: "Entrepreneur",
  other: "Other",
};

export default function TaiwanVisaForm({ data }: { data: TaiwanVisaData }) {
  return (
    <div className="tw-visa-root">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ============================== PAGE 1 ============================== */}
      <section className="tw-visa-page tw-page-break">
        <div className="flex gap-3">
          <div className="tw-cell flex w-[140px] shrink-0 flex-col items-center justify-center gap-1 p-2 text-center text-[7.5px] leading-tight text-black">
            <span>六個月內兩寸半身彩色近照兩張</span>
            <span>Please attach two head &amp; shoulder color photos (taken within last 6 months)</span>
          </div>
          <div className="tw-cell flex-1 p-2 text-[8px] leading-tight text-black/70">
            <div className="font-bold">核發機關填註 FOR OFFICIAL USE ONLY</div>
          </div>
        </div>

        <h1 className="mb-1 mt-3 text-center text-[13px] font-bold text-black">
          中華民國簽證申請表　VISA APPLICATION FORM FOR ENTRY INTO TAIWAN, R.O.C.
        </h1>
        <p className="mb-3 text-center text-[7.5px] text-black/70">
          Prepared via Vitamin VisaAI — internal reference sheet, re-entered by staff on Taiwan&apos;s official
          online visa portal. Not itself the document submitted to the mission.
        </p>

        <div className="tw-cell p-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[9px] text-black">
            <span className="font-bold">1. Category / 種類：</span>
            <Check label="Visitor visa 停留簽證" checked />
            <Check label="Resident visa 居留簽證" />
            <Check label="Diplomatic visa 外交簽證" />
            <Check label="Courtesy visa 禮遇簽證" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-[9px] text-black">
            <span className="font-bold">2. Entry / 入境次數：</span>
            <Check label="Single 單次" checked />
            <Check label="Multiple 多次" />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-0">
          <Field no="3" labelEn="Surname (as in passport)" labelZh="姓">
            {val(data.surname)}
          </Field>
          <Field no="" labelEn="Given name(s)" labelZh="名">
            {val(data.givenName)}
          </Field>
          <Field no="4" labelEn="Former or other name(s), if any" labelZh="舊有或其他姓名">
            {val(data.formerOrOtherName)}
          </Field>
          <Field no="5" labelEn="Chinese name, if any" labelZh="中文姓名">
            N/A
          </Field>
          <Field no="6" labelEn="Nationality" labelZh="國籍">
            {val(data.nationality)}
          </Field>
          <Field no="7" labelEn="Former / other nationality, if any" labelZh="舊有或其他國籍">
            {val(data.formerNationality)}
          </Field>
          <Field no="8" labelEn="Sex" labelZh="性別">
            <span className="inline-flex gap-3">
              <Check label="Male" checked={data.sex === "male"} />
              <Check label="Female" checked={data.sex === "female"} />
            </span>
          </Field>
          <Field no="9" labelEn="Marital status" labelZh="婚姻狀況">
            <span className="inline-flex flex-wrap gap-2">
              <Check label="Single" checked={data.maritalStatus === "single"} />
              <Check label="Married" checked={data.maritalStatus === "married"} />
              <Check label="Widowed" checked={data.maritalStatus === "widowed"} />
              <Check label="Separated" checked={data.maritalStatus === "separated"} />
              <Check label="Divorced" checked={data.maritalStatus === "divorced"} />
              <Check label="Other" checked={data.maritalStatus === "other"} />
            </span>
          </Field>
          <Field no="10" labelEn="Date of birth (Year/Month/Day)" labelZh="出生日期">
            {val(data.dateOfBirth)}
          </Field>
          <Field no="11" labelEn="Place of birth — City / Country" labelZh="出生地點">
            {[val(data.birthCity), val(data.birthCountry)].filter((v) => v !== NBSP).join(" / ") || NBSP}
          </Field>
          <Field no="12" labelEn="Occupation" labelZh="職業">
            {val(data.occupation)}
          </Field>
          <Field no="13" labelEn="Institution / school name" labelZh="機關或學校">
            {val(data.institutionName)}
          </Field>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-0">
          <Field no="14" labelEn="Address & phone No. in Taiwan" labelZh="在台住址及電話號碼">
            <span className="mr-4">{val(data.taiwanAddress)}</span>
            {data.taiwanPhone && <span className="text-black/70">Tel. {data.taiwanPhone}</span>}
          </Field>
          <Field no="15" labelEn="Permanent address & phone No. in home country" labelZh="本國住址及電話號碼">
            <span className="mr-4">{val(data.homeAddress)}</span>
            {data.homePhone && <span className="text-black/70">Tel. {data.homePhone}</span>}
          </Field>
        </div>

        <div className="mt-2 tw-cell p-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[9px] text-black">
            <span className="font-bold">16. Passport type / 種類：</span>
            <Check label="Diplomatic 外交" checked={data.passportType === "diplomatic"} />
            <Check label="Official 公務" checked={data.passportType === "official"} />
            <Check label="Regular 普通" checked={data.passportType === "regular"} />
            <Check label="Other 其他" checked={data.passportType === "other"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0">
          <Field no="17" labelEn="Passport No." labelZh="護照號碼">
            {val(data.passportNumber)}
          </Field>
          <Field no="18" labelEn="Date of expiry (Year/Month/Day)" labelZh="效期屆滿日">
            {val(data.passportExpiryDate)}
          </Field>
          <Field no="19" labelEn="Date of issue (Year/Month/Day)" labelZh="發照日期">
            {val(data.passportIssueDate)}
          </Field>
          <Field no="20" labelEn="Place of issue" labelZh="發照地點">
            {val(data.passportIssuePlace)}
          </Field>
        </div>

        <div className="mt-2 tw-cell p-2">
          <div className="text-[9px] font-bold text-black">
            21. Purpose of travel / 訪台目的：JOURNEY TO TAIWAN, R.O.C. 訪台行程
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(PURPOSE_LABELS).map(([key, label]) => (
              <Check key={key} label={label} checked={data.purposeOfTravel === key} />
            ))}
          </div>
          {data.purposeOfTravel === "other" && (
            <div className="mt-1 text-[9px] text-black">
              Please specify: {val(data.purposeOfTravelOther)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-0">
          <Field no="22" labelEn="Propose date of arrival (Year/Month/Day)" labelZh="預定抵台日期">
            {val(data.arrivalDate)}
          </Field>
          <Field no="23" labelEn="Propose date of departure from Taiwan (Year/Month/Day)" labelZh="預定離台日期">
            {val(data.departureDate)}
          </Field>
        </div>

        <div className="mt-2 tw-cell p-2 text-[8px] leading-relaxed text-black">
          <div className="font-bold">Particulars of Reference in Taiwan (if applicable) 在台關係人</div>
          <div className="mt-1 grid grid-cols-2 gap-x-6">
            <span>Name 姓名：N/A</span>
            <span>Relationship to applicant 與申請人關係：N/A</span>
            <span>ROC ID / ARC No. 身分證字號：N/A</span>
            <span>Institution name 機構：N/A</span>
            <span>Institution phone No. 機構電話：N/A</span>
            <span>Residential address 住址：N/A</span>
          </div>
        </div>

        <PageFooter page={1} />
      </section>

      {/* ============================== PAGE 2 ============================== */}
      <section className="tw-visa-page">
        <p className="mb-3 text-[8px] leading-snug text-black">
          * 請據實回答以下問題 ALL APPLICANTS ARE REQUIRED TO READ AND CHECK THE APPROPRIATE BOX FOR EACH ITEM:
        </p>

        <div className="space-y-2.5">
          {QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-start gap-3 text-[8.5px] leading-snug text-black">
              <span className="flex-1">
                <span className="font-semibold">{q.letter}.</span> {q.textZh}
                <br />
                {q.textEn}
              </span>
              <YesNo value={data.backgroundAnswers[q.key]} />
            </div>
          ))}
        </div>

        <p className="mt-3 text-[7.5px] leading-snug text-black/80">
          Attention: A YES response does not automatically disqualify you for a visa. If you have any YES
          responses, or if you are unsure how to answer any of the questions, please prepare a written
          explanation and any relevant supporting documents for each instance.
        </p>

        <div className="mt-4 border-t border-black pt-3">
          <h4 className="text-[10px] font-bold text-black">茲聲明 Acknowledgement</h4>
          <p className="mt-1 text-[8px] leading-snug text-black">
            I certify that: I have read and understood all the questions set forth in this application and the
            answers I have provided are true and correct to the best of my knowledge. I understand that holding a
            Republic of China visa does not necessarily mean I will be allowed to enter the R.O.C. I understand
            that any false or misleading statement may result in the refusal of a visa or denial of entry into the
            R.O.C.
          </p>
        </div>

        <div className="mt-4 border-t border-black pt-3 text-[8px] leading-snug text-black">
          <p className="font-bold">警告 WARNING:</p>
          <p>Drug trafficking is punishable by death according to the criminal law of the Republic of China.</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-10 gap-y-2">
          <Field labelEn="Date of application" labelZh="申請年月日">
            {val(data.applicationDate)}
          </Field>
          <Field labelEn="Applicant email" labelZh="申請人Email">
            {val(data.email)}
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6 text-[9px] text-black">
          <div className="border-b border-black pb-4">Applicant&apos;s signature 申請人簽名</div>
          <div className="border-b border-black pb-4">Signature of applicant&apos;s agent 代理人簽名</div>
        </div>

        <PageFooter page={2} />
      </section>
    </div>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <div className="mt-4 flex items-center justify-between text-[6.5px] text-black/70">
      <span>
        Prepared via Vitamin VisaAI. Visa approval is decided solely by the Taipei Mission in Korea / R.O.C.
        authorities.
      </span>
      <span>Page {page} of 2</span>
    </div>
  );
}
