"use client";

import { useCallback, useState } from "react";

export type SubscribeStatus = "idle" | "submitting" | "success" | "error";

/**
 * Submit an email to POST /api/subscribe and track the request lifecycle.
 * The `website` argument is the honeypot value — it is forwarded so the
 * server can drop bot submissions; real users always send an empty string.
 */
export function useEmailSubscribe(locale: string) {
  const [status, setStatus] = useState<SubscribeStatus>("idle");

  const subscribe = useCallback(
    async (email: string, website: string = "", cadence: "weekly" | "daily" = "weekly") => {
      setStatus("submitting");
      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, locale, website, cadence }),
        });
        const data = (await response.json()) as { status?: string };
        setStatus(response.ok && data.status === "ok" ? "success" : "error");
      } catch {
        setStatus("error");
      }
    },
    [locale]
  );

  return { status, subscribe };
}
