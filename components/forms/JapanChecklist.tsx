import type { JapanChecklistData } from "@/lib/docs/japanChecklist";

// Print-only A4 document checklist. Plain <style> so it is fully SSR-rendered
// and honored by Puppeteer's print pipeline (no styled-jsx runtime).
const PRINT_STYLES = `
.jp-chk-root { background:#9ca3af; }
.jp-chk-page {
  width: 210mm; min-height: 297mm; margin: 0 auto; padding: 16mm;
  background:#ffffff; color:#111827; box-sizing: border-box;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
}
@media screen { .jp-chk-page { box-shadow: 0 1px 8px rgba(0,0,0,.35); } }
@media print {
  .jp-chk-root { background:#ffffff; }
  @page { size: A4 portrait; margin: 0; }
  html, body { margin:0; padding:0; background:#fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .jp-chk-page { box-shadow:none; margin:0; }
}
`;

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section style={{ marginTop: "18px" }}>
      <h2
        style={{
          fontSize: "13px",
          fontWeight: 700,
          borderBottom: "2px solid #111827",
          paddingBottom: "4px",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none" }}>
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              padding: "7px 2px",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "11.5px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "13px",
                height: "13px",
                border: "1px solid #111827",
                borderRadius: "2px",
                flex: "0 0 auto",
                marginTop: "1px",
              }}
              aria-hidden
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function JapanChecklist({ data }: { data: JapanChecklistData }) {
  return (
    <div className="jp-chk-root">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      <div className="jp-chk-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              Japan Tourist Visa — Document Checklist
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#4b5563" }}>
              Applicant: {data.applicantName || "—"}
            </p>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              borderRadius: "999px",
              padding: "4px 10px",
              background: "#eef2ff",
              color: "#3730a3",
              whiteSpace: "nowrap",
            }}
          >
            {data.routeLabel}
          </span>
        </div>

        <ChecklistSection title="Prepared by Vitamin Visa" items={data.generated} />
        <ChecklistSection title="Documents you must provide" items={data.applicantProvided} />

        <p style={{ marginTop: "22px", fontSize: "9px", lineHeight: 1.5, color: "#6b7280" }}>
          Vitamin VisaAI prepares documents based on the information you provide. Visa approval is
          decided only by the embassy / consulate-general of Japan. This service does not guarantee
          visa approval.
        </p>
      </div>
    </div>
  );
}
