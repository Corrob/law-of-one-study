"use client";

import posthog from "posthog-js";

/**
 * Client-side analytics for the Ask feature. Each helper is a no-op when
 * PostHog is unavailable (SSR, or key not configured), so callers need no
 * guards of their own.
 */

function capture(event: string, properties?: Record<string, unknown>): void {
  if (typeof window !== "undefined" && posthog) {
    posthog.capture(event, properties);
  }
}

/** The PostHog distinct id, for correlating server-side LLM analytics. */
export function getDistinctId(): string | undefined {
  if (typeof window !== "undefined" && posthog) {
    return posthog.get_distinct_id?.();
  }
  return undefined;
}

export const askAnalytics = {
  questionSubmitted: (p: {
    messageLength: number;
    isFollowUp: boolean;
    conversationDepth: number;
  }) => capture("question_submitted", p),

  streamingStarted: () => capture("streaming_started"),

  timeToFirstChunk: (valueMs: number) =>
    capture("performance_metric", { metric: "time_to_first_chunk", valueMs }),

  responseComplete: (p: {
    responseTimeMs: number;
    messageLength: number;
    citationCount: number;
  }) => capture("response_complete", p),

  error: (p: {
    errorType: "rate_limit" | "validation" | "api_error" | "streaming_error" | "empty_stream";
    errorMessage?: string;
  }) => capture("error_occurred", p),

  welcomeScreenViewed: (p: { starterCount: number }) =>
    capture("welcome_screen_viewed", p),

  conversationStarterClicked: (p: { starterText: string; starterIndex: number }) =>
    capture("conversation_starter_clicked", p),

  suggestionsDisplayed: (p: { count: number }) => capture("suggestions_displayed", p),

  suggestionClicked: (p: { suggestion: string; index: number }) =>
    capture("suggestion_clicked", p),

  relatedResourcesDisplayed: (p: { count: number; resources: string[] }) =>
    capture("related_resources_displayed", p),

  relatedResourceClicked: (p: { type: string; id: string; index: number }) =>
    capture("related_resource_clicked", p),
};
