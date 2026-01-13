import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ChatInterface from "../ChatInterface";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  LayoutGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock child components
jest.mock("../MessageInput", () => {
  return function MockMessageInput({
    onSend,
    disabled,
    placeholder,
  }: {
    onSend: (msg: string) => void;
    disabled: boolean;
    placeholder: string;
  }) {
    return (
      <div data-testid="message-input">
        <input
          data-testid="input-field"
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value) {
              onSend(e.currentTarget.value);
            }
          }}
        />
        <button
          data-testid="send-button"
          disabled={disabled}
          onClick={() => {
            const input = document.querySelector('[data-testid="input-field"]') as HTMLInputElement;
            if (input?.value) onSend(input.value);
          }}
        >
          Send
        </button>
      </div>
    );
  };
});

jest.mock("../MessageList", () => {
  return function MockMessageList({
    messages,
    isStreaming,
  }: {
    messages: Array<{ content: string }>;
    isStreaming: boolean;
  }) {
    return (
      <div data-testid="message-list">
        {messages.map((m, i) => (
          <div key={i} data-testid="message">
            {m.content}
          </div>
        ))}
        {isStreaming && <div data-testid="streaming">Streaming...</div>}
      </div>
    );
  };
});

jest.mock("../WelcomeScreen", () => {
  return function MockWelcomeScreen({
    onSelectStarter,
    inputElement,
  }: {
    onSelectStarter: (starter: string) => void;
    inputElement: React.ReactNode;
  }) {
    return (
      <div data-testid="welcome-screen">
        <button
          data-testid="starter-button"
          onClick={() => onSelectStarter("What is the Law of One?")}
        >
          Starter
        </button>
        {inputElement}
      </div>
    );
  };
});

jest.mock("../GlobalPopover", () => {
  return function MockGlobalPopover() {
    return <div data-testid="global-popover">Popover</div>;
  };
});

// Mock hooks
const mockSendMessage = jest.fn();
const mockFinalizeMessage = jest.fn();
const mockResetChat = jest.fn();
const mockAddChunk = jest.fn();
const mockOnChunkComplete = jest.fn();
const mockResetQueue = jest.fn();

jest.mock("@/hooks/useChatStream", () => ({
  useChatStream: jest.fn(() => ({
    messages: [],
    isStreaming: false,
    streamDone: false,
    suggestions: [],
    sendMessage: mockSendMessage,
    finalizeMessage: mockFinalizeMessage,
    reset: mockResetChat,
    setMessages: jest.fn(),
  })),
}));

jest.mock("@/hooks/useAnimationQueue", () => ({
  useAnimationQueue: jest.fn(() => ({
    allChunks: [],
    completedChunks: [],
    currentChunk: null,
    isFullyComplete: false,
    isAnimating: false,
    queueLength: 0,
    onChunkComplete: mockOnChunkComplete,
    addChunk: mockAddChunk,
    reset: mockResetQueue,
  })),
}));

jest.mock("@/data/placeholders", () => ({
  getPlaceholder: jest.fn(() => "Ask about the Law of One..."),
  defaultPlaceholder: "Default placeholder",
}));

jest.mock("@/contexts/LanguageContext", () => ({
  useLanguage: jest.fn(() => ({
    language: "en",
    setLanguage: jest.fn(),
  })),
}));

import { useChatStream } from "@/hooks/useChatStream";
import { useAnimationQueue } from "@/hooks/useAnimationQueue";

const mockUseChatStream = useChatStream as jest.Mock;
const mockUseAnimationQueue = useAnimationQueue as jest.Mock;

