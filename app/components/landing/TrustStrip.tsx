"use client";

import { useLocale } from "@/app/components/LocaleProvider";

// Compact, truthful trust signals directly under the hero. No invented
// numbers — each line states something the product actually does.
const ITEMS = [
  { icon: "🛡️", titleKey: "trust.review", bodyKey: "trust.reviewBody" },
  { icon: "🇰🇷", titleKey: "trust.korea", bodyKey: "trust.koreaBody" },
  { icon: "🏷️", titleKey: "trust.pricing", bodyKey: "trust.pricingBody" },
  { icon: "💬", titleKey: "trust.lang", bodyKey: "trust.langBody" },
] as const;

export function TrustStrip() {
  const { t } = useLocale();
  return (
    <section aria-label={t("trust.review")} className="border-b border-slate-200/70 bg-white px-6 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.titleKey} className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-slate-100 text-lg">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{t(item.titleKey)}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t(item.bodyKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
