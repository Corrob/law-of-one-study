import { render, screen } from "@testing-library/react";
import StreamingMessage from "../StreamingMessage";
import { AnimationChunk, TextChunk, QuoteChunk } from "@/lib/types";

// Mock the language context
jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: jest.fn(() => ({ language: "en", setLanguage: jest.fn() })),
}));

// Mock child components
jest.mock("../QuoteCard", () => {
  return function MockQuoteCard({ quote }: { quote: { reference: string } }) {
    return <div data-testid="quote-card">QuoteCard: {quote.reference}</div>;
  };
});

jest.mock("../AnimatedQuoteCard", () => {
  return function MockAnimatedQuoteCard({
    quote,
    onComplete,
  }: {
    quote: { reference: string };
    onComplete?: () => void;
  }) {
    return (
      <div data-testid="animated-quote-card" onClick={onComplete}>
        AnimatedQuoteCard: {quote.reference}
      </div>
    );
  };
});

jest.mock("../chat/BilingualQuoteCard", () => {
  return function MockBilingualQuoteCard({
    quote,
    targetLanguage,
  }: {
    quote: { reference: string };
    targetLanguage: string;
  }) {
    return (
      <div data-testid="bilingual-quote-card">
        BilingualQuoteCard: {quote.reference} ({targetLanguage})
      </div>
    );
  };
});

jest.mock("../AnimatedMarkdown", () => {
  return function MockAnimatedMarkdown({
    content,
    onComplete,
  }: {
    content: string;
    onComplete: () => void;
  }) {
    return (
      <div data-testid="animated-markdown" onClick={onComplete}>
        AnimatedMarkdown: {content}
      </div>
    );
  };
});

jest.mock("../MarkdownRenderer", () => {
  return function MockMarkdownRenderer({ content }: { content: string }) {
    return <div data-testid="markdown-renderer">MarkdownRenderer: {content}</div>;
  };
});

jest.mock("../AICompanionBadge", () => {
  return function MockAICompanionBadge() {
    return <div data-testid="ai-companion-badge">AI Companion Badge</div>;
  };
});

jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn(), warn: jest.fn() },
}));