describe("ChatInterface", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStream.mockReturnValue({
      messages: [],
      isStreaming: false,
      streamDone: false,
      suggestions: [],
      sendMessage: mockSendMessage,
      finalizeMessage: mockFinalizeMessage,
      reset: mockResetChat,
      setMessages: jest.fn(),
    });
    mockUseAnimationQueue.mockReturnValue({
      allChunks: [],
      completedChunks: [],
      currentChunk: null,
      isFullyComplete: false,
      isAnimating: false,
      queueLength: 0,
      onChunkComplete: mockOnChunkComplete,
      addChunk: mockAddChunk,
      reset: mockResetQueue,
    });
  });

  describe("initial render", () => {
    it("should render welcome screen when no conversation", () => {
      render(<ChatInterface />);

      expect(screen.getByTestId("welcome-screen")).toBeInTheDocument();
    });

    it("should render global popover", () => {
      render(<ChatInterface />);

      expect(screen.getByTestId("global-popover")).toBeInTheDocument();
    });

    it("should render message input in welcome screen", () => {
      render(<ChatInterface />);

      expect(screen.getByTestId("message-input")).toBeInTheDocument();
    });
  });

  describe("conversation mode", () => {
    it("should show message list when messages exist", () => {
      mockUseChatStream.mockReturnValue({
        messages: [{ content: "Hello", role: "user" }],
        isStreaming: false,
        streamDone: false,
        suggestions: [],
        sendMessage: mockSendMessage,
        finalizeMessage: mockFinalizeMessage,
        reset: mockResetChat,
        setMessages: jest.fn(),
      });

      render(<ChatInterface />);

      expect(screen.getByTestId("message-list")).toBeInTheDocument();
      expect(screen.queryByTestId("welcome-screen")).not.toBeInTheDocument();
    });

    it("should show message list when chunks exist", () => {
      mockUseAnimationQueue.mockReturnValue({
        allChunks: [{ id: "1", type: "text", content: "Hello" }],
        completedChunks: [],
        currentChunk: null,
        isFullyComplete: false,
        isAnimating: false,
        queueLength: 0,
        onChunkComplete: mockOnChunkComplete,
        addChunk: mockAddChunk,
        reset: mockResetQueue,
      });

      render(<ChatInterface />);

      expect(screen.getByTestId("message-list")).toBeInTheDocument();
    });
  });

  describe("sending messages", () => {
    it("should call sendMessage when starter is clicked", async () => {
      render(<ChatInterface />);

      fireEvent.click(screen.getByTestId("starter-button"));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          "What is the Law of One?",
          expect.any(Function),
          false, // thinkingMode defaults to false
          "en" // language defaults to English from mock
        );
      });
    });

    it("should reset queue before sending", async () => {
      render(<ChatInterface />);

      fireEvent.click(screen.getByTestId("starter-button"));

      await waitFor(() => {
        expect(mockResetQueue).toHaveBeenCalled();
      });
    });
  });

  describe("streaming state", () => {
    it("should disable input while streaming", () => {
      mockUseChatStream.mockReturnValue({
        messages: [{ content: "Hello", role: "user" }],
        isStreaming: true,
        streamDone: false,
        suggestions: [],
        sendMessage: mockSendMessage,
        finalizeMessage: mockFinalizeMessage,
        reset: mockResetChat,
        setMessages: jest.fn(),
      });

      render(<ChatInterface />);

      expect(screen.getByTestId("input-field")).toBeDisabled();
    });
  });

  describe("message finalization", () => {
    it("should finalize message when stream done and animations complete", () => {
      const allChunks = [{ id: "1", type: "text", content: "Response" }];

      mockUseChatStream.mockReturnValue({
        messages: [{ content: "Hello", role: "user" }],
        isStreaming: false,
        streamDone: true,
        suggestions: [],
        sendMessage: mockSendMessage,
        finalizeMessage: mockFinalizeMessage,
        reset: mockResetChat,
        setMessages: jest.fn(),
      });

      mockUseAnimationQueue.mockReturnValue({
        allChunks,
        completedChunks: allChunks,
        currentChunk: null,
        isFullyComplete: true,
        isAnimating: false,
        queueLength: 0,
        onChunkComplete: mockOnChunkComplete,
        addChunk: mockAddChunk,
        reset: mockResetQueue,
      });

      render(<ChatInterface />);

      expect(mockFinalizeMessage).toHaveBeenCalledWith(allChunks);
    });

    it("should not finalize if stream not done", () => {
      mockUseChatStream.mockReturnValue({
        messages: [],
        isStreaming: true,
        streamDone: false,
        suggestions: [],
        sendMessage: mockSendMessage,
        finalizeMessage: mockFinalizeMessage,
        reset: mockResetChat,
        setMessages: jest.fn(),
      });

      mockUseAnimationQueue.mockReturnValue({
        allChunks: [],
        completedChunks: [],
        currentChunk: null,
        isFullyComplete: true,
        isAnimating: false,
        queueLength: 0,
        onChunkComplete: mockOnChunkComplete,
        addChunk: mockAddChunk,
        reset: mockResetQueue,
      });

      render(<ChatInterface />);

      expect(mockFinalizeMessage).not.toHaveBeenCalled();
    });

    it("should not finalize if animations not complete", () => {
      mockUseChatStream.mockReturnValue({
        messages: [],
        isStreaming: false,
        streamDone: true,
        suggestions: [],
        sendMessage: mockSendMessage,
        finalizeMessage: mockFinalizeMessage,
        reset: mockResetChat,
        setMessages: jest.fn(),
      });

      mockUseAnimationQueue.mockReturnValue({
        allChunks: [],
        completedChunks: [],
        currentChunk: { id: "1", type: "text", content: "Still animating" },
        isFullyComplete: false,
        isAnimating: true,
        queueLength: 0,
        onChunkComplete: mockOnChunkComplete,
        addChunk: mockAddChunk,
        reset: mockResetQueue,
      });

      render(<ChatInterface />);

      expect(mockFinalizeMessage).not.toHaveBeenCalled();
    });
  });

  describe("ref methods", () => {
    it("should expose reset method via ref", () => {
      const ref = { current: null as { reset: () => void } | null };

      render(<ChatInterface ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.reset).toBe("function");
    });

    it("should reset both chat and queue when reset is called", () => {
      const ref = { current: null as { reset: () => void } | null };

      render(<ChatInterface ref={ref} />);

      act(() => {
        ref.current?.reset();
      });

      expect(mockResetChat).toHaveBeenCalled();
      expect(mockResetQueue).toHaveBeenCalled();
    });
  });
});
