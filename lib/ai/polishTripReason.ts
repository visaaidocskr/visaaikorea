// Translates + polishes the client's own "why did you choose this
// destination?" answer (collected free-text, 0-150 words, any language) into
// natural, professional English for the generated Travel Purpose Statement.
// Server-only.
//
// Degrades gracefully, same pattern as lib/email/send.ts: with no
// ANTHROPIC_API_KEY, or on any API error, this is skipped and the caller
// falls back to the applicant's original text — document generation must
// never fail because of this step.
//
// Never fabricates: the model is instructed to only translate/clean up
// grammar and phrasing, not add facts, invent details, or change the
// applicant's meaning or intent.
import "server-only";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You help prepare short personal statements for tourist visa applications. You will be given a short answer, in the applicant's own words, to the question "why did you choose to visit this country?"

Rules:
1. If the text is not already in English, translate it into natural, professional English.
2. Fix grammar, spelling, and awkward phrasing so it reads clearly and professionally.
3. Never add facts, invent details, or change the applicant's meaning or intent. Only translate and polish what they actually wrote.
4. Keep it roughly the same length — do not pad it out or cut it down significantly.
5. Write in first person, matching the applicant's original voice.
6. Output ONLY the final polished English text. No preamble, no quotation marks, no explanation, no markdown.`;

export async function polishTripReason(
  rawText: string,
  destinationCountry: string
): Promise<string | null> {
  const text = rawText.trim();
  if (!text) return null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

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
        max_tokens: 500,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Destination country: ${destinationCountry || "the destination"}\n\nApplicant's answer:\n${text}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const polished = data.content
      ?.filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("")
      .trim();

    return polished || null;
  } catch {
    // Network/API failure — fall back to the applicant's original text.
    return null;
  }
}
