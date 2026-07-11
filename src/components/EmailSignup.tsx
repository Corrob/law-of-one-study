"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEmailSubscribe } from "@/hooks/useEmailSubscribe";
import { type AvailableLanguage } from "@/lib/language-config";

export const EMAIL_SIGNUP_DISMISSED_KEY = "lo1-email-signup-dismissed";

/**
 * Compact, dismissible weekly-quote signup card shown beneath the daily
 * quote. Includes a hidden honeypot field ("website") to deter bots.
 */
export default function EmailSignup() {
  const locale = useLocale() as AvailableLanguage;
  const t = useTranslations("emailSignup");
  const { status, subscribe } = useEmailSubscribe(locale);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(EMAIL_SIGNUP_DISMISSED_KEY)) {
      setVisible(true);
      if (typeof window !== "undefined" && posthog) {
        posthog.capture("email_signup_viewed");
      }
    }
  }, []);

  useEffect(() => {
    if (status === "success" && typeof window !== "undefined" && posthog) {
      posthog.capture("email_signup_completed", { locale });
    }
  }, [status, locale]);

  if (!visible) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return;
    void subscribe(email.trim(), honeypotRef.current?.value ?? "");
  };

  const handleDismiss = () => {
    localStorage.setItem(EMAIL_SIGNUP_DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (status === "success") {
    return (
      <div className="max-w-xl mx-auto p-3 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 rounded-xl text-center">
        <p className="text-sm text-[var(--lo1-starlight)]">{t("success")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 rounded-xl">
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
          className="flex-shrink-0 text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] cursor-pointer"
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
