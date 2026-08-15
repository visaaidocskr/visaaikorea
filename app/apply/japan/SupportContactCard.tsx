"use client";

// Shown when an applicant hasn't booked a flight/hotel yet. We never fabricate
// booking details — instead we offer real support contacts. Reused by the
// Flight and Accommodation steps.
export function SupportContactCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const btn =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h4 className="font-bold text-amber-900">{title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-amber-800">{message}</p>
      <p className="mt-3 text-sm font-semibold text-amber-900">Admin: Ibrokhim</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href="https://t.me/superDiscussion"
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-600`}
        >
          Contact Ibrokhim on Telegram
        </a>
        <a
          href="https://wa.me/821033964499"
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600`}
        >
          Chat on WhatsApp
        </a>
        <a
          href="tel:+821033964499"
          className={`${btn} border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 focus-visible:outline-amber-500`}
        >
          Call +82 10 3396 4499
        </a>
      </div>
    </div>
  );
}
