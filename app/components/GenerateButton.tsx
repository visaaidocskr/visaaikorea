"use client";

import Link from "next/link";
import { useLocale } from "@/app/components/LocaleProvider";

// The primary conversion action across the whole site.
export function GenerateButton({
  size = "md",
  full = false,
  label,
  href = "/apply",
  className = "",
}: {
  size?: "md" | "lg";
  full?: boolean;
  label?: string;
  href?: string;
  className?: string;
}) {
  const { t } = useLocale();
  const sizing = size === "lg" ? "px-8 py-4 text-lg" : "px-6 py-3 text-base";
  return (
    <Link
      href={href}
      className={`btn-glow group inline-flex items-center justify-center gap-2.5 rounded-2xl font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${sizing} ${
        full ? "w-full" : ""
      } ${className}`}
    >
      <span aria-hidden className="sparkle text-cyan-200">✦</span>
      {label ?? t("action.generate")}
      <span className="transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
