// Maps InviteDocData onto the flat {{placeholder}} set baked into
// public/templates/invite/guarantee_invitation.docx. Server-only.
//
// The template came from a real, mission-accepted document — every tag name
// here corresponds to exactly one field position inside it. Keep this file
// and the template in sync: renaming a tag on one side without the other
// silently leaves that field blank.
import "server-only";
import type { InviteDocData } from "@/lib/docs/inviteDocs";

// The wizard stores status as its English label ("D-2 Student"); the form
// only wants the code.
function statusCode(status: string): string {
  return (status ?? "").trim().split(" ")[0];
}

function sexMarks(sex: string): { m: string; f: string } {
  return { m: sex === "male" ? "√" : " ", f: sex === "female" ? "√" : " " };
}

// "2026-08-17" -> "2026.08.17", matching the sample's date style. Leaves
// anything that isn't a plain ISO date untouched rather than guessing.
function fmtDate(iso: string): string {
  const t = (iso ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t.replaceAll("-", ".") : t;
}

// Clients type the relationship in English because the form is in English.
// Used inside prose ("저의 어머니인 ...") — the inviter's-eye single word.
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

export function relationshipKo(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "가족";
  if (/[ㄱ-힣]/.test(t)) return t; // already written in Korean — use as-is
  return RELATIONSHIP_KO[t.toLowerCase()] ?? "가족";
}

// The official forms describe the relationship as a *pair* ("모자" =
// mother+son), not from one side — that needs both people's sex, which the
// single-word map above doesn't use. Falls back to a neutral label instead
// of guessing when the combination isn't mapped.
function relationshipPairKo(
  relationship: string,
  inviterSex: string,
  inviteeSex: string
): string {
  const r = (relationship ?? "").trim().toLowerCase();

  const parentChildPair = (invitee_is_parent: boolean) => {
    const parentSex = invitee_is_parent ? inviteeSex : inviterSex;
    const childSex = invitee_is_parent ? inviterSex : inviteeSex;
    const parent = parentSex === "female" ? "모" : "부";
    const child = childSex === "female" ? "녀" : "자";
    return parent + child;
  };

  if (["mother", "father", "parent", "parents"].includes(r)) {
    return parentChildPair(true);
  }
  if (["son", "daughter", "child"].includes(r)) {
    return parentChildPair(false);
  }
  if (["wife", "husband", "spouse"].includes(r)) return "부부";
  if (["brother", "sister", "sibling"].includes(r)) {
    if (inviterSex === "male" && inviteeSex === "male") return "형제";
    if (inviterSex === "female" && inviteeSex === "female") return "자매";
    return "남매";
  }
  if (["grandmother", "grandfather", "grandparent"].includes(r)) return "조손";
  if (["aunt", "uncle"].includes(r)) return "숙질";
  if (/[ㄱ-힣]/.test(relationship ?? "")) return relationship; // written by hand in Korean
  return "가족관계";
}

function fullName(surname: string, givenName: string, middleName: string): string {
  return [surname, givenName, middleName].filter(Boolean).join(" ");
}

// Same brief the old standalone 초청장 used: who's inviting whom, the
// relationship, and that the visitor will return — used when the client's
// own text didn't translate (no API key, or they left it blank).
function fallbackInvitationBody(d: InviteDocData): string {
  const inviteeName = fullName(
    d.invitee.surname,
    d.invitee.given_name,
    d.invitee.middle_name
  );
  const rel = relationshipKo(d.invitee.relationship);
  return [
    `저는 저의 ${rel}인 ${inviteeName} 님을 단기 가족 방문 목적으로 대한민국에 초청하고자 합니다.`,
    `방문 종료 후 ${inviteeName} 님은 예정대로 본국으로 귀국할 예정입니다.`,
  ].join("\n");
}

export function buildInviteTemplateData(d: InviteDocData): Record<string, string> {
  const inviterSexM = sexMarks(d.inviter.sex);
  const inviteeSexM = sexMarks(d.invitee.sex);

  return {
    invitee_surname: d.invitee.surname,
    invitee_given_name: d.invitee.given_name,
    invitee_middle_name: d.invitee.middle_name,
    invitee_full_name: fullName(
      d.invitee.surname,
      d.invitee.given_name,
      d.invitee.middle_name
    ),
    invitee_dob: d.invitee.date_of_birth,
    invitee_sex_m: inviteeSexM.m,
    invitee_sex_f: inviteeSexM.f,
    invitee_nationality: d.invitee.nationality,
    invitee_passport: d.invitee.passport_number,
    invitee_address: d.invitee.address_home,
    invitee_phone: d.invitee.phone_home,

    inviter_full_name: d.inviter.full_name,
    inviter_nationality: d.inviter.nationality,
    inviter_sex_m: inviterSexM.m,
    inviter_sex_f: inviterSexM.f,
    // The sample this template came from always used the guarantor's DOB
    // here, not their passport number — that's the convention for this
    // field on 신원보증서/초청장. Passport number is only a fallback if DOB
    // is somehow missing.
    inviter_passport_or_dob: d.inviter.date_of_birth || d.inviter.passport_number,
    inviter_phone: d.inviter.phone,
    inviter_address: d.inviter.address_korea,
    inviter_org: d.inviter.org_name,
    inviter_position: d.inviter.position,
    inviter_org_address: d.inviter.org_address,
    inviter_status_code: statusCode(d.inviter.korean_visa_status),

    relationship_pair: relationshipPairKo(
      d.invitee.relationship,
      d.inviter.sex,
      d.invitee.sex
    ),
    guarantee_months: String(d.guarantee_months ?? 3),
    invite_start: fmtDate(d.invitation_start_date),
    invite_end: fmtDate(d.invitation_end_date),
    destination_mission: d.destination_mission,

    body_invitation: d.body_invitation?.trim() || fallbackInvitationBody(d),
    body_statement: d.body_statement ?? "",
    body_guarantee: d.body_guarantee ?? "",
  };
}
