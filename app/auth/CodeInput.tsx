"use client";

// Six-digit code entry.
//
// Deliberately six separate boxes rather than one text field: it shows how
// many digits are expected without saying so, and each digit lands in its own
// slot so a mistake is obvious at a glance. The cost is that every keyboard
// and paste behaviour has to be handled by hand, which is what the rest of
// this file is.
//
// The real value is submitted through a single hidden input, so the server
// action reads one field and never has to know the UI is split up.
import { useRef, useState, useEffect } from "react";

const LENGTH = 6;

export function CodeInput({
  name = "token",
  disabled = false,
  onComplete,
}: {
  name?: string;
  disabled?: boolean;
  /** Fires once all six digits are present — used to auto-submit. */
  onComplete?: (code: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  // Put the cursor in the first box as soon as the step appears — the
  // applicant has just switched to their email app and back, and should not
  // have to aim at a small target to carry on.
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (code.length === LENGTH) onComplete?.(code);
    // Only when the completed code changes, not on every render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function setAt(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setAt(index, "");
      return;
    }
    // A phone keyboard (or autofill) can deliver several digits into one box;
    // spread them across the remaining slots instead of dropping them.
    if (value.length > 1) {
      fill(value, index);
      return;
    }
    setAt(index, value);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function fill(value: string, from = 0) {
    const chars = value.replace(/\D/g, "").slice(0, LENGTH - from).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, i) => {
        next[from + i] = c;
      });
      return next;
    });
    const landed = Math.min(from + chars.length, LENGTH - 1);
    refs.current[landed]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setAt(index, "");
        return;
      }
      // Empty box: step back and clear the previous one, so holding backspace
      // walks the code out the way people expect.
      if (index > 0) {
        e.preventDefault();
        setAt(index - 1, "");
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div>
      <div className="flex justify-between gap-2" role="group" aria-label="6-digit code">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => {
              e.preventDefault();
              fill(e.clipboardData.getData("text"), 0);
            }}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            type="text"
            inputMode="numeric"
            // Lets iOS and Android offer the code straight from the email
            // notification, which is the whole reason this beats a link.
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            className="h-16 w-full rounded-2xl border border-slate-300 text-center text-2xl font-bold text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
          />
        ))}
      </div>
      <input type="hidden" name={name} value={code} />
    </div>
  );
}
