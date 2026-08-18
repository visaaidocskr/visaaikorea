// Plain, inline-styled HTML email bodies. Kept dependency-free.

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="font-size:20px;font-weight:800;color:#1d4ed8;margin-bottom:16px">VisaAI Korea</div>
    <div style="background:#fff;border-radius:18px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.08)">
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:11px;color:#94a3b8;margin-top:18px;line-height:1.6">
      Vitamin VisaAI prepares documents based on information provided by the client.
      Visa approval is decided only by the embassy/consulate/immigration authority.
      This service does not guarantee visa approval.
    </p>
  </div></body></html>`;
}

const p = (text: string) =>
  `<p style="font-size:14px;line-height:1.7;color:#334155;margin:0 0 12px">${text}</p>`;

export function submissionConfirmation(opts: {
  name: string;
  destination: string;
}) {
  // Vietnam is an e-Visa, not a document-preparation service: there is no
  // package to assemble and no flight/hotel reservation to send on, so the
  // standard wording would promise the wrong thing.
  const isVietnam = opts.destination === "Vietnam";
  const body = isVietnam
    ? p(`Hello ${opts.name || "there"},`) +
      p(
        `Your Vietnam e-Visa application has been received. It will be submitted to the <strong>Vietnam Immigration Department</strong> through its official e-Visa portal.`
      ) +
      p(
        `The Immigration Department decides the outcome, normally within <strong>3–4 business days</strong>. Saturdays and Sundays are not counted.`
      ) +
      p(`Once approved, your e-Visa will be sent to this email address as a PDF.`) +
      p(`You can track your application status in your dashboard at any time.`)
    : p(`Hello ${opts.name || "there"},`) +
      p(
        `We have received your tourist visa document request for <strong>${opts.destination}</strong>. Our team will review your information and prepare your document package.`
      ) +
      p(
        `Your air ticket reservation and hotel booking reservation may be sent to your email within 16 hours after admin review.`
      ) +
      p(`You can track your application status in your dashboard at any time.`);

  return {
    subject: isVietnam
      ? "We received your Vietnam e-Visa application"
      : "We received your visa document request",
    html: shell("Application received", body),
  };
}

export function adminNotification(opts: {
  applicantName: string;
  destination: string;
  email: string;
  applicationId: string;
}) {
  return {
    subject: `New application: ${opts.applicantName || opts.email} → ${opts.destination}`,
    html: shell(
      "New application submitted",
      p(`A new application has been submitted.`) +
        p(
          `<strong>Applicant:</strong> ${opts.applicantName || "—"}<br/>` +
            `<strong>Email:</strong> ${opts.email}<br/>` +
            `<strong>Destination:</strong> ${opts.destination}<br/>` +
            `<strong>ID:</strong> ${opts.applicationId}`
        )
    ),
  };
}

// A message written by the team to the applicant — most often "this document
// is missing / unreadable, please re-upload it". The message itself is shown
// verbatim, since it's specific to their case; the surrounding text just
// tells them where to act on it.
export function clientMessage(opts: {
  name: string;
  destination: string;
  message: string;
  needsAction: boolean;
}) {
  return {
    subject: opts.needsAction
      ? `Action needed on your ${opts.destination} application`
      : `An update on your ${opts.destination} application`,
    html: shell(
      opts.needsAction ? "Action needed" : "Update on your application",
      p(`Hello ${opts.name || "there"},`) +
        p(`Regarding your <strong>${opts.destination}</strong> application:`) +
        `<div style="border-left:3px solid #1d4ed8;background:#f8fafc;padding:12px 16px;margin:0 0 12px;font-size:14px;line-height:1.7;color:#0f172a;white-space:pre-wrap">${escapeHtml(
          opts.message
        )}</div>` +
        (opts.needsAction
          ? p(
              `Please sign in to your dashboard, open this application and use <strong>Edit application</strong> to upload the corrected document.`
            )
          : p(`You can see the full details in your dashboard at any time.`))
    ),
  };
}

// The message is admin-written free text going into an HTML email — escape it
// so a stray "<" can't break the layout or inject markup.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// The visa itself came through. Deliberately does NOT congratulate on behalf
// of the authority or restate conditions we can't verify — it says what
// arrived and what to do with it.
export function visaGranted(opts: {
  name: string;
  destination: string;
  attached: boolean;
}) {
  return {
    subject: `Your ${opts.destination} visa has been granted`,
    html: shell(
      "Your visa has been granted",
      p(`Hello ${opts.name || "there"},`) +
        p(
          `Good news — your visa for <strong>${opts.destination}</strong> has been granted.`
        ) +
        (opts.attached
          ? p(
              `A copy is attached to this email. It is also available in your dashboard at any time.`
            )
          : p(
              `Please sign in to your dashboard to download it — the file was too large to attach here.`
            )) +
        p(
          `Print a copy and carry it with you when you travel, together with the passport used in this application.`
        )
    ),
  };
}

export function documentsReady(opts: { name: string; count: number; attached: boolean }) {
  return {
    subject: "Your visa documents are ready",
    html: shell(
      "Your documents are ready",
      p(`Hello ${opts.name || "there"},`) +
        p(
          `${opts.count} document${opts.count === 1 ? "" : "s"} for your application ${
            opts.count === 1 ? "is" : "are"
          } now ready.`
        ) +
        (opts.attached
          ? p(`They are attached to this email — please review, print, and sign where needed.`)
          : p(
              `They're too large to attach here — please sign in to your dashboard to download your document package.`
            ))
    ),
  };
}
