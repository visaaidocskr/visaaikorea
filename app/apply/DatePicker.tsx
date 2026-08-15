"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toISO } from "@/lib/visa/destinations";

// ---- date helpers (local, to keep this component self-contained) ----------
function parse(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function clamp(d: Date, min: Date | null, max: Date | null) {
  if (min && d < min) return min;
  if (max && d > max) return max;
  return d;
}
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pretty(iso: string): string {
  const d = parse(iso);
  if (!d) return "";
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  minISO?: string | null;
  maxISO?: string | null;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  // Fires when the picker is opened — used to trigger the guidance modal.
  onOpen?: () => void;
  // Show Year + Month dropdowns + manual YYYY-MM-DD entry in the popover.
  // Ideal for far-back dates like date of birth (avoids clicking ‹ many times).
  showYearMonth?: boolean;
  // Marks specific days unavailable with a reason (e.g. embassy weekends/
  // holidays). Blocked days can't be selected but stay clickable so the reason
  // is shown; `closure: true` renders the day in red.
  blockedDate?: (iso: string) => { message: string; closure?: boolean } | null;
};

// Accessible calendar-popover date field. Out-of-range days are clearly
// disabled; full keyboard support (arrows/Home/End/PageUp-Down/Enter/Esc).
export function DatePicker({
  label,
  value,
  onChange,
  minISO,
  maxISO,
  required = true,
  error,
  disabled = false,
  onOpen,
  showYearMonth = false,
  blockedDate,
}: Props) {
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const [blockMsg, setBlockMsg] = useState<string | null>(null);
  const min = minISO ? parse(minISO) : null;
  const max = maxISO ? parse(maxISO) : null;

  // Year range for the dropdown (recent-first). Defaults span 1900 → this year.
  const minYear = min ? min.getFullYear() : 1900;
  const maxYear = max ? max.getFullYear() : new Date().getFullYear();
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  // Manual "YYYY-MM-DD" text entry (only used in showYearMonth mode).
  const [typed, setTyped] = useState(value);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Date>(() =>
    clamp(parse(value) ?? new Date(), min, max)
  );
  const [view, setView] = useState<Date>(() => startOfMonth(active));

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Keep focus on the active day while the grid is open.
  useEffect(() => {
    if (!open) return;
    const el = rootRef.current?.querySelector<HTMLButtonElement>(
      `[data-iso="${toISO(active)}"]`
    );
    el?.focus();
  }, [active, view, open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function openPicker() {
    if (disabled) return;
    const start = clamp(parse(value) ?? new Date(), min, max);
    setActive(start);
    setView(startOfMonth(start));
    setTyped(value);
    setBlockMsg(null);
    setOpen(true);
    onOpen?.();
  }
  function close(focusTrigger = true) {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }
  function isDisabled(d: Date) {
    return (min && d < min) || (max && d > max);
  }
  function select(d: Date) {
    if (isDisabled(d)) return;
    const blk = blockedDate?.(toISO(d));
    if (blk) {
      setBlockMsg(blk.message);
      return;
    }
    setBlockMsg(null);
    onChange(toISO(d));
    close();
  }
  // Live-commit a manually typed date once it's a complete, in-range YYYY-MM-DD.
  function onTypedChange(str: string) {
    setTyped(str);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const d = parse(str);
      if (d && !isDisabled(d)) {
        onChange(toISO(d));
        setActive(d);
        setView(startOfMonth(d));
      }
    }
  }
  function moveActive(next: Date) {
    const c = clamp(next, min, max);
    setActive(c);
    if (c.getMonth() !== view.getMonth() || c.getFullYear() !== view.getFullYear()) {
      setView(startOfMonth(c));
    }
  }
  function onGridKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); moveActive(addDays(active, -1)); break;
      case "ArrowRight": e.preventDefault(); moveActive(addDays(active, 1)); break;
      case "ArrowUp": e.preventDefault(); moveActive(addDays(active, -7)); break;
      case "ArrowDown": e.preventDefault(); moveActive(addDays(active, 7)); break;
      case "Home": e.preventDefault(); moveActive(addDays(active, -active.getDay())); break;
      case "End": e.preventDefault(); moveActive(addDays(active, 6 - active.getDay())); break;
      case "PageUp": e.preventDefault(); moveActive(addMonths(active, -1)); break;
      case "PageDown": e.preventDefault(); moveActive(addMonths(active, 1)); break;
      case "Enter":
      case " ": e.preventDefault(); select(active); break;
      case "Escape": e.preventDefault(); close(); break;
    }
  }

  // Build the 6-week grid for the current view month.
  const first = startOfMonth(view);
  const gridStart = addDays(first, -first.getDay());
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const selectedISO = value;
  const todayISO = toISO(new Date());

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openPicker())}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={error ? errorId : undefined}
        className={`flex w-full items-center justify-between rounded-2xl border px-5 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          error ? "border-red-300 bg-red-50" : "border-slate-300 bg-white hover:border-blue-400"
        }`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value ? pretty(value) : "Select date"}
        </span>
        <span aria-hidden className="text-slate-400">📅</span>
      </button>

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()}`}
          className="animate-scale-in absolute left-0 z-40 mt-2 w-[20rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setView(addMonths(view, -1))}
              aria-label="Previous month"
              className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              ‹
            </button>
            {showYearMonth ? (
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Month"
                  value={view.getMonth()}
                  onChange={(e) =>
                    setView(new Date(view.getFullYear(), Number(e.target.value), 1))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Year"
                  value={view.getFullYear()}
                  onChange={(e) =>
                    setView(new Date(Number(e.target.value), view.getMonth(), 1))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span aria-live="polite" className="text-sm font-bold text-slate-900">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </span>
            )}
            <button
              type="button"
              onClick={() => setView(addMonths(view, 1))}
              aria-label="Next month"
              className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              ›
            </button>
          </div>

          <div role="grid" onKeyDown={onGridKeyDown}>
            <div role="row" className="grid grid-cols-7">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  role="columnheader"
                  className="py-1 text-center text-xs font-bold text-slate-400"
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const iso = toISO(d);
                const inMonth = d.getMonth() === view.getMonth();
                const outOfRange = isDisabled(d);
                // Blocked (weekend/closure) days stay clickable so we can explain
                // why; only truly out-of-range days use the native disabled attr.
                const blk = !outOfRange && blockedDate ? blockedDate(iso) : null;
                const off = outOfRange || Boolean(blk);
                const isClosure = Boolean(blk?.closure);
                const selected = iso === selectedISO;
                const isActive = iso === toISO(active);
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    data-iso={iso}
                    tabIndex={isActive ? 0 : -1}
                    aria-selected={selected}
                    aria-disabled={off || undefined}
                    aria-label={
                      blk
                        ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} — ${blk.message}`
                        : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
                    }
                    disabled={outOfRange || undefined}
                    onClick={() => {
                      if (outOfRange) return;
                      if (blk) return setBlockMsg(blk.message);
                      select(d);
                    }}
                    className={[
                      "m-0.5 h-9 rounded-lg text-sm transition",
                      selected
                        ? "bg-blue-700 font-bold text-white"
                        : isClosure
                          ? "cursor-not-allowed font-semibold text-red-400 line-through"
                          : off
                            ? "cursor-not-allowed text-slate-300 line-through"
                            : inMonth
                              ? "text-slate-800 hover:bg-blue-100"
                              : "text-slate-400 hover:bg-slate-100",
                      !selected && iso === todayISO ? "ring-1 ring-blue-300" : "",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {blockMsg && (
            <p role="status" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {blockMsg}
            </p>
          )}

          {showYearMonth && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <label
                htmlFor={`${baseId}-typed`}
                className="block text-[11px] font-semibold text-slate-500"
              >
                Or type the date
              </label>
              <input
                id={`${baseId}-typed`}
                type="text"
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                value={typed}
                onChange={(e) => onTypedChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
