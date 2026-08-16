// Dev-only smoke test for the C-3-1 invitation documents.
//
// Run with `npx tsx scripts/_tmp_test_invite_docs.ts` after temporarily
// stubbing the `server-only` package. Writes to /tmp/invite_test.
//
// The three `body_*` fields here stand in for what lib/ai/koreanLetter.ts
// returns — this exercises the document layout. To test the translation step
// itself, run it against a real ANTHROPIC_API_KEY from a machine that can
// reach api.anthropic.com.
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
  submission_date: "2026-08-24",
  invitation_start_date: "2026-09-23",
  invitation_end_date: "2026-10-07",
  guarantee_months: 3,
  destination_mission: "주우즈베키스탄 대한민국 대사관",
  body_invitation:
    "저는 저의 어머니인 JURAEVA NASIBA KHUROZOVNA 님을 단기 가족 방문 목적으로 대한민국에 초청하고자 합니다.\n저는 대한민국에서 학업을 이어가고 있으며, 이번 방문을 통해 어머니와 함께 시간을 보내고 한국의 문화와 생활환경을 소개해 드리고자 합니다.",
  body_statement:
    "어머니께서는 우즈베키스탄 사마르칸트에 거주하고 계시며, 그곳에 가족과 생활 기반을 두고 계십니다.\n어머니께서는 여러 국가를 방문하신 경험이 있으며, 방문한 모든 국가의 출입국 규정을 준수하고 예정대로 귀국하셨습니다.\n현재 우즈베키스탄에서 사업을 운영하고 계시어 지속적인 관리가 필요하므로, 이번 방문 종료 후 반드시 귀국하실 예정입니다.",
  body_guarantee:
    "본인은 피초청인의 대한민국 체류 기간 중 숙소와 생활비를 부담하겠습니다.\n또한 피초청인이 허가된 체류기간 내에 출국할 수 있도록 책임지고 조치하겠습니다.",
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
