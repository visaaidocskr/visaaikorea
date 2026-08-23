"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BUSINESS } from "@/lib/business";
import { useLocale } from "@/app/components/LocaleProvider";

// One tap to a human: WhatsApp, Telegram or email, from any public page.
// Hidden inside the application wizard and the admin area, where a chat
// bubble would only cover the form, and on the auth pages, which have their
// own scene.
const HIDDEN_PREFIXES = ["/apply", "/admin", "/login", "/signup", "/forgot-password", "/auth", "/print"];

const CHANNELS = [
  {
    key: "whatsapp",
    labelKey: "contact.whatsapp",
    href: BUSINESS.whatsapp,
    cls: "bg-emerald-500 hover:bg-emerald-600",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  },
  {
    key: "telegram",
    labelKey: "contact.telegram",
    href: BUSINESS.telegram,
    cls: "bg-sky-500 hover:bg-sky-600",
    path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  },
  {
    key: "email",
    labelKey: "contact.email",
    href: `mailto:${BUSINESS.email}`,
    cls: "bg-slate-700 hover:bg-slate-800",
    path: "M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1.5 2.4v.6l8.5 5.7 8.5-5.7v-.6L12 12.1 3.5 6.4zM3 9.2V18h18V9.2l-9 6-9-6z",
  },
] as const;

export function FloatingContact() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  // Escape closes the panel, like any other overlay.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          role="dialog"
          aria-label={t("contact.title")}
          className="animate-scale-in w-72 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20"
        >
          <p className="text-base font-bold text-slate-900">{t("contact.title")}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{t("contact.body")}</p>
          <div className="mt-4 space-y-2">
            {CHANNELS.map((c) => (
              <a
                key={c.key}
                href={c.href}
                target={c.key === "email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors ${c.cls}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" fill="currentColor" aria-hidden>
                  <path d={c.path} />
                </svg>
                {t(c.labelKey)}
                <span aria-hidden className="ml-auto opacity-80">→</span>
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("contact.close") : t("contact.open")}
        className={`btn-glow flex h-14 items-center gap-2 rounded-full px-4 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-transform hover:-translate-y-0.5 ${open ? "w-14 justify-center px-0" : ""}`}
      >
        {open ? (
          <span aria-hidden className="text-xl leading-none">✕</span>
        ) : (
          <>
            <span aria-hidden className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="hidden sm:inline">{t("contact.open")}</span>
            <span aria-hidden className="text-lg sm:hidden">💬</span>
          </>
        )}
      </button>
    </div>
  );
}
