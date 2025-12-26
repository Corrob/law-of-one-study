import { render, screen } from "@testing-library/react";
import Message from "../Message";
import { Message as MessageType, Quote } from "@/lib/types";

// Mock child components
jest.mock("../QuoteCard", () => {
  return function QuoteCard({ quote }: { quote: Quote }) {
    return <div data-testid="quote-card">{quote.reference}</div>;
  };
});

jest.mock("../ConceptPopover", () => {
  return function ConceptPopover({ displayText }: { displayText: string }) {
    return <span data-testid="concept-popover">{displayText}</span>;
  };
});

jest.mock("@/lib/conceptParser", () => ({
  parseConceptsInText: jest.fn((text: string) => {
    // Simple mock that detects "Law of One" as a concept
    if (text.includes("Law of One")) {
      const parts = text.split("Law of One");
      return [
        { type: "text", content: parts[0] },
        { type: "concept", displayText: "Law of One", searchTerm: "Law of One" },
        { type: "text", content: parts[1] },
      ];
    }
    return [{ type: "text", content: text }];
  }),
}));

describe("Message", () => {
  const mockUserMessage: MessageType = {
    id: "1",
    role: "user",
    content: "What is the Law of One?",
    timestamp: new Date(),
  };

  const mockAssistantMessage: MessageType = {
    id: "2",
    role: "assistant",
    content: "The Law of One teaches unity.",
    timestamp: new Date(),
  };

  describe("user messages", () => {
    it("should render user message with correct styling", () => {
      render(<Message message={mockUserMessage} />);

      expect(screen.getByText("What is the Law of One?")).toBeInTheDocument();
    });

    it("should apply user message styling classes", () => {
      const { container } = render(<Message message={mockUserMessage} />);

      const messageDiv = container.querySelector(".bg-\\[\\#2a3366\\]");
      expect(messageDiv).toBeInTheDocument();
    });

    it("should align user messages to the right", () => {
      const { container } = render(<Message message={mockUserMessage} />);

      const wrapper = container.querySelector(".justify-end");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("assistant messages", () => {
    it("should render assistant message content", () => {
      render(<Message message={mockAssistantMessage} />);

      expect(screen.getByText(/The Law of One teaches unity./i)).toBeInTheDocument();
    });

    it("should render plain text when no segments provided", () => {
      render(<Message message={mockAssistantMessage} />);

      expect(screen.getByText(/teaches unity/i)).toBeInTheDocument();
    });

    it("should link concepts when onSearch is provided", () => {
      const onSearch = jest.fn();
      render(<Message message={mockAssistantMessage} onSearch={onSearch} />);

      // Should have rendered concept popover for "Law of One"
      const concepts = screen.queryAllByTestId("concept-popover");
      expect(concepts.length).toBeGreaterThan(0);
    });

    it("should not link concepts when onSearch is not provided", () => {
      render(<Message message={mockAssistantMessage} />);

      const concepts = screen.queryAllByTestId("concept-popover");
      expect(concepts.length).toBe(0);
    });
  });

  describe("message segments", () => {
    it("should render text segments", () => {
      const messageWithSegments: MessageType = {
        id: "3",
        role: "assistant",
        content: "Content with segments",
        segments: [
          { type: "text", content: "First segment" },
          { type: "text", content: "Second segment" },
        ],
        timestamp: new Date(),
      };

      render(<Message message={messageWithSegments} />);

      expect(screen.getByText("First segment")).toBeInTheDocument();
      expect(screen.getByText("Second segment")).toBeInTheDocument();
    });

    it("should render quote segments", () => {
      const messageWithQuote: MessageType = {
        id: "4",
        role: "assistant",
        content: "Message with quote",
        segments: [
          { type: "text", content: "Here is a quote:" },
          {
            type: "quote",
            quote: {
              text: "Ra: I am Ra. Love is unity.",
              reference: "Ra 50.12",
              url: "https://lawofone.info/s/50#12",
              metadata: {},
            },
          },
        ],
        timestamp: new Date(),
      };

      render(<Message message={messageWithQuote} />);

      expect(screen.getByText("Here is a quote:")).toBeInTheDocument();
      expect(screen.getByTestId("quote-card")).toBeInTheDocument();
      expect(screen.getByText("Ra 50.12")).toBeInTheDocument();
    });

    it("should render mixed text and quote segments", () => {
      const mixedMessage: MessageType = {
        id: "5",
        role: "assistant",
        content: "Mixed content",
        segments: [
          { type: "text", content: "Introduction text" },
          {
            type: "quote",
            quote: {
              text: "Quote content",
              reference: "Ra 1.1",
              url: "https://example.com",
              metadata: {},
            },
          },
          { type: "text", content: "Conclusion text" },
        ],
        timestamp: new Date(),
      };

      render(<Message message={mixedMessage} />);

      expect(screen.getByText("Introduction text")).toBeInTheDocument();
      expect(screen.getByTestId("quote-card")).toBeInTheDocument();
      expect(screen.getByText("Conclusion text")).toBeInTheDocument();
    });

    it("should apply correct styling to first segment", () => {
      const message: MessageType = {
        id: "6",
        role: "assistant",
        content: "Multi-segment",
        segments: [
          { type: "text", content: "First" },
          { type: "text", content: "Second" },
        ],
        timestamp: new Date(),
      };

      const { container } = render(<Message message={message} />);

      const segments = container.querySelectorAll(".min-h-\\[1lh\\]");
      expect(segments.length).toBeGreaterThan(0);
    });
  });

  describe("concept linking", () => {
    it("should parse and link concepts in text segments", () => {
      const onSearch = jest.fn();
      const message: MessageType = {
        id: "7",
        role: "assistant",
        content: "Text with concepts",
        segments: [{ type: "text", content: "The Law of One teaches unity." }],
        timestamp: new Date(),
      };

      render(<Message message={message} onSearch={onSearch} />);

      expect(screen.getByTestId("concept-popover")).toBeInTheDocument();
    });

    it("should not link concepts in user messages", () => {
      const onSearch = jest.fn();
      render(<Message message={mockUserMessage} onSearch={onSearch} />);

      const concepts = screen.queryAllByTestId("concept-popover");
      expect(concepts.length).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty content", () => {
      const emptyMessage: MessageType = {
        id: "8",
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      const { container } = render(<Message message={emptyMessage} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle message with empty segments array", () => {
      const message: MessageType = {
        id: "9",
        role: "assistant",
        content: "Fallback content",
        segments: [],
        timestamp: new Date(),
      };

      render(<Message message={message} />);

      // Should fall back to rendering content
      expect(screen.getByText("Fallback content")).toBeInTheDocument();
    });

    it("should handle very long message content", () => {
      const longMessage: MessageType = {
        id: "10",
        role: "assistant",
        content: "word ".repeat(1000),
        timestamp: new Date(),
      };

      render(<Message message={longMessage} />);

      expect(screen.getByText(/word/i)).toBeInTheDocument();
    });
  });
});
