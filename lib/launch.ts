// Launch switches. The document-generation flows are fully built but final
// submission stays closed until the bank finishes reviewing the payment
// system — clients can fill in and save everything, and the last button
// explains instead of submitting. Flip to true on launch day; the server
// actions check the same flag, so a hand-built request cannot slip past
// the closed door either.
export const VISA_SUBMISSIONS_OPEN = false;
export const INVITE_SUBMISSIONS_OPEN = false;
