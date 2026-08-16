// Dev-only smoke test for the C-3-1 invitation documents.
// Run with `npx tsx scripts/_tmp_test_invite_docs.ts` after temporarily
// stubbing the `server-only` package. Writes to /tmp/invite_test.
import fs from "node:fs";
import path from "node:path";
import {
  generateInvitationLetter,
  generateInvitationReason,
  generateGuaranteeLetter,
  type InviteDocData,
} from "../lib/docs/inviteDocs";

const data: InviteDocData = {
  inviter: {
    full_name: "ARTIKOV IBROKHIM DAMIN UGLI",
    nationality: "UZBEKISTAN",
    sex: "male",
    date_of_birth: "2000-02-04",
    passport_number: "",
    phone: "82 10 3396 4499",
    address_korea: "충청북도 청주시 서원구 신화로36번길 33 105호",
    korean_visa_status: "D-2 Student",
    org_name: "서원대학교",
    position: "학생",
    org_address: "충청북도 청주시 서원구 무심서로 377-3 서원대학교",
  },
  invitee: {
    surname: "JURAEVA",
    given_name: "NASIBA",
    middle_name: "KHUROZOVNA",
    date_of_birth: "1970-04-15",
    sex: "female",
    nationality: "UZBEKISTAN",
    passport_number: "FB1780279",
    address_home: "Samarkand, Jomboy city, Tashkent MFY, Yoshlik-4",
    phone_home: "+998-93-236-2277",
    relationship: "mother",
  },
  invitation_start_date: "2026-09-03",
  invitation_end_date: "2026-09-17",
  guarantee_months: 3,
  destination_mission: "주우즈베키스탄 대한민국 대사관",
  invitation_reason:
    "어머니께서는 국제 여행과 문화 교류에 관심이 많으시며, 여러 국가를 방문한 경험이 있습니다.\n어머니는 우즈베키스탄에 가족과 사업 기반을 두고 계시며, 방문 종료 후 반드시 귀국하실 예정입니다.",
};

async function run() {
  const out = "/tmp/invite_test";
  fs.mkdirSync(out, { recursive: true });

  const files: [string, Buffer][] = [
    ["1_invitation_letter.docx", await generateInvitationLetter(data)],
    ["2_invitation_reason.docx", await generateInvitationReason(data)],
    ["3_guarantee_letter.docx", await generateGuaranteeLetter(data)],
  ];
  for (const [name, buf] of files) {
    fs.writeFileSync(path.join(out, name), buf);
    console.log(name, buf.length);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
