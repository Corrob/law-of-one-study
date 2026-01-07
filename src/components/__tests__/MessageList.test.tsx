import { render, screen } from "@testing-library/react";
import MessageList from "../MessageList";
import { Message as MessageType, AnimationChunk } from "@/lib/types";

// Mock child components
jest.mock("../Message", () => {
  return function MockMessage({ message, suggestions, isFirstAssistant }: {
    message: MessageType;
    suggestions?: string[];
    isFirstAssistant?: boolean;
  }) {
    return (
      <div data-testid={`message-${message.id}`}>
        <span data-testid="role">{message.role}</span>
        <span data-testid="content">{message.content}</span>
        {suggestions && <span data-testid="suggestions">{suggestions.join(",")}</span>}
        {isFirstAssistant && <span data-testid="first-assistant">first</span>}
      </div>
    );
  };
});

jest.mock("../StreamingMessage", () => {
  return function MockStreamingMessage({ isFirstAssistant }: { isFirstAssistant?: boolean }) {
    return (
      <div data-testid="streaming-message">
        {isFirstAssistant && <span data-testid="streaming-first-assistant">first</span>}
      </div>
    );
  };
});

jest.mock("../ThinkingIndicator", () => {
  return function MockThinkingIndicator() {
    return <div data-testid="thinking-indicator">Thinking...</div>;
  };
});

jest.mock("../AICompanionBadge", () => {
  return function MockAICompanionBadge() {
    return <div data-testid="ai-badge">AI Badge</div>;
  };
});

describe("MessageList", () => {
  const defaultProps = {
    messages: [],
    completedChunks: [],
    currentChunk: null,
    isStreaming: false,
    isAnimating: false,
    queueLength: 0,
    streamDone: false,
    suggestions: [],
    onChunkComplete: jest.fn(),
    onSearch: jest.fn(),
  };

  const createMessage = (id: string, role: "user" | "assistant", content: string): MessageType => ({
    id,
    role,
    content,
  });

  describe("rendering messages", () => {
    it("should render empty list when no messages", () => {
      render(<MessageList {...defaultProps} />);

      expect(screen.queryByTestId(/message-/)).not.toBeInTheDocument();
    });

    it("should render all messages", () => {
      const messages = [
        createMessage("1", "user", "Hello"),
        createMessage("2", "assistant", "Hi there"),
        createMessage("3", "user", "How are you?"),
      ];

      render(<MessageList {...defaultProps} messages={messages} />);

      expect(screen.getByTestId("message-1")).toBeInTheDocument();
      expect(screen.getByTestId("message-2")).toBeInTheDocument();
      expect(screen.getByTestId("message-3")).toBeInTheDocument();
    });

    it("should pass suggestions only to last assistant message when not streaming", () => {
      const messages = [
        createMessage("1", "user", "Hello"),
        createMessage("2", "assistant", "Response 1"),
        createMessage("3", "user", "Follow up"),
        createMessage("4", "assistant", "Response 2"),
      ];
      const suggestions = ["Suggestion 1", "Suggestion 2"];

      render(
        <MessageList
          {...defaultProps}
          messages={messages}
          suggestions={suggestions}
          isStreaming={false}
        />
      );

      // Only last assistant message should have suggestions
      const suggestionsElements = screen.getAllByTestId("suggestions");
      expect(suggestionsElements).toHaveLength(1);
      expect(suggestionsElements[0]).toHaveTextContent("Suggestion 1,Suggestion 2");
    });

    it("should not show suggestions when streaming", () => {
      const messages = [
        createMessage("1", "user", "Hello"),
        createMessage("2", "assistant", "Response"),
      ];

      render(
        <MessageList
          {...defaultProps}
          messages={messages}
          suggestions={["Suggestion"]}
          isStreaming={true}
        />
      );

      expect(screen.queryByTestId("suggestions")).not.toBeInTheDocument();
    });

    it("should mark first assistant message", () => {
      const messages = [
        createMessage("1", "user", "Hello"),
        createMessage("2", "assistant", "First response"),
        createMessage("3", "user", "Follow up"),
        createMessage("4", "assistant", "Second response"),
      ];

      render(<MessageList {...defaultProps} messages={messages} />);

      // Only first assistant should be marked
      const firstAssistantMarkers = screen.getAllByTestId("first-assistant");
      expect(firstAssistantMarkers).toHaveLength(1);
    });
  });

  describe("streaming content", () => {
    it("should show streaming message when there are completed chunks", () => {
      const completedChunks: AnimationChunk[] = [
        { id: "chunk-1", type: "text", content: "Hello" },
      ];

      render(
        <MessageList
          {...defaultProps}
          completedChunks={completedChunks}
          isStreaming={true}
        />
      );

      expect(screen.getByTestId("streaming-message")).toBeInTheDocument();
    });

    it("should show streaming message when there is a current chunk", () => {
      const currentChunk: AnimationChunk = { id: "chunk-1", type: "text", content: "Hi" };

      render(
        <MessageList
          {...defaultProps}
          currentChunk={currentChunk}
          isStreaming={true}
        />
      );

      expect(screen.getByTestId("streaming-message")).toBeInTheDocument();
    });

    it("should mark streaming message as first assistant when no prior assistant messages", () => {
      const messages = [createMessage("1", "user", "Hello")];
      const completedChunks: AnimationChunk[] = [
        { id: "chunk-1", type: "text", content: "Response" },
      ];

      render(
        <MessageList
          {...defaultProps}
          messages={messages}
          completedChunks={completedChunks}
          isStreaming={true}
        />
      );

      expect(screen.getByTestId("streaming-first-assistant")).toBeInTheDocument();
    });
  });

  describe("thinking indicator", () => {
    it("should show thinking indicator when streaming with no content", () => {
      render(
        <MessageList
          {...defaultProps}
          isStreaming={true}
        />
      );

      expect(screen.getByTestId("thinking-indicator")).toBeInTheDocument();
    });

    it("should show AI badge with thinking indicator when no assistant messages yet", () => {
      const messages = [createMessage("1", "user", "Hello")];

      render(
        <MessageList
          {...defaultProps}
          messages={messages}
          isStreaming={true}
        />
      );

      expect(screen.getByTestId("ai-badge")).toBeInTheDocument();
      expect(screen.getByTestId("thinking-indicator")).toBeInTheDocument();
    });

    it("should not show thinking indicator when streaming content exists", () => {
      const completedChunks: AnimationChunk[] = [
        { id: "chunk-1", type: "text", content: "Content" },
      ];

      render(
        <MessageList
          {...defaultProps}
          completedChunks={completedChunks}
          isStreaming={true}
          isAnimating={true}
        />
      );

      expect(screen.queryByTestId("thinking-indicator")).not.toBeInTheDocument();
    });

    it("should not show thinking indicator when not streaming", () => {
      render(<MessageList {...defaultProps} isStreaming={false} />);

      expect(screen.queryByTestId("thinking-indicator")).not.toBeInTheDocument();
    });
  });
});
