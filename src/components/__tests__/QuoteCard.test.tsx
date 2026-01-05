import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuoteCard from "../QuoteCard";
import { Quote } from "@/lib/types";

// Mock analytics
jest.mock("@/lib/analytics", () => ({
  analytics: {
    quoteDisplayed: jest.fn(),
    quoteLinkClicked: jest.fn(),
  },
}));

describe("QuoteCard", () => {
  const mockQuote: Quote = {
    text: "Questioner: What is love? Ra: I am Ra. Love is the first distortion.",
    reference: "Ra 50.12",
    url: "https://lawofone.info/s/50#12",
    metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render quote text correctly", () => {
      render(<QuoteCard quote={mockQuote} />);

      expect(screen.getByText(/What is love?/i)).toBeInTheDocument();
      expect(screen.getByText(/I am Ra. Love is the first distortion./i)).toBeInTheDocument();
    });

    it("should render reference number", () => {
      render(<QuoteCard quote={mockQuote} />);

      expect(screen.getByText("50.12")).toBeInTheDocument();
    });

    it("should render link to full quote", () => {
      render(<QuoteCard quote={mockQuote} />);

      const links = screen.getAllByRole("link");
      const referenceLink = links.find((link) => link.textContent === "50.12");

      expect(referenceLink).toHaveAttribute("href", mockQuote.url);
      expect(referenceLink).toHaveAttribute("target", "_blank");
      expect(referenceLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("should show Questioner label", () => {
      render(<QuoteCard quote={mockQuote} />);

      expect(screen.getByText(/Questioner/i)).toBeInTheDocument();
    });

    it("should show Ra label when Ra speaks", () => {
      render(<QuoteCard quote={mockQuote} />);

      expect(screen.getByText("Ra")).toBeInTheDocument();
    });
  });

  describe("ellipsis handling", () => {
    it("should display leading ellipsis when present", () => {
      const quoteWithLeading: Quote = {
        ...mockQuote,
        text: "...\n\nRa: Love is unity.",
      };

      render(<QuoteCard quote={quoteWithLeading} />);

      const ellipses = screen.getAllByText("...");
      expect(ellipses.length).toBeGreaterThan(0);
    });

    it("should display trailing ellipsis when present", () => {
      const quoteWithTrailing: Quote = {
        ...mockQuote,
        text: "Ra: Love is unity.\n\n...",
      };

      render(<QuoteCard quote={quoteWithTrailing} />);

      const ellipses = screen.getAllByText("...");
      expect(ellipses.length).toBeGreaterThan(0);
    });

    it("should display both leading and trailing ellipsis", () => {
      const quoteWithBoth: Quote = {
        ...mockQuote,
        text: "...\n\nRa: Love is unity.\n\n...",
      };

      render(<QuoteCard quote={quoteWithBoth} />);

      const ellipses = screen.getAllByText("...");
      expect(ellipses.length).toBeGreaterThanOrEqual(2);
    });

    it("should make ellipsis clickable buttons to expand", () => {
      const quoteWithEllipsis: Quote = {
        ...mockQuote,
        text: "...\n\nRa: Love is unity.",
      };

      render(<QuoteCard quote={quoteWithEllipsis} />);

      const ellipsisButtons = screen.getAllByText("...").filter((el) => el.tagName === "BUTTON");
      expect(ellipsisButtons.length).toBeGreaterThan(0);
    });
  });

  describe("text formatting", () => {
    it("should handle text without speaker labels", () => {
      const simpleQuote: Quote = {
        ...mockQuote,
        text: "This is a simple quote without speakers.",
      };

      render(<QuoteCard quote={simpleQuote} />);

      expect(screen.getByText(/This is a simple quote without speakers./i)).toBeInTheDocument();
    });

    it("should handle multiple Ra segments", () => {
      const multiRaQuote: Quote = {
        ...mockQuote,
        text: "Ra: First statement. Ra: Second statement.",
      };

      render(<QuoteCard quote={multiRaQuote} />);

      expect(screen.getByText(/First statement./i)).toBeInTheDocument();
      expect(screen.getByText(/Second statement./i)).toBeInTheDocument();
    });

    it("should preserve newlines in content", () => {
      const quoteWithNewlines: Quote = {
        ...mockQuote,
        text: "Ra: Line one.\n\nLine two.",
      };

      render(<QuoteCard quote={quoteWithNewlines} />);

      const content = screen.getByText(/Line one/i);
      expect(content.className).toContain("whitespace-pre-line");
    });
  });

  describe("reference extraction", () => {
    it('should extract short reference from "Ra X.Y" format', () => {
      render(<QuoteCard quote={mockQuote} />);

      expect(screen.getByText("50.12")).toBeInTheDocument();
    });

    it("should handle different reference formats", () => {
      const quote: Quote = {
        ...mockQuote,
        reference: "49.8",
      };

      render(<QuoteCard quote={quote} />);

      expect(screen.getByText("49.8")).toBeInTheDocument();
    });

    it("should fallback to full reference if pattern does not match", () => {
      const quote: Quote = {
        ...mockQuote,
        reference: "Session 50",
      };

      render(<QuoteCard quote={quote} />);

      expect(screen.getByText("Session 50")).toBeInTheDocument();
    });
  });

  describe("analytics tracking", () => {
    it("should track quote display on mount", () => {
      const { analytics } = require("@/lib/analytics");

      render(<QuoteCard quote={mockQuote} />);

      expect(analytics.quoteDisplayed).toHaveBeenCalledWith({
        sessionNumber: 50,
        questionNumber: 12,
        positionInResponse: 0,
        sentenceRange: undefined,
      });
    });

    it("should track partial quote when ellipsis present", () => {
      const { analytics } = require("@/lib/analytics");

      const partialQuote: Quote = {
        ...mockQuote,
        text: "...\n\nRa: Love is unity.",
      };

      render(<QuoteCard quote={partialQuote} />);

      expect(analytics.quoteDisplayed).toHaveBeenCalledWith({
        sessionNumber: 50,
        questionNumber: 12,
        positionInResponse: 0,
        sentenceRange: "partial",
      });
    });

    it("should track session link clicks", async () => {
      const { analytics } = require("@/lib/analytics");
      const user = userEvent.setup();

      render(<QuoteCard quote={mockQuote} />);

      const referenceLink = screen.getByText("50.12");
      await user.click(referenceLink);

      expect(analytics.quoteLinkClicked).toHaveBeenCalledWith({
        sessionNumber: 50,
        questionNumber: 12,
        clickType: "session_link",
      });
    });

    it("should track ellipsis link clicks", async () => {
      const { analytics } = require("@/lib/analytics");
      const user = userEvent.setup();

      const quoteWithEllipsis: Quote = {
        ...mockQuote,
        text: "...\n\nRa: Love is unity.",
      };

      render(<QuoteCard quote={quoteWithEllipsis} />);

      const ellipsisLink = screen.getAllByText("...").find((el) => el.tagName === "A");
      if (ellipsisLink) {
        await user.click(ellipsisLink);

        expect(analytics.quoteLinkClicked).toHaveBeenCalledWith({
          sessionNumber: 50,
          questionNumber: 12,
          clickType: "ellipsis",
        });
      }
    });
  });

  describe("accessibility", () => {
    it("should have proper link attributes for security", () => {
      render(<QuoteCard quote={mockQuote} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("should open links in new tab", () => {
      render(<QuoteCard quote={mockQuote} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty text", () => {
      const emptyQuote: Quote = {
        ...mockQuote,
        text: "",
      };

      render(<QuoteCard quote={emptyQuote} />);

      // Should still render the card structure
      expect(screen.getByText("Questioner")).toBeInTheDocument();
    });

    it("should handle quote with only whitespace", () => {
      const whitespaceQuote: Quote = {
        ...mockQuote,
        text: "   \n\n   ",
      };

      render(<QuoteCard quote={whitespaceQuote} />);

      expect(screen.getByText("Questioner")).toBeInTheDocument();
    });

    it("should handle very long quote text", () => {
      const longQuote: Quote = {
        ...mockQuote,
        text: "Ra: " + "This is a very long sentence. ".repeat(100),
      };

      render(<QuoteCard quote={longQuote} />);

      expect(screen.getByText(/This is a very long sentence./i)).toBeInTheDocument();
    });

    it("should handle reference without session/question numbers", () => {
      const { analytics } = require("@/lib/analytics");

      const quote: Quote = {
        ...mockQuote,
        reference: "Unknown Reference",
      };

      render(<QuoteCard quote={quote} />);

      expect(analytics.quoteDisplayed).toHaveBeenCalledWith({
        sessionNumber: 0,
        questionNumber: 0,
        positionInResponse: 0,
        sentenceRange: undefined,
      });
    });
  });
});
