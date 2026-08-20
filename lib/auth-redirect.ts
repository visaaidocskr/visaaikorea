// Validates the `next` parameter used to send a user back where they came
// from after signing in. Pure + isomorphic so the login page, the server
// actions and the OAuth callback all apply the identical rule.
//
// Why this needs its own function: the obvious check — `next.startsWith("/")`
// — is not enough. A protocol-relative URL like "//evil.com" also starts with
// a slash, and browsers resolve it to https://evil.com. That turns the sign-in
// page into an open redirect: an attacker sends a link to the REAL site, the
// applicant signs in for real, and is then handed to a copy of the site that
// asks for passport details. Backslashes are rejected for the same reason —
// some browsers normalise "/\evil.com" the same way.

const DEFAULT_PATH = "/";

// Written as escapes rather than literal characters, so this file stays
// readable text rather than being treated as binary by grep and diffs.
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

export function safeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_PATH
): string {
  if (!next) return fallback;
  const value = next.trim();

  // Must be a path on this site, and must not be able to escape it.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/\\")) return fallback;
  // Control characters can be used to smuggle a second target past naive
  // parsers; a legitimate in-app path never contains them.
  if (CONTROL_CHARS.test(value)) return fallback;

  return value;
}
