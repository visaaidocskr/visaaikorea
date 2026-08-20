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

// `overDark` renders the bar transparent with light text while it sits on the
// night hero; once the visitor scrolls it becomes the usual white bar.
export function Nav({ overDark = false }: { overDark?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Shown only when the signed-in visitor's profile carries the admin role.
  // The check never hardcodes an identity into the shipped bundle: the
  // browser asks Supabase for its own profile row (RLS returns only your
  // own), so anonymous visitors and ordinary clients never see the link.
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) return;
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (!cancelled && data?.role === "admin") setIsAdmin(true);
      } catch {
        // Signed out or Supabase unreachable: simply no admin link.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = overDark && !scrolled && !open;
  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200 bg-white/95 shadow-sm"
          : dark
            ? "bg-transparent"
            : "bg-white"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm text-white shadow-md shadow-blue-500/30">
            V
          </span>
          <span className={dark ? "text-white" : "text-slate-900"}>
            VisaAI <span className={dark ? "text-cyan-300" : "text-blue-700"}>Korea</span>
          </span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t(l.labelKey)}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {isAdmin && (
            <Link
              href="/admin"
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                dark ? "text-amber-300 hover:text-amber-200" : "text-amber-600 hover:text-amber-700"
              }`}
            >
              ⚙ {t("nav.admin")}
            </Link>
          )}
          <Link
            href="/login"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              dark ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-blue-700"
            }`}
          >
            {t("nav.signIn")}
          </Link>
          <Link
            href="/signup"
            className="btn-glow rounded-xl px-4 py-2 text-sm font-semibold text-white"
          >
            {t("nav.signUp")}
          </Link>
          <LanguageSelector />
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t("nav.menu")}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden ${
            dark ? "border-white/25 text-white" : "border-slate-200 text-slate-700"
          }`}
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div className="animate-fade-in border-t border-slate-200 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {t(l.labelKey)}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50"
              >
                ⚙ {t("nav.admin")}
              </Link>
            )}
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
