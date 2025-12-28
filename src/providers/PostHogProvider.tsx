"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (key) {
    posthog.init(key, {
      api_host: "/ingest", // Use reverse proxy to avoid ad blockers
      ui_host: "https://us.posthog.com", // For session replay UI links
      person_profiles: "identified_only",
      capture_pageview: false, // We'll handle this manually for better control
      capture_pageleave: true,
      autocapture: false, // We want explicit tracking for better control
      // Scroll depth tracking is enabled by default (disable_scroll_properties: false)
    });
  }
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track pageviews on client-side
    if (typeof window === "undefined") return;
    if (!pathname || !posthog) return;

    let url = window.origin + pathname;
    if (searchParams && searchParams.toString()) {
      url = url + `?${searchParams.toString()}`;
    }
    posthog.capture("$pageview", {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
