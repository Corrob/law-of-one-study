"use client";

import posthog from "posthog-js";

/**
 * Client-side analytics tracking helper
 */

export const analytics = {
  /**
   * Track when a user submits a question
   */
  questionSubmitted: (properties: {
    messageLength: number;
    containsQuotedText: boolean;
    isFollowUp: boolean;
    conversationDepth: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("question_submitted", properties);
    }
  },

  /**
   * Track when a response is complete
   */
  responseComplete: (properties: {
    responseTimeMs: number;
    quoteCount: number;
    messageLength: number;
    isQuoteSearch: boolean;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("response_complete", properties);
    }
  },

  /**
   * Track when streaming starts
   */
  streamingStarted: (properties?: { isQuoteSearch: boolean }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("streaming_started", properties);
    }
  },

  /**
   * Track when a quote is displayed
   */
  quoteDisplayed: (properties: {
    sessionNumber: number;
    questionNumber: number;
    positionInResponse: number;
    sentenceRange?: string;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("quote_displayed", properties);
    }
  },

  /**
   * Track when a quote link is clicked
   */
  quoteLinkClicked: (properties: {
    sessionNumber: number;
    questionNumber: number;
    clickType: "session_link" | "ellipsis";
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("quote_link_clicked", properties);
    }
  },

  /**
   * Track when a quote is copied
   */
  quoteCopied: (properties: {
    sessionNumber: number;
    questionNumber: number;
    isExpanded: boolean;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("quote_copied", properties);
    }
  },

  /**
   * Track when a concept is interacted with
   */
  conceptHovered: (properties: { term: string }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("concept_hovered", properties);
    }
  },

  conceptClicked: (properties: { term: string }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("concept_clicked", properties);
    }
  },

  conceptExplored: (properties: { term: string }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("concept_explored", properties);
    }
  },

  /**
   * Track errors
   */
  error: (properties: {
    errorType: "rate_limit" | "validation" | "api_error" | "streaming_error";
    errorMessage?: string;
    context?: Record<string, unknown>;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("error_occurred", properties);
    }
  },

  /**
   * Track welcome screen interactions
   */
  welcomeScreenViewed: (properties?: { randomQuoteIndex: number; starterCount: number }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("welcome_screen_viewed", properties);
    }
  },

  conversationStarterClicked: (properties: { starterText: string; starterIndex: number }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("conversation_starter_clicked", properties);
    }
  },

  /**
   * Track performance metrics
   */
  performance: (properties: {
    metric: "response_time" | "animation_duration" | "time_to_first_chunk";
    valueMs: number;
    context?: Record<string, unknown>;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("performance_metric", properties);
    }
  },

  /**
   * Track animation completion
   */
  animationComplete: (properties: {
    animationType: "text" | "quote";
    durationMs: number;
    chunkCount: number;
  }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("animation_complete", properties);
    }
  },

  /**
   * Track when follow-up suggestions are displayed
   */
  suggestionDisplayed: (properties: { count: number }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("suggestion_displayed", properties);
    }
  },

  /**
   * Track when a follow-up suggestion is clicked
   */
  suggestionClicked: (properties: { suggestion: string }) => {
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("suggestion_clicked", properties);
    }
  },
};
