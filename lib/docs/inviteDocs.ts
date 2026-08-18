// Korea-side invitation paperwork for a C-3-1 short-term family visit.
// Server-only.
//
// One combined document per invited person, filled from an admin-provided
// real-world sample (public/templates/invite/guarantee_invitation.docx) via
// docxtemplater — not hand-built with the docx library. The template *is*
// what a mission actually accepted: same layout, same fixed legal clauses,
// same two official forms (신원보증서 별지 제129호서식 + 초청장) in one file.
// Only person-specific data is substituted; nothing about the form itself
// changes here. See lib/docs/inviteTemplateData.ts for the field mapping.
//
// Everything is written in Korean because that is the language the mission
// reads. Blank fields stay blank — nothing here is invented to fill a gap.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { buildInviteTemplateData } from "@/lib/docs/inviteTemplateData";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "templates",
  "invite",
  "guarantee_invitation.docx"
);

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
  submission_date: string;
  // One body per theme, already translated into formal Korean by
  // lib/ai/koreanLetter.ts. Empty when the client left it blank or the API
  // was unavailable — in which case the template just renders that line
  // blank rather than printing untranslated text at the embassy.
  body_invitation: string;
  body_statement: string;
  body_guarantee: string;
};

/**
 * Fills the single combined template (신원보증서 + 초청장, one file) with
 * this person's data and returns the finished .docx.
 */
export async function generateInvitationPackage(
  d: InviteDocData
): Promise<Buffer> {
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  doc.render(buildInviteTemplateData(d));

  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
