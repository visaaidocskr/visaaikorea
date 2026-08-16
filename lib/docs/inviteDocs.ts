// Korea-side invitation paperwork for a C-3-1 short-term family visit.
// Server-only.
//
// Three documents per invited person, matching what the missions expect:
//   1. 초청장            — the invitation itself
//   2. 초청 사유서        — the inviter's statement of reasons
//   3. 신원보증서         — the guarantee, form 별지 제129호서식
//
// On the guarantee form: unlike Taiwan's portal output, 별지 제129호서식 is a
// blank form published under 출입국관리법 시행규칙 for applicants to fill in.
// It carries no barcode and no system-issued number, so filling it out
// programmatically is exactly its intended use.
//
// Everything is written in Korean because that is the language the mission
// reads. Blank fields stay blank — nothing here is invented to fill a gap.
import "server-only";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from "docx";

// Korean needs an East Asian font or Word falls back and the glyphs look wrong.
const KO = "Malgun Gothic";

export type InviteDocInviter = {
  full_name: string;
  nationality: string;
  sex: string; // "male" | "female" | ""
  date_of_birth: string;
  passport_number: string;
  phone: string;
  address_korea: string;
  korean_visa_status: string;
  org_name: string;
  position: string;
  org_address: string;
};

export type InviteDocInvitee = {
  surname: string;
  given_name: string;
  middle_name: string;
  date_of_birth: string;
  sex: string;
  nationality: string;
  passport_number: string;
  address_home: string;
  phone_home: string;
  relationship: string;
};

export type InviteDocData = {
  inviter: InviteDocInviter;
  invitee: InviteDocInvitee;
  invitation_start_date: string;
  invitation_end_date: string;
  guarantee_months: number;
  destination_mission: string;
  /** The inviter's own words. Used verbatim in 초청 사유서 when present. */
  invitation_reason: string;
};

// --- small helpers ---------------------------------------------------------

function run(text: string, opts?: { bold?: boolean; size?: number }) {
  return new TextRun({
    text,
    bold: opts?.bold,
    size: opts?.size ?? 20,
    font: { ascii: KO, eastAsia: KO, hAnsi: KO },
  });
}

function para(text: string, opts?: { bold?: boolean; size?: number; after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }) {
  return new Paragraph({
    children: [run(text, opts)],
    alignment: opts?.align,
    spacing: { after: opts?.after ?? 80 },
  });
}

function title(text: string) {
  return new Paragraph({
    children: [run(text, { bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  });
}

// A checkbox pair rendered the way the paper form does: [ ] 남 [√] 여
function sexCell(sex: string): string {
  const male = sex === "male" ? "√" : " ";
  const female = sex === "female" ? "√" : " ";
  return `[${male}] 남   [${female}] 여`;
}

function fullName(i: InviteDocInvitee): string {
  return [i.surname, i.given_name, i.middle_name].filter(Boolean).join(" ");
}

// The wizard stores the status as its English label ("D-2 Student"), which
// would read oddly inside Korean prose. The mission only cares about the code.
function statusCode(status: string): string {
  return (status ?? "").trim().split(" ")[0];
}

// Clients type the relationship in English because the form is in English.
// Inside the Korean sentences we need the Korean word, so map the common ones
// and fall back to a neutral "가족" rather than dropping an English word into
// the middle of a Korean clause.
const RELATIONSHIP_KO: Record<string, string> = {
  mother: "어머니",
  father: "아버지",
  parent: "부모님",
  parents: "부모님",
  son: "아들",
  daughter: "딸",
  brother: "형제",
  sister: "자매",
  wife: "아내",
  husband: "남편",
  spouse: "배우자",
  grandmother: "할머니",
  grandfather: "할아버지",
  aunt: "이모",
  uncle: "삼촌",
};

function relationshipKo(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "가족";
  // Already Korean — use as written.
  if (/[ㄱ-힝]/.test(t)) return t;
  return RELATIONSHIP_KO[t.toLowerCase()] ?? "가족";
}

// Two-column label/value grid, bordered like the official forms.
function fieldRow(label: string, value: string) {
  const cell = (text: string, bold: boolean, width: number) =>
    new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [run(text, { bold })] })],
    });
  return new TableRow({ children: [cell(label, true, 30), cell(value || "", false, 70)] });
}

function fieldTable(rows: [string, string][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) => fieldRow(k, v)),
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    children: [run(text, { bold: true, size: 22 })],
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 4 } },
  });
}

function signatureBlock(name: string) {
  return [
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({
      children: [run("20____ 년   ____ 월   ____ 일")],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [run(`${name}          (서명 또는 인)`, { bold: true })],
      alignment: AlignmentType.RIGHT,
    }),
  ];
}

async function pack(children: (Paragraph | Table)[]): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: { ascii: KO, eastAsia: KO, hAnsi: KO }, size: 20 } },
      },
    },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

// Shared person blocks — identical on 초청장 and 신원보증서, which is why the
// paper forms repeat them.
function inviteeRows(d: InviteDocData): [string, string][] {
  const i = d.invitee;
  return [
    ["성 (Surname)", i.surname],
    ["명 (Given name)", i.given_name],
    ["중간이름 (Middle name)", i.middle_name],
    ["생년월일", i.date_of_birth],
    ["성별", sexCell(i.sex)],
    ["국적", i.nationality],
    ["여권번호", i.passport_number],
    ["주소", i.address_home],
    ["전화번호", i.phone_home],
    ["체류목적", "C-3-1 (단기방문)"],
  ];
}