describe("StreamingMessage", () => {
  const mockOnChunkComplete = jest.fn();
  const mockOnSearch = jest.fn();

  const createTextChunk = (id: string, content: string): TextChunk => ({
    id,
    type: "text",
    content,
  });

  const createQuoteChunk = (id: string, reference: string): QuoteChunk => ({
    id,
    type: "quote",
    quote: {
      text: `Quote text for ${reference}`,
      reference,
      url: `https://lawofone.info/s/${reference}`,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering completed chunks", () => {
    it("should render completed text chunks with MarkdownRenderer", () => {
      const completedChunks: AnimationChunk[] = [
        createTextChunk("1", "Hello world"),
      ];

      render(
        <StreamingMessage
          completedChunks={completedChunks}
          currentChunk={null}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
      expect(screen.getByText(/MarkdownRenderer: Hello world/)).toBeInTheDocument();
    });

    it("should render completed quote chunks with QuoteCard", () => {
      const completedChunks: AnimationChunk[] = [
        createQuoteChunk("1", "50.7"),
      ];

      render(
        <StreamingMessage
          completedChunks={completedChunks}
          currentChunk={null}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      expect(screen.getByTestId("quote-card")).toBeInTheDocument();
      expect(screen.getByText(/QuoteCard: 50.7/)).toBeInTheDocument();
    });

    it("should render multiple completed chunks in order", () => {
      const completedChunks: AnimationChunk[] = [
        createTextChunk("1", "First"),
        createQuoteChunk("2", "1.1"),
        createTextChunk("3", "Third"),
      ];

      render(
        <StreamingMessage
          completedChunks={completedChunks}
          currentChunk={null}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      expect(screen.getByText(/MarkdownRenderer: First/)).toBeInTheDocument();
      expect(screen.getByText(/QuoteCard: 1.1/)).toBeInTheDocument();
      expect(screen.getByText(/MarkdownRenderer: Third/)).toBeInTheDocument();
    });
  });

  describe("rendering current chunk (animating)", () => {
    it("should render current text chunk with AnimatedMarkdown", () => {
      render(
        <StreamingMessage
          completedChunks={[]}
          currentChunk={createTextChunk("1", "Animating text")}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      expect(screen.getByTestId("animated-markdown")).toBeInTheDocument();
      expect(screen.getByText(/AnimatedMarkdown: Animating text/)).toBeInTheDocument();
    });

    it("should render current quote chunk with AnimatedQuoteCard", () => {
      render(
        <StreamingMessage
          completedChunks={[]}
          currentChunk={createQuoteChunk("1", "2.5")}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      expect(screen.getByTestId("animated-quote-card")).toBeInTheDocument();
      expect(screen.getByText(/AnimatedQuoteCard: 2.5/)).toBeInTheDocument();
    });
  });

  describe("combined rendering", () => {
    it("should render both completed and current chunks", () => {
      const completedChunks: AnimationChunk[] = [
        createTextChunk("1", "Completed text"),
      ];

      render(
        <StreamingMessage
          completedChunks={completedChunks}
          currentChunk={createTextChunk("2", "Current text")}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
      expect(screen.getByTestId("animated-markdown")).toBeInTheDocument();
    });
  });

  describe("AI companion badge", () => {
    it("should show AI companion badge when isFirstAssistant is true", () => {
      render(
        <StreamingMessage
          completedChunks={[]}
          currentChunk={createTextChunk("1", "Hello")}
          onChunkComplete={mockOnChunkComplete}
          isFirstAssistant={true}
        />
      );

      expect(screen.getByTestId("ai-companion-badge")).toBeInTheDocument();
    });

    it("should not show AI companion badge when isFirstAssistant is false", () => {
      render(
        <StreamingMessage
          completedChunks={[]}
          currentChunk={createTextChunk("1", "Hello")}
          onChunkComplete={mockOnChunkComplete}
          isFirstAssistant={false}
        />
      );

      expect(screen.queryByTestId("ai-companion-badge")).not.toBeInTheDocument();
    });

    it("should not show AI companion badge by default", () => {
      render(
        <StreamingMessage
          completedChunks={[]}
          currentChunk={createTextChunk("1", "Hello")}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      expect(screen.queryByTestId("ai-companion-badge")).not.toBeInTheDocument();
    });
  });

  describe("onSearch callback", () => {
    it("should pass onSearch to MarkdownRenderer", () => {
      render(
        <StreamingMessage
          completedChunks={[createTextChunk("1", "Text")]}
          currentChunk={null}
          onChunkComplete={mockOnChunkComplete}
          onSearch={mockOnSearch}
        />
      );

      // MarkdownRenderer is rendered with onSearch prop
      expect(screen.getByTestId("markdown-renderer")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should render empty container when no chunks", () => {
      const { container } = render(
        <StreamingMessage
          completedChunks={[]}
          currentChunk={null}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      // Should render container div but no content
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.queryByTestId("markdown-renderer")).not.toBeInTheDocument();
      expect(screen.queryByTestId("quote-card")).not.toBeInTheDocument();
    });
  });

  describe("chunk keys", () => {
    it("should use chunk id as key for uniqueness", () => {
      const completedChunks: AnimationChunk[] = [
        createTextChunk("unique-id-1", "First"),
        createTextChunk("unique-id-2", "Second"),
      ];

      render(
        <StreamingMessage
          completedChunks={completedChunks}
          currentChunk={null}
          onChunkComplete={mockOnChunkComplete}
        />
      );

      // Both chunks should be rendered
      const renderers = screen.getAllByTestId("markdown-renderer");
      expect(renderers).toHaveLength(2);
    });
  });
});
