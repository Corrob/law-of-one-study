/**
 * @jest-environment jsdom
 */

// Mock posthog-js - use jest.fn() inside the factory
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    capture: jest.fn(),
  },
}));

import posthog from "posthog-js";
import { analytics } from "../analytics";

const mockCapture = posthog.capture as jest.Mock;

describe("analytics", () => {
  beforeEach(() => {
    mockCapture.mockClear();
  });

  describe("questionSubmitted", () => {
    it("should capture question_submitted event", () => {
      analytics.questionSubmitted({
        messageLength: 50,
        containsQuotedText: false,
        isFollowUp: true,
        conversationDepth: 3,
      });

      expect(mockCapture).toHaveBeenCalledWith("question_submitted", {
        messageLength: 50,
        containsQuotedText: false,
        isFollowUp: true,
        conversationDepth: 3,
      });
    });
  });

  describe("responseComplete", () => {
    it("should capture response_complete event", () => {
      analytics.responseComplete({
        responseTimeMs: 1500,
        quoteCount: 2,
        messageLength: 500,
        isQuoteSearch: true,
      });

      expect(mockCapture).toHaveBeenCalledWith("response_complete", {
        responseTimeMs: 1500,
        quoteCount: 2,
        messageLength: 500,
        isQuoteSearch: true,
      });
    });
  });

  describe("streamingStarted", () => {
    it("should capture streaming_started event", () => {
      analytics.streamingStarted({ isQuoteSearch: false });

      expect(mockCapture).toHaveBeenCalledWith("streaming_started", {
        isQuoteSearch: false,
      });
    });

    it("should handle undefined properties", () => {
      analytics.streamingStarted();

      expect(mockCapture).toHaveBeenCalledWith("streaming_started", undefined);
    });
  });

  describe("quoteDisplayed", () => {
    it("should capture quote_displayed event", () => {
      analytics.quoteDisplayed({
        sessionNumber: 50,
        questionNumber: 7,
        positionInResponse: 1,
        sentenceRange: "3-7",
      });

      expect(mockCapture).toHaveBeenCalledWith("quote_displayed", {
        sessionNumber: 50,
        questionNumber: 7,
        positionInResponse: 1,
        sentenceRange: "3-7",
      });
    });

    it("should handle optional sentenceRange", () => {
      analytics.quoteDisplayed({
        sessionNumber: 1,
        questionNumber: 1,
        positionInResponse: 0,
      });

      expect(mockCapture).toHaveBeenCalledWith("quote_displayed", {
        sessionNumber: 1,
        questionNumber: 1,
        positionInResponse: 0,
      });
    });
  });

  describe("quoteLinkClicked", () => {
    it("should capture quote_link_clicked event for session link", () => {
      analytics.quoteLinkClicked({
        sessionNumber: 50,
        questionNumber: 7,
        clickType: "session_link",
      });

      expect(mockCapture).toHaveBeenCalledWith("quote_link_clicked", {
        sessionNumber: 50,
        questionNumber: 7,
        clickType: "session_link",
      });
    });

    it("should capture quote_link_clicked event for ellipsis", () => {
      analytics.quoteLinkClicked({
        sessionNumber: 50,
        questionNumber: 7,
        clickType: "ellipsis",
      });

      expect(mockCapture).toHaveBeenCalledWith("quote_link_clicked", {
        sessionNumber: 50,
        questionNumber: 7,
        clickType: "ellipsis",
      });
    });
  });

  describe("quoteCopied", () => {
    it("should capture quote_copied event", () => {
      analytics.quoteCopied({
        sessionNumber: 50,
        questionNumber: 7,
        isExpanded: true,
      });

      expect(mockCapture).toHaveBeenCalledWith("quote_copied", {
        sessionNumber: 50,
        questionNumber: 7,
        isExpanded: true,
      });
    });
  });

  describe("concept interactions", () => {
    it("should capture concept_hovered event", () => {
      analytics.conceptHovered({ term: "Unity" });

      expect(mockCapture).toHaveBeenCalledWith("concept_hovered", {
        term: "Unity",
      });
    });

    it("should capture concept_clicked event", () => {
      analytics.conceptClicked({ term: "Density" });

      expect(mockCapture).toHaveBeenCalledWith("concept_clicked", {
        term: "Density",
      });
    });

    it("should capture concept_explored event", () => {
      analytics.conceptExplored({ term: "Love/Light" });

      expect(mockCapture).toHaveBeenCalledWith("concept_explored", {
        term: "Love/Light",
      });
    });
  });

  describe("error", () => {
    it("should capture error_occurred event", () => {
      analytics.error({
        errorType: "api_error",
        errorMessage: "Connection failed",
        context: { retryCount: 2 },
      });

      expect(mockCapture).toHaveBeenCalledWith("error_occurred", {
        errorType: "api_error",
        errorMessage: "Connection failed",
        context: { retryCount: 2 },
      });
    });

    it("should handle all error types", () => {
      const errorTypes = [
        "rate_limit",
        "validation",
        "api_error",
        "streaming_error",
      ] as const;

      for (const errorType of errorTypes) {
        mockCapture.mockClear();
        analytics.error({ errorType });
        expect(mockCapture).toHaveBeenCalledWith("error_occurred", {
          errorType,
        });
      }
    });
  });

  describe("welcome screen interactions", () => {
    it("should capture welcome_screen_viewed event", () => {
      analytics.welcomeScreenViewed({
        randomQuoteIndex: 3,
        starterCount: 4,
      });

      expect(mockCapture).toHaveBeenCalledWith("welcome_screen_viewed", {
        randomQuoteIndex: 3,
        starterCount: 4,
      });
    });

    it("should capture conversation_starter_clicked event", () => {
      analytics.conversationStarterClicked({
        starterText: "What is the Law of One?",
        starterIndex: 0,
      });

      expect(mockCapture).toHaveBeenCalledWith("conversation_starter_clicked", {
        starterText: "What is the Law of One?",
        starterIndex: 0,
      });
    });
  });

  describe("performance", () => {
    it("should capture performance_metric event", () => {
      analytics.performance({
        metric: "response_time",
        valueMs: 2500,
        context: { messageCount: 5 },
      });

      expect(mockCapture).toHaveBeenCalledWith("performance_metric", {
        metric: "response_time",
        valueMs: 2500,
        context: { messageCount: 5 },
      });
    });

    it("should handle all metric types", () => {
      const metrics = [
        "response_time",
        "animation_duration",
        "time_to_first_chunk",
      ] as const;

      for (const metric of metrics) {
        mockCapture.mockClear();
        analytics.performance({ metric, valueMs: 100 });
        expect(mockCapture).toHaveBeenCalled();
      }
    });
  });

  describe("animationComplete", () => {
    it("should capture animation_complete event", () => {
      analytics.animationComplete({
        animationType: "text",
        durationMs: 500,
        chunkCount: 10,
      });

      expect(mockCapture).toHaveBeenCalledWith("animation_complete", {
        animationType: "text",
        durationMs: 500,
        chunkCount: 10,
      });
    });
  });

  describe("suggestions", () => {
    it("should capture suggestion_displayed event", () => {
      analytics.suggestionDisplayed({ count: 3 });

      expect(mockCapture).toHaveBeenCalledWith("suggestion_displayed", {
        count: 3,
      });
    });

    it("should capture suggestion_clicked event", () => {
      analytics.suggestionClicked({
        suggestion: "Tell me more about love",
      });

      expect(mockCapture).toHaveBeenCalledWith("suggestion_clicked", {
        suggestion: "Tell me more about love",
      });
    });
  });
});
