"use client";

import { Reveal } from "@/app/components/Reveal";
import { useLocale } from "@/app/components/LocaleProvider";

// "What do I actually get?" is the question a visitor cannot answer before
// signing up. These are stylised pages — bars, not fake text — so nothing
// here can be mistaken for a real document, while the shape of the package
// (three documents, reviewed, stamped) is honest.
type DocSpec = {
  nameKey: string;
  bodyKey: string;
  icon: string;
  accent: string;
  // Widths of the body lines, as a rough silhouette of the real document.
  lines: number[];
  numbered?: boolean;
  tilt: string;
};

const DOCS: DocSpec[] = [
  {
    nameKey: "sample.doc1",
    bodyKey: "sample.doc1Body",
    icon: "✍️",
    accent: "from-blue-600 to-indigo-600",
    lines: [92, 100, 96, 88, 100, 72, 0, 100, 94, 86, 60],
    tilt: "lg:-rotate-2",
  },
  {
    nameKey: "sample.doc2",
    bodyKey: "sample.doc2Body",
    icon: "🗺️",
    accent: "from-cyan-500 to-blue-600",
    lines: [70, 40, 90, 40, 84, 40, 92, 40, 78],
    numbered: true,
    tilt: "lg:translate-y-3",
  },
  {
    nameKey: "sample.doc3",
    bodyKey: "sample.doc3Body",
    icon: "✅",
    accent: "from-emerald-500 to-teal-600",
    lines: [76, 64, 82, 58, 70, 88, 62, 74],
    numbered: true,
    tilt: "lg:rotate-2",
  },
];

function DocumentMock({ doc, stamp }: { doc: DocSpec; stamp: string }) {
  return (
    <div
      aria-hidden
      className={`card-lift relative mx-auto aspect-[1/1.28] w-full max-w-[17rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] ${doc.tilt}`}
    >
      {/* Letterhead */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${doc.accent} text-[9px] font-extrabold text-white`}>V</span>
          <span className="text-[9px] font-bold tracking-wide text-slate-700">VisaAI Korea</span>
        </div>
        <div className="h-1.5 w-12 rounded bg-slate-200" />
      </div>
      {/* Title */}
      <div className="mt-5 h-2.5 w-3/4 rounded bg-slate-800/80" />
      <div className="mt-2 h-1.5 w-1/3 rounded bg-slate-300" />
      {/* Body */}
      <div className="mt-5 space-y-2">
        {doc.lines.map((w, i) =>
          w === 0 ? (
            <div key={i} className="h-2" />
          ) : (
            <div key={i} className="flex items-center gap-2">
              {doc.numbered && i % 2 === 0 && (
                <span className={`h-2 w-2 flex-none rounded-full bg-gradient-to-br ${doc.accent}`} />
              )}
              <div
                className={`h-1.5 rounded ${i % 2 === 0 && doc.numbered ? "bg-slate-300" : "bg-slate-200"}`}
                style={{ width: `${w}%` }}
              />
            </div>
          )
        )}
      </div>
      {/* Signature line */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
        <div>
          <div className="h-px w-20 bg-slate-300" />
          <div className="mt-1.5 h-1.5 w-14 rounded bg-slate-200" />
        </div>
        {/* Review stamp */}
        <div className="-rotate-6 whitespace-nowrap rounded-md border-2 border-emerald-500/70 px-2 py-1 text-[7px] font-extrabold uppercase tracking-wider text-emerald-600">
          ✓ {stamp}
        </div>
      </div>
    </div>
  );
}

export function SampleSection() {
  const { t } = useLocale();
  return (
    <section id="package" className="relative overflow-hidden px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            <span aria-hidden className="sparkle text-cyan-500">✦</span>
            {t("sample.eyebrow")}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t("sample.title")}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{t("sample.description")}</p>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-8">
          {DOCS.map((doc, i) => (
            <Reveal key={doc.nameKey} delay={i * 120}>
              <div className="flex flex-col items-center text-center">
                <DocumentMock doc={doc} stamp={t("sample.stamp")} />
                <div className="mt-8 flex items-center gap-2">
                  <span aria-hidden className="text-xl">{doc.icon}</span>
                  <h3 className="text-lg font-bold text-slate-900">{t(doc.nameKey)}</h3>
                </div>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{t(doc.bodyKey)}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mx-auto mt-14 max-w-3xl text-center">
          <p className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-3 text-sm leading-relaxed text-blue-800">
            {t("sample.more")}
          </p>
          <p className="mt-4 text-xs text-slate-400">{t("sample.note")}</p>
        </Reveal>
      </div>
    </section>
  );
}
