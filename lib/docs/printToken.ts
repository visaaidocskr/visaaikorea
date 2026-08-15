// Short-lived signed token so the server can render a protected print route
// inside a headless browser without forwarding the user's Supabase session.
// Server-only (uses the service-role key as the signing secret).
import "server-only";
import crypto from "node:crypto";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function secret(): string {
  const key = process.env.PDF_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("PDF signing secret is not configured.");
  return key;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Create a token authorizing the print render of one application. */
export function createPrintToken(applicationId: string): string {
  const payload = `${applicationId}.${Date.now() + TTL_MS}`;
  return `${b64url(payload)}.${sign(payload)}`;
}

/** Verify a token for an application id. Returns true only if valid + unexpired. */
export function verifyPrintToken(applicationId: string, token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encPayload, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(encPayload, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const [id, expStr] = payload.split(".");
  const exp = Number(expStr);
  if (id !== applicationId || !Number.isFinite(exp) || Date.now() > exp) return false;

  return true;
}
