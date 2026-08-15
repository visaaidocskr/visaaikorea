// Pure, isomorphic form helpers for the applicant step. Kept out of the React
// component so they can be reused (and unit-reasoned about) on client + server.

// Passport-style name formatting: UPPERCASE, Latin letters + space/'/- only,
// collapse repeated spaces, no leading space. Trailing space is preserved while
// typing so the user can start the next word; trim happens on save/blur.
export function formatName(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z\s'-]/g, "") // drop digits/punctuation/other scripts
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+/, "");
}

// Strong-but-sane email check. Rejects "a@", "a", "@b.com"; accepts a@b.co.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

// True if the string contains any Korean character (syllables or jamo).
// Used by the non-Japan flow to enforce that the Korea address is written as
// on the ARC.
const HANGUL_RE = /[가-힣㄰-㆏ᄀ-ᇿ]/;
export function containsHangul(value: string): boolean {
  return HANGUL_RE.test(value);
}

// True if the string contains any non-Latin *letter* script — Korean Hangul,
// Chinese/Japanese Han, Kana, Cyrillic, Arabic, Hebrew, Thai, etc. Latin
// letters (incl. accented), digits, spaces and address punctuation are all
// allowed. Shared by every address field so embassy forms are submitted in
// Romanized English.
const NON_LATIN_SCRIPT_RE =
  /[Ѐ-ԯ֐-׿؀-ݿ฀-๿ᄀ-ᇿ぀-ヿ㄰-㆏ㇰ-ㇿ㐀-䶿一-鿿ꥠ-꥿가-퟿豈-﫿＀-￯]/;
export function hasNonLatinScript(value: string): boolean {
  return NON_LATIN_SCRIPT_RE.test(value);
}

// A "reasonably complete" address: long enough and containing a street/building
// number OR multiple comma-separated parts. Rejects a bare city or district name
// (e.g. "Seoul" or "Gangnam-gu") while accepting a full ARC-style address.
export function isCompleteAddress(value: string): boolean {
  const v = value.trim();
  if (v.length < 10) return false;
  const hasNumber = /\d/.test(v);
  const commaParts = (v.match(/,/g) || []).length;
  return hasNumber || commaParts >= 2;
}

// Reusable address-language validation error (or undefined). Empty values are
// treated as valid — required-ness is enforced separately, so optional address
// fields only fail when they actually contain non-Latin characters.
export function addressLanguageError(
  value: string,
  message = "Please enter the address in English."
): string | undefined {
  return value.trim() !== "" && hasNonLatinScript(value) ? message : undefined;
}
