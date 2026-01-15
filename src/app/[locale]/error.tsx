"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Next.js App Router error boundary.
 *
 * Catches errors in route segments and displays a recovery UI.
 * Complements the component-level ErrorBoundary that wraps ChatInterface.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("Route error boundary caught an error:", error);

    // Track to PostHog for monitoring
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("route_error_boundary_triggered", {
        error_name: error.name,
        error_message: error.message,
        error_digest: error.digest,
        error_stack: error.stack?.substring(0, 1000),
        url: window.location.href,
      });
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="text-[var(--lo1-gold)] text-4xl mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--lo1-starlight)]">
          Something went wrong
        </h2>
        <p className="text-[var(--lo1-text-light)]">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)] rounded-lg font-medium hover:bg-[var(--lo1-gold-light)] transition-colors"
        >
          Try again
        </button>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left text-xs text-[var(--lo1-text-muted)]">
            <summary className="cursor-pointer hover:text-[var(--lo1-text-light)]">
              Error details
            </summary>
            <pre className="mt-2 p-2 bg-[var(--lo1-indigo)]/50 rounded overflow-auto max-h-40">
              {error.message}
              {"\n\n"}
              {error.stack}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
