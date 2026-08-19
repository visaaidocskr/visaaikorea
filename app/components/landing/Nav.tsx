"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GenerateButton } from "@/app/components/GenerateButton";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { useLocale } from "@/app/components/LocaleProvider";

// Only the sections that actually exist on the page — the Services and
// Pricing sections were removed, so their anchors went with them.
const LINKS = [
  { href: "/services", labelKey: "nav.services" }, { href: "/flights", labelKey: "nav.flights" }, { href: "/tours", labelKey: "nav.tours" }, { href: "/#countries", labelKey: "nav.destinations" }, { href: "/#invite", labelKey: "nav.invite" }, { href: "/#how", labelKey: "nav.how" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "border-b border-slate-200 bg-white shadow-sm" : "bg-white"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-700 text-sm text-white">
            V
          </span>
          <span className="text-slate-900">
            VisaAI <span className="text-blue-700">Korea</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {t(l.labelKey)}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-blue-700"
          >
            {t("nav.signIn")}
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            {t("nav.signUp")}
          </Link>
          <LanguageSelector />
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t("nav.menu")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div className="animate-fade-in border-t border-slate-200 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {t(l.labelKey)}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {t("nav.signIn")}
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-blue-700 px-2 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800"
            >
              {t("nav.signUp")}
            </Link>
            <LanguageSelector />
            <GenerateButton full size="md" />
          </div>
        </div>
      )}
    </header>
  );
}
