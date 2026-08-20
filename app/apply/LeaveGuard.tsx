"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/components/Modal";
import { useLocale } from "@/app/components/LocaleProvider";

// Embassy-style exit guard for the application. Three doors are watched:
// the browser Back button (a duplicated history entry lets us ask first),
// tab close / refresh (the browser's own dialog), and the in-app
// "Back to dashboard" link (which raises visaai:leave-request instead of
// navigating). The message is honest: progress is autosaved as a draft —
// the question is only whether to leave before submitting.
export function LeaveGuard() {
  const router = useRouter();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const pendingHref = useRef<string | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    history.pushState(null, "", location.href);
    const onPop = () => {
      if (leaving.current) return;
      pendingHref.current = null;
      setOpen(true);
      // Re-arm: keep the visitor on this entry until they decide.
      history.pushState(null, "", location.href);
    };
    const onLeaveRequest = (e: Event) => {
      pendingHref.current = (e as CustomEvent<string>).detail ?? "/dashboard";
      setOpen(true);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("visaai:leave-request", onLeaveRequest);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("visaai:leave-request", onLeaveRequest);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  function stay() {
    setOpen(false);
  }
  function leave() {
    leaving.current = true;
    setOpen(false);
    router.push(pendingHref.current ?? "/dashboard");
  }

  return (
    <Modal open={open} onClose={stay}>
      <div className="p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-3xl">
          <span aria-hidden>⚠️</span>
        </div>
        <h3 className="mt-5 text-2xl font-extrabold text-slate-900">{t("leave.title")}</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          {t("leave.body")}
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={stay}
            className="btn-glow w-full rounded-2xl px-6 py-3.5 font-bold text-white"
          >
            {t("leave.stay")}
          </button>
          <button
            type="button"
            onClick={leave}
            className="w-full rounded-2xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            {t("leave.leave")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
