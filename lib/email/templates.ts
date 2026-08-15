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
  return {
    subject: "We received your visa document request",
    html: shell(
      "Application received",
      p(`Hello ${opts.name || "there"},`) +
        p(
          `We have received your tourist visa document request for <strong>${opts.destination}</strong>. Our team will review your information and prepare your document package.`
        ) +
        p(
          `Your air ticket reservation and hotel booking reservation may be sent to your email within 16 hours after admin review.`
        ) +
        p(`You can track your application status in your dashboard at any time.`)
    ),
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
