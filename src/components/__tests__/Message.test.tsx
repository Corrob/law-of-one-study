import { render, screen } from "@testing-library/react";
import Message from "../Message";
import { Message as MessageType, Quote } from "@/lib/types";

// Mock the language context
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: jest.fn(() => ({ language: "en", setLanguage: jest.fn() })),
}));

// Mock child components
jest.mock("../QuoteCard", () => {
  return function QuoteCard({ quote }: { quote: Quote }) {
    return <div data-testid="quote-card">{quote.reference}</div>;
  };
});

jest.mock("../chat/BilingualQuoteCard", () => {
  return function BilingualQuoteCard({
    quote,
    targetLanguage,
  }: {
    quote: Quote;
    targetLanguage: string;
  }) {
    return (
      <div data-testid="bilingual-quote-card">
        {quote.reference} ({targetLanguage})
      </div>
    );
  };
});

jest.mock("../ConceptPopover", () => {
  return function ConceptPopover({ displayText }: { displayText: string }) {
    return <span data-testid="concept-popover">{displayText}</span>;
  };
});

jest.mock("../MarkdownRenderer", () => {
  return function MarkdownRenderer({
    content,
    onSearch,
  }: {
    content: string;
    onSearch?: (term: string) => void;
  }) {
    return (
      <div data-testid="markdown-renderer" onClick={() => onSearch?.("test")}>
        {content}
      </div>
    );
  };
});

jest.mock("../SuggestionChips", () => {
  return function SuggestionChips({
    suggestions,
    onSelect,
  }: {
    suggestions: string[];
    onSelect: (suggestion: string) => void;
  }) {
    return (
      <div data-testid="suggestion-chips">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => onSelect(s)} data-testid="suggestion-chip">
            {s}
          </button>
        ))}
      </div>
    );
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

      // User message uses CSS variable for background
      const messageDiv = container.querySelector(".bg-\\[var\\(--lo1-user-message\\)\\]");
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

    it("should render with MarkdownRenderer when onSearch is provided", () => {
      const onSearch = jest.fn();
      render(<Message message={mockAssistantMessage} onSearch={onSearch} />);

      // MarkdownRenderer is used for assistant messages
      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
    });

    it("should render with MarkdownRenderer when onSearch is not provided", () => {
      render(<Message message={mockAssistantMessage} />);

      // MarkdownRenderer is still used, just without search functionality
      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
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
              url: "https://www.llresearch.org/channeling/ra-contact/50#12",
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

  describe("markdown rendering", () => {
    it("should use MarkdownRenderer for text segments", () => {
      const onSearch = jest.fn();
      const message: MessageType = {
        id: "7",
        role: "assistant",
        content: "Text with concepts",
        segments: [{ type: "text", content: "The Law of One teaches unity." }],
        timestamp: new Date(),
      };

      render(<Message message={message} onSearch={onSearch} />);

      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
    });

    it("should not use MarkdownRenderer for user messages", () => {
      const onSearch = jest.fn();
      render(<Message message={mockUserMessage} onSearch={onSearch} />);

      const markdownRenderer = screen.queryByTestId("markdown-renderer");
      expect(markdownRenderer).not.toBeInTheDocument();
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

  describe("suggestion chips", () => {
    it("should render suggestion chips when provided on assistant message", () => {
      const onSearch = jest.fn();
      const suggestions = ["Tell me more", "What about love?", "How do I meditate?"];

      render(
        <Message
          message={mockAssistantMessage}
          onSearch={onSearch}
          suggestions={suggestions}
        />
      );

      expect(screen.getByTestId("suggestion-chips")).toBeInTheDocument();
      expect(screen.getAllByTestId("suggestion-chip")).toHaveLength(3);
      expect(screen.getByText("Tell me more")).toBeInTheDocument();
    });

    it("should call onSearch when suggestion chip is clicked", () => {
      const onSearch = jest.fn();
      const suggestions = ["Tell me more"];

      render(
        <Message
          message={mockAssistantMessage}
          onSearch={onSearch}
          suggestions={suggestions}
        />
      );

      screen.getByText("Tell me more").click();
      expect(onSearch).toHaveBeenCalledWith("Tell me more");
    });

    it("should not render suggestion chips when suggestions array is empty", () => {
      const onSearch = jest.fn();

      render(
        <Message
          message={mockAssistantMessage}
          onSearch={onSearch}
          suggestions={[]}
        />
      );

      expect(screen.queryByTestId("suggestion-chips")).not.toBeInTheDocument();
    });

    it("should not render suggestion chips when onSearch is not provided", () => {
      const suggestions = ["Tell me more"];

      render(<Message message={mockAssistantMessage} suggestions={suggestions} />);

      expect(screen.queryByTestId("suggestion-chips")).not.toBeInTheDocument();
    });

    it("should not render suggestion chips on user messages", () => {
      const onSearch = jest.fn();
      const suggestions = ["Tell me more"];

      render(
        <Message message={mockUserMessage} onSearch={onSearch} suggestions={suggestions} />
      );

      expect(screen.queryByTestId("suggestion-chips")).not.toBeInTheDocument();
    });
  });
});
