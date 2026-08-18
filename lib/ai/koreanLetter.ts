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
  invitation: `This text goes into a 초청장 (invitation letter). It should read as a warm, courteous statement to the consular officer: who the inviter is, who they are inviting and how they are related, the purpose of the visit, and that the visitor will return home when it ends. Write it as a complete short paragraph, not a single clipped sentence — if the applicant gave you a reason for the visit, say what it is.`,

  statement: `This text goes into a 초청 사유서 (statement of reasons) — the most important of the three documents, the one that actually persuades. Build a complete case for why this visit is genuine and why the visitor will go home, organised into short paragraphs by theme: (1) prior international travel and a clean record of returning home, if they mentioned any; (2) their ties to their home country — family, work, property, an ongoing business, studies, anything that anchors them there; (3) what specifically they want to do or experience on this visit; (4) anything forward-looking that reinforces they will leave again (future travel, ongoing obligations, plans after the visit). Only include a theme the applicant actually gave you material for — do not add a paragraph with nothing in it. Within each theme, use every specific detail they gave (country names, the nature of their work or business, family circumstances) — do not compress a rich answer down to one generic line. A consular officer reads a thin, generic letter as a weak case, so organise and fully develop what you were given rather than summarising it away.`,

  guarantee: `This text goes into a 신원보증서 (guarantee). State plainly and completely what the inviter undertakes: covering costs during the stay (be specific if they told you who pays for what — e.g. flights, accommodation, living expenses, whether a third party such as another family member is contributing), ensuring the visitor complies with Korean law, and ensuring they leave before their permitted stay ends. Write in the register of a signed undertaking. If they gave you more than one specific commitment, give each its own sentence rather than collapsing them into one.`,
};

const SYSTEM_PROMPT = `You prepare Korean-language documents for family visit visa applications to the Republic of Korea (C-3-1 short-term visit). The inviter lives in Korea; their relative applies at a Korean mission abroad.

You are acting as an experienced visa consultant drafting on the client's behalf, not a literal translator. You will be given raw notes written by the inviter, in whatever language they chose and in whatever order they thought of things, and told which document it is for. Your job is to think about what actually makes a strong, credible case from those notes, then organise and write it properly — the same way a consultant would take a client's rambling explanation and turn it into a clear, complete, professional letter a consular officer will find convincing.

Rules, in order of importance:

1. NEVER add facts. Do not invent jobs, businesses, property, family members, travel history, income, dates, or reasons the applicant did not mention. Every specific in your output must trace back to something they wrote.
2. Never drop or flatten specifics they DID give you. Organising and elaborating means restructuring and fully spelling out what's there — grouping related points, making an implicit reason explicit, spelling out why a detail matters — not shortening it. If their notes are rich, your output should be too. If their notes are genuinely thin, write a shorter, honest letter rather than padding it with generic filler sentences that say nothing — a short specific letter is stronger than a longer vague one.
3. Translate into Korean, whatever language the input is in.
4. Write in the formal register these documents use: 합니다체, courteous, factual, addressed to a consular officer. Even if the applicant wrote casually, with mistakes, or as a list of fragments, the Korean must read as a properly composed letter.
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
