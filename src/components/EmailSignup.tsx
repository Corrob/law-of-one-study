"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEmailSubscribe } from "@/hooks/useEmailSubscribe";
import { DAILY_QUOTE_LOCALES } from "@/lib/email/cadence";
import { type AvailableLanguage } from "@/lib/language-config";

export const EMAIL_SIGNUP_DISMISSED_KEY = "lo1-email-signup-dismissed";
export const EMAIL_SIGNUP_SUBSCRIBED_KEY = "lo1-email-signup-subscribed";

interface EmailSignupProps {
  /**
   * Re-entry signal: increment to re-open the card after dismissal (used by
   * the footer link). Clears the stored dismissal so the choice persists.
   */
  reopenSignal?: number;
}

/**
 * Compact, dismissible weekly-quote signup card shown beneath the daily
 * quote. Includes a hidden honeypot field ("website") to deter bots.
 */
export default function EmailSignup({ reopenSignal = 0 }: EmailSignupProps) {
  const locale = useLocale() as AvailableLanguage;
  const t = useTranslations("emailSignup");
  const { status, subscribe } = useEmailSubscribe(locale);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState<"weekly" | "daily">("weekly");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Only locales with a daily list get the choice; others are weekly-only.
  const showCadence = DAILY_QUOTE_LOCALES.includes(locale);

  useEffect(() => {
    if (
      !localStorage.getItem(EMAIL_SIGNUP_DISMISSED_KEY) &&
      !localStorage.getItem(EMAIL_SIGNUP_SUBSCRIBED_KEY)
    ) {
      setVisible(true);
      posthog.capture("email_signup_viewed");
    }
  }, []);

  useEffect(() => {
    if (reopenSignal > 0) {
      localStorage.removeItem(EMAIL_SIGNUP_DISMISSED_KEY);
      setVisible(true);
    }
  }, [reopenSignal]);

  // Runs after the card is rendered, so the ref is attached by the time
  // a reopen needs to scroll it into view.
  useEffect(() => {
    if (reopenSignal > 0 && visible) {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [reopenSignal, visible]);

  useEffect(() => {
    if (status === "success") {
      // Remember the subscription so the card doesn't reappear next visit.
      localStorage.setItem(EMAIL_SIGNUP_SUBSCRIBED_KEY, "1");
      posthog.capture("email_signup_completed", { locale, cadence });
    }
  }, [status, locale, cadence]);

  if (!visible) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return;
    void subscribe(email.trim(), honeypotRef.current?.value ?? "", cadence);
  };

  const handleDismiss = () => {
    localStorage.setItem(EMAIL_SIGNUP_DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (status === "success") {
    return (
      <div ref={containerRef} className="max-w-xl mx-auto p-3 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 rounded-xl text-center">
        <p className="text-sm text-[var(--lo1-starlight)]">{t("success")}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-xl mx-auto p-4 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 rounded-xl">
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0 space-y-3">
          <p className="text-sm text-[var(--lo1-stardust)] leading-relaxed">
            {t("description")}
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              aria-label={t("emailLabel")}
              disabled={status === "submitting"}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm
                       bg-[var(--lo1-indigo)]/40 text-[var(--lo1-starlight)]
                       placeholder-[var(--lo1-stardust)]
                       border border-[var(--lo1-celestial)]/30
                       focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)]"
            />
            {/* Honeypot: hidden from users, bots that fill it are dropped */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer
                       bg-[var(--lo1-gold)] text-[var(--lo1-indigo)]
                       hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {status === "submitting" ? t("submitting") : t("subscribe")}
            </button>
          </form>
          {showCadence && (
            <div role="radiogroup" aria-label={t("cadenceLabel")} className="flex gap-2">
              {(["weekly", "daily"] as const).map((option) => (
                <label
                  key={option}
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors border
                    ${
                      cadence === option
                        ? "bg-[var(--lo1-gold)]/20 border-[var(--lo1-gold)]/60 text-[var(--lo1-starlight)]"
                        : "border-[var(--lo1-celestial)]/30 text-[var(--lo1-stardust)] hover:border-[var(--lo1-celestial)]/60"
                    }`}
                >
                  <input
                    type="radio"
                    name="cadence"
                    value={option}
                    checked={cadence === option}
                    onChange={() => setCadence(option)}
                    className="sr-only"
                  />
                  {t(option === "weekly" ? "cadenceWeekly" : "cadenceDaily")}
                </label>
              ))}
            </div>
          )}
          {status === "error" && (
            <p role="alert" className="text-xs text-red-400">
              {t("error")}
            </p>
          )}
          <p className="text-xs text-[var(--lo1-stardust)]/60">
            {t("privacyNote")}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-2 -m-2 text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] cursor-pointer"
          aria-label={t("dismiss")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
