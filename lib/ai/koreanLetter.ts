// Turns what the client wrote — in Uzbek, Russian, English or anything else,
// in whatever register they happen to write in — into the formal Korean that
// a consular officer expects to read. Server-only.
//
// Clients are not writing in their own language for fun: most of them cannot
// write Korean at all, and the ones who can are rarely writing in the
// official register these letters need. So this is not a nicety, it is what
// makes the documents usable.
//
// The hard rule is the same one that runs through the rest of this codebase:
// translate and raise the register, never add facts. If the client did not
// say they own a business, the letter does not say it. A consular officer
// who catches an invented detail will refuse the application, and it is the
// client who pays for that — not us.
//
// Degrades gracefully, like lib/email/send.ts: with no ANTHROPIC_API_KEY, or
// on any API failure, the caller falls back to the client's original text.
import "server-only";

const MODEL = "claude-sonnet-5";

export type LetterKind = "invitation" | "statement" | "guarantee";

// Each document argues something different, so each gets its own brief.
const BRIEFS: Record<LetterKind, string> = {
  invitation: `This text goes into a 초청장 (invitation letter). It should read as a short, courteous statement to the consular officer: who the inviter is, who they are inviting and how they are related, the purpose of the visit, and that the visitor will return home when it ends. Two to four sentences.`,

  statement: `This text goes into a 초청 사유서 (statement of reasons). This is the substantive letter: the visitor's circumstances, their ties to their home country (family, work, property, obligations), any relevant travel history, and why they will return. Keep the applicant's specifics and structure them into clear paragraphs. Do not pad it out.`,

  guarantee: `This text goes into a 신원보증서 (guarantee). It should state plainly what the inviter undertakes: covering costs during the stay, ensuring the visitor complies with Korean law, and ensuring they leave before their permitted stay ends. Two to four sentences, in the register of an undertaking.`,
};

const SYSTEM_PROMPT = `You prepare Korean-language documents for family visit visa applications to the Republic of Korea (C-3-1 short-term visit). The inviter lives in Korea; their relative applies at a Korean mission abroad.

You will be given text written by the inviter, in whatever language they chose, and told which document it is for.

Rules, in order of importance:

1. NEVER add facts. Do not invent jobs, businesses, property, family members, travel history, income, dates, or reasons. If the applicant did not write it, it does not appear. Where their text is thin, the Korean output is correspondingly short — that is correct and expected.
2. Translate into Korean, whatever language the input is in.
3. Write in the formal register these documents use: 합니다체, courteous, factual, addressed to a consular officer. Even if the applicant wrote casually or with mistakes, the Korean must read as properly written.
4. Keep their meaning and their specifics exactly. You are changing the language and the register, not the content.
5. Use the names, dates and relationships exactly as supplied in the context.
6. Output ONLY the finished Korean text. No preamble, no explanation, no quotation marks, no markdown, no romanisation.`;

export type LetterContext = {
  inviterName: string;
  inviterStatus: string;
  inviteeNames: string[];
  relationship: string;
  visitStart: string;
  visitEnd: string;
};

export async function writeKoreanLetter(
  rawText: string,
  kind: LetterKind,
  ctx: LetterContext
): Promise<string | null> {
  const text = rawText.trim();
  if (!text) return null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const context = [
    `Inviter: ${ctx.inviterName} (residing in Korea on ${ctx.inviterStatus || "a long-term status"})`,
    `Invited: ${ctx.inviteeNames.join(", ")}`,
    `Relationship to the inviter: ${ctx.relationship}`,
    `Visit: ${ctx.visitStart} to ${ctx.visitEnd}`,
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `${BRIEFS[kind]}\n\nContext (use these exact names and dates):\n${context}\n\nWhat the inviter wrote:\n${text}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const out = data.content
      ?.filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("")
      .trim();

    return out || null;
  } catch {
    return null;
  }
}
