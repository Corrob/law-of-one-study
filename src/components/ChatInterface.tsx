"use client";

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Message as MessageType, MessageSegment } from "@/lib/types";
import Message from "./Message";
import StreamingMessage from "./StreamingMessage";
import MessageInput from "./MessageInput";
import WelcomeScreen from "./WelcomeScreen";
import ThinkingIndicator from "./ThinkingIndicator";
import { useAnimationQueue } from "@/hooks/useAnimationQueue";
import { getPlaceholder, defaultPlaceholder } from "@/data/placeholders";
import { analytics } from "@/lib/analytics";

// Maximum number of messages to keep in memory (prevents unbounded growth)
const MAX_CONVERSATION_HISTORY = 30;

export interface ChatInterfaceRef {
  reset: () => void;
}

interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

// Parse SSE buffer into events
function parseSSE(buffer: string): { events: SSEEvent[]; remaining: string } {
  const events: SSEEvent[] = [];
  const parts = buffer.split("\n\n");

  // Last part might be incomplete
  const remaining = buffer.endsWith("\n\n") ? "" : parts.pop() || "";

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");
    let type = "";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) type = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (type && data) {
      try {
        events.push({ type, data: JSON.parse(data) });
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { events, remaining };
}

const ChatInterface = forwardRef<ChatInterfaceRef>(function ChatInterface(_, ref) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [placeholder, setPlaceholder] = useState(defaultPlaceholder);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Randomize placeholder after hydration (client-side only)
  useEffect(() => {
    setPlaceholder(getPlaceholder(0));
  }, []);

  // Animation queue for streaming messages
  const {
    allChunks,
    completedChunks,
    currentChunk,
    isFullyComplete,
    isAnimating,
    queueLength,
    onChunkComplete,
    addChunk,
    reset: resetQueue,
  } = useAnimationQueue();

  // Scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Scroll shadow state
  const [scrollShadow, setScrollShadow] = useState({ top: false, bottom: false });

  // Handle scroll to update shadows
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollable = scrollHeight > clientHeight;
    const atTop = scrollTop <= 10;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    setScrollShadow({
      top: isScrollable && !atTop,
      bottom: isScrollable && !atBottom,
    });
  }, []);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to bottom - only called when user sends a message
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    scrollAnchorRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const handleSend = async (content: string) => {
    const requestStartTime = Date.now();

    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    // Track question submission
    const containsQuotedText =
      /["'].*["']/.test(content) || content.toLowerCase().includes("quote");
    const isFollowUp = messages.length > 0;
    analytics.questionSubmitted({
      messageLength: content.length,
      containsQuotedText,
      isFollowUp,
      conversationDepth: messages.length,
    });

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      // Limit conversation history to prevent unbounded memory growth
      if (updated.length > MAX_CONVERSATION_HISTORY) {
        return updated.slice(-MAX_CONVERSATION_HISTORY);
      }
      return updated;
    });
    setIsStreaming(true);
    setStreamDone(false);
    setSuggestions([]); // Clear previous suggestions
    resetQueue();

    // Scroll to bottom when user sends message (moves their message to top)
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
            quotesUsed: m.segments
              ?.filter((s) => s.type === "quote")
              .map((s) => (s.type === "quote" ? s.quote.reference : null))
              .filter(Boolean),
          })),
        }),
      });

      if (!response.ok) {
        // Parse error response for user-friendly messages
        let errorMessage = "Failed to get response";
        let errorType: "rate_limit" | "validation" | "api_error" = "api_error";
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          // Special handling for rate limiting
          if (response.status === 429 && errorData.retryAfter) {
            errorMessage = `${errorData.error} Please wait ${errorData.retryAfter} seconds.`;
            errorType = "rate_limit";
          } else if (response.status === 400) {
            errorType = "validation";
          }
        } catch {
          // If JSON parsing fails, use generic message
        }

        // Track error
        analytics.error({
          errorType,
          errorMessage,
          context: { status: response.status },
        });

        throw new Error(errorMessage);
      }

      // Track streaming started
      analytics.streamingStarted({ isQuoteSearch: containsQuotedText });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";
      let chunkIdCounter = 0;
      let quoteCount = 0;
      let responseLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSE(buffer);
        buffer = remaining;

        for (const event of events) {
          console.log("[ChatInterface] SSE event received:", { type: event.type, dataKeys: Object.keys(event.data) });

          if (event.type === "meta") {
            // Meta event received with quotes data - currently unused but may be needed in future
          } else if (event.type === "chunk") {
            const chunkData = event.data as {
              type: "text" | "quote";
              content?: string;
              text?: string;
              reference?: string;
              url?: string;
            };
            chunkIdCounter++;

            console.log("[ChatInterface] Chunk data:", {
              type: chunkData.type,
              hasContent: !!chunkData.content,
              hasText: !!chunkData.text,
              hasReference: !!chunkData.reference,
              hasUrl: !!chunkData.url,
              textLength: chunkData.text?.length || chunkData.content?.length,
            });

            if (chunkData.type === "text" && chunkData.content) {
              responseLength += chunkData.content.length;
              addChunk({
                id: `chunk-${chunkIdCounter}`,
                type: "text",
                content: chunkData.content,
              });
            } else if (
              chunkData.type === "quote" &&
              chunkData.text &&
              chunkData.reference &&
              chunkData.url
            ) {
              // Backend now sends fully processed quote with filtered text
              console.log("[ChatInterface] Received quote chunk:", {
                reference: chunkData.reference,
                textLength: chunkData.text.length,
              });
              quoteCount++;
              addChunk({
                id: `chunk-${chunkIdCounter}`,
                type: "quote",
                quote: {
                  text: chunkData.text,
                  reference: chunkData.reference,
                  url: chunkData.url,
                },
              });
            } else {
              console.warn("[ChatInterface] Chunk ignored - conditions not met:", chunkData);
            }
          } else if (event.type === "suggestions") {
            // Handle follow-up suggestions
            const suggestionsData = event.data as { items?: string[] };
            if (Array.isArray(suggestionsData.items)) {
              setSuggestions(suggestionsData.items);
            }
          } else if (event.type === "done") {
            // Mark stream as done - message will be finalized when animation completes
            setStreamDone(true);

            // Track response complete
            const responseTimeMs = Date.now() - requestStartTime;
            analytics.responseComplete({
              responseTimeMs,
              quoteCount,
              messageLength: responseLength,
              isQuoteSearch: containsQuotedText,
            });
          } else if (event.type === "error") {
            throw new Error(event.data.message as string);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

      // Extract error message - show specific validation errors to user
      let errorText = "I apologize, but I encountered an error. Please try again.";
      let errorType: "rate_limit" | "validation" | "api_error" | "streaming_error" =
        "streaming_error";
      if (error instanceof Error && error.message) {
        // Show validation errors and rate limit errors directly to user
        if (
          error.message.includes("Maximum") ||
          error.message.includes("too long") ||
          error.message.includes("Too many requests") ||
          error.message.includes("required")
        ) {
          errorText = error.message;
          if (error.message.includes("Too many requests")) {
            errorType = "rate_limit";
          } else {
            errorType = "validation";
          }
        }
      }

      // Track error if not already tracked
      analytics.error({
        errorType,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      resetQueue();
      setIsStreaming(false);
    }
  };

  // Finalize message when stream is done AND all animations are complete
  useEffect(() => {
    if (streamDone && isFullyComplete) {
      // Convert chunks to segments for the final message
      const segments: MessageSegment[] = allChunks.map((chunk) => {
        if (chunk.type === "text") {
          return { type: "text" as const, content: chunk.content };
        } else {
          return { type: "quote" as const, quote: chunk.quote };
        }
      });

      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: segments
          .filter((s) => s.type === "text")
          .map((s) => (s as { type: "text"; content: string }).content)
          .join(""),
        segments,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        // Limit conversation history to prevent unbounded memory growth
        const limited =
          updated.length > MAX_CONVERSATION_HISTORY
            ? updated.slice(-MAX_CONVERSATION_HISTORY)
            : updated;
        // Update placeholder for next message
        setPlaceholder(getPlaceholder(limited.length));
        return limited;
      });
      resetQueue();
      setStreamDone(false);
      setIsStreaming(false);
    }
  }, [streamDone, isFullyComplete, allChunks, resetQueue]);

  const handleReset = useCallback(() => {
    setMessages([]);
    resetQueue();
    setStreamDone(false);
    setIsStreaming(false);
    setSuggestions([]);
    setPlaceholder(getPlaceholder(0));
  }, [resetQueue]);

  // Expose reset function to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      reset: handleReset,
    }),
    [handleReset]
  );

  const hasConversation = messages.length > 0 || allChunks.length > 0;
  const hasStreamingContent = completedChunks.length > 0 || currentChunk !== null;
  // Show loading dots when: streaming with no content yet, OR waiting for more chunks
  const showLoadingDots =
    isStreaming && (!hasStreamingContent || (!isAnimating && queueLength === 0 && !streamDone));

  // Build scroll shadow classes
  const scrollShadowClasses = [
    "scroll-shadow-container",
    scrollShadow.top ? "shadow-top" : "",
    scrollShadow.bottom ? "shadow-bottom" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Input element with layoutId for shared element animation
  const inputElement = (
    <motion.div layoutId="chat-input" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <MessageInput onSend={handleSend} disabled={isStreaming} placeholder={placeholder} />
    </motion.div>
  );

  return (
    <LayoutGroup>
      <div className="flex flex-col h-full relative">
        {/* Starfield - only on welcome screen */}
        <AnimatePresence>
          {!hasConversation && (
            <motion.div
              className="starfield"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>

        {/* Messages Area with scroll shadows */}
        <div
          className={`flex-1 overflow-hidden relative z-10 ${hasConversation ? scrollShadowClasses : ""}`}
        >
          <div ref={scrollContainerRef} className="h-full chat-scroll px-4 py-6">
            <AnimatePresence mode="wait">
              {!hasConversation ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <WelcomeScreen onSelectStarter={handleSend} inputElement={inputElement} />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="max-w-3xl mx-auto min-h-full flex flex-col"
                >
                  {/* Messages container */}
                  <div>
                    {messages.map((message, index) => {
                      // Show suggestions only on the last assistant message when not streaming
                      const isLastAssistant =
                        message.role === "assistant" &&
                        index === messages.length - 1 &&
                        !isStreaming;
                      return (
                        <Message
                          key={message.id}
                          message={message}
                          onSearch={handleSend}
                          suggestions={isLastAssistant ? suggestions : undefined}
                        />
                      );
                    })}
                    {hasStreamingContent && (
                      <StreamingMessage
                        completedChunks={completedChunks}
                        currentChunk={currentChunk}
                        onChunkComplete={onChunkComplete}
                        onSearch={handleSend}
                      />
                    )}
                    {showLoadingDots && <ThinkingIndicator />}
                  </div>
                  {/* Flexible spacer - fills remaining space so messages stay near top */}
                  <div className="flex-grow min-h-[200px]" />
                  {/* Scroll anchor */}
                  <div ref={scrollAnchorRef} className="h-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area - Footer */}
        <div className="border-t border-[var(--lo1-celestial)]/20 bg-[var(--lo1-indigo)]/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Show input in footer when in conversation mode */}
            {hasConversation && inputElement}
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
});

export default ChatInterface;
