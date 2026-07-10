"use client";

import { useTranslations } from "next-intl";

/**
 * Copyright / attribution notice for the Ask feature. Makes clear the answers
 * are original synthesis (not reproduction), and points to the authoritative
 * sources at L/L Research and lawofone.info.
 */
export default function AskAttribution() {
  const t = useTranslations("ask");
  return (
    <p className="text-[11px] leading-relaxed text-[var(--lo1-stardust)]/60 text-center">
      {t("attribution")}{" "}
      <a
        href="https://www.llresearch.org"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--lo1-gold)]/80 hover:underline cursor-pointer"
      >
        L/L Research
      </a>{" "}
      &middot;{" "}
      <a
        href="https://www.lawofone.info"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--lo1-gold)]/80 hover:underline cursor-pointer"
      >
        lawofone.info
      </a>
    </p>
  );
}