function inviterRows(d: InviteDocData): [string, string][] {
  const v = d.inviter;
  return [
    ["성명", v.full_name],
    ["국적", v.nationality],
    ["성별", sexCell(v.sex)],
    ["여권번호 또는 생년월일", v.passport_number || v.date_of_birth],
    ["전화번호", v.phone],
    ["주소", v.address_korea],
    ["피초청인과의 관계", d.invitee.relationship],
    ["근무처", v.org_name],
    ["직위", v.position],
    ["근무처 주소", v.org_address],
  ];
}

// --- 1. 초청장 -------------------------------------------------------------
export async function generateInvitationLetter(d: InviteDocData): Promise<Buffer> {
  const inviteeName = fullName(d.invitee);
  const children: (Paragraph | Table)[] = [
    title("초 청 장"),
    para("※ [  ]에는 해당하는 곳에 √ 표시를 합니다.", { size: 16, after: 160 }),

    sectionHeading("피초청 외국인"),
    fieldTable(inviteeRows(d)),

    sectionHeading("초청인"),
    fieldTable(inviterRows(d)),

    sectionHeading("초청 기간"),
    para(`${d.invitation_start_date} ~ ${d.invitation_end_date}`),

    new Paragraph({ text: "", spacing: { after: 240 } }),
    para(`수신: ${d.destination_mission}`, { bold: true }),
    para(`초청인: ${d.inviter.full_name}`),
    para(`피초청인: ${inviteeName}`, { after: 200 }),

    para(
      `저는 현재 대한민국에 ${statusCode(d.inviter.korean_visa_status)} 자격으로 체류 중인 ${d.inviter.nationality} 국적의 ${d.inviter.full_name}입니다.`
    ),
    para(
      `저는 저의 ${relationshipKo(d.invitee.relationship)}인 ${inviteeName} 님을 단기 가족 방문 목적으로 대한민국에 초청하고자 합니다.`
    ),
    para(
      `이번 방문의 목적은 가족 방문이며, 방문 종료 후 ${inviteeName} 님은 예정대로 본국으로 귀국할 예정입니다.`
    ),
    para(
      `이에 ${inviteeName} 님의 사증 발급을 긍정적으로 검토하여 주시기를 정중히 요청드립니다.`,
      { after: 200 }
    ),

    ...signatureBlock(d.inviter.full_name),
  ];
  return pack(children);
}

// --- 2. 초청 사유서 --------------------------------------------------------
// The applicant's own words carry this document, so when they wrote something
// it is used as the body. Without it we state only what we actually know from
// the form — no invented travel history or family circumstances.
export async function generateInvitationReason(d: InviteDocData): Promise<Buffer> {
  const inviteeName = fullName(d.invitee);
  const children: (Paragraph | Table)[] = [
    title("초 청 사 유 서"),

    para(`수신: ${d.destination_mission}`, { bold: true }),
    para(`초청인: ${d.inviter.full_name}`),
    para(`피초청인: ${inviteeName}`, { after: 240 }),

    para(
      `저는 현재 대한민국에서 ${statusCode(d.inviter.korean_visa_status)} 자격으로 체류하고 있는 ${d.inviter.full_name}입니다.`
    ),
    para(
      `저는 저의 ${relationshipKo(d.invitee.relationship)}인 ${inviteeName} 님을 ${d.invitation_start_date}부터 ${d.invitation_end_date}까지 대한민국으로 초청하고자 합니다.`,
      { after: 200 }
    ),
  ];

  if (d.invitation_reason.trim()) {
    children.push(sectionHeading("초청 사유"));
    // Keep the applicant's paragraphing rather than collapsing it.
    d.invitation_reason
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => children.push(para(line, { after: 120 })));
  }

  children.push(
    sectionHeading("보증 사항"),
    para(
      `저 ${d.inviter.full_name}는 ${inviteeName} 님의 대한민국 체류를 보증합니다.`
    ),
    para("피초청인은 체류 기간 동안 대한민국의 모든 법령을 준수할 것입니다."),
    para("또한 허가된 체류기간 만료 전 반드시 본국으로 귀국할 것임을 확인합니다."),
    para("초청인으로서 체류 중 필요한 지원과 도움을 제공하겠습니다."),
    para("필요한 경우 관계 기관에 성실히 협조할 것을 약속드립니다.", { after: 200 }),
    para("사증 발급을 긍정적으로 검토하여 주시기를 정중히 요청드립니다."),
    para("감사합니다.", { after: 200 }),
    ...signatureBlock(d.inviter.full_name)
  );

  return pack(children);
}

// --- 3. 신원보증서 (별지 제129호서식) --------------------------------------
export async function generateGuaranteeLetter(d: InviteDocData): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    para("■ 출입국관리법 시행규칙 [별지 제129호서식]", { size: 16, after: 120 }),
    title("신 원 보 증 서"),
    para("※ [  ]에는 해당하는 곳에 √ 표시를 합니다.", { size: 16, after: 160 }),

    sectionHeading("피보증 외국인"),
    fieldTable(inviteeRows(d)),

    sectionHeading("신원보증인 — 가. 인적사항"),
    fieldTable(inviterRows(d)),

    sectionHeading("나. 보증기간"),
    para(`${d.guarantee_months}개월 (초청 기간 ${d.invitation_start_date} ~ ${d.invitation_end_date} 포함)`),

    sectionHeading("다. 보증내용"),
    para("(1) 체류 중 제반 법규를 준수하도록 한다."),
    para("(2) 출국여비 및 이와 관련된 비용에 대한 지불책임을 부담한다."),
    para("(3) 체류 또는 보호 중 발생되는 비용에 대한 지불책임을 부담한다.", { after: 200 }),

    para(
      "위 신원보증인은 피보증 외국인이 대한민국에 체류함에 있어서 그 신원에 이상이 없음을 확인하고 위 사항을 보증합니다.",
      { after: 160 }
    ),

    ...signatureBlock(d.inviter.full_name),
  ];
  return pack(children);
}
