"use client";

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Message as MessageType, MessageSegment } from "@/lib/types";
import Message from "./Message";
import StreamingMessage from "./StreamingMessage";
import MessageInput from "./MessageInput";
import WelcomeScreen from "./WelcomeScreen";
import { useAnimationQueue } from "@/hooks/useAnimationQueue";
import { getPlaceholder, defaultPlaceholder } from "@/data/placeholders";
import { analytics } from "@/lib/analytics";
import { useSearchMode } from "@/contexts/SearchModeContext";

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
  const { mode } = useSearchMode();

  // DEBUG: Temporary visible debugging
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const addDebug = (msg: string) => {
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

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
    resetQueue();

    // Scroll to bottom when user sends message (moves their message to top)
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          searchMode: mode,
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

      // In explicit quote mode, accumulate all quotes then show at once
      const accumulatedQuotes: MessageSegment[] = [];
      const isQuoteOnlyMode = mode === "quote";

      addDebug(`Stream start: mode=${mode}, isQuoteOnlyMode=${isQuoteOnlyMode}`);
      console.log("[ChatInterface] Starting stream processing:", {
        mode,
        isQuoteOnlyMode,
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSE(buffer);
        buffer = remaining;

        addDebug(`Received ${events.length} events`);
        console.log("[ChatInterface] Received events:", events.length);

        for (const event of events) {
          addDebug(`Event: ${event.type}`);
          console.log("[ChatInterface] Processing event:", event.type, event.data);
          if (event.type === "meta") {
            // Meta event received with quotes data - currently unused but may be needed in future
            console.log("[ChatInterface] Meta event with quotes:", event.data);
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
              reference: chunkData.reference,
            });

            if (chunkData.type === "text" && chunkData.content) {
              responseLength += chunkData.content.length;
              if (!isQuoteOnlyMode) {
                addChunk({
                  id: `chunk-${chunkIdCounter}`,
                  type: "text",
                  content: chunkData.content,
                });
              } else {
                console.log("[ChatInterface] Skipping text chunk in quote-only mode");
              }
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

              const quoteSegment: MessageSegment = {
                type: "quote",
                quote: {
                  text: chunkData.text,
                  reference: chunkData.reference,
                  url: chunkData.url,
                },
              };

              if (isQuoteOnlyMode) {
                // Accumulate quotes for instant display
                addDebug(`Accumulating quote ${accumulatedQuotes.length + 1}: ${chunkData.reference}`);
                console.log("[ChatInterface] Accumulating quote for instant display");
                accumulatedQuotes.push(quoteSegment);
              } else {
                // Stream with animation
                console.log("[ChatInterface] Adding quote to animation queue");
                addChunk({
                  id: `chunk-${chunkIdCounter}`,
                  type: "quote",
                  quote: quoteSegment.quote,
                });
              }
            }
          } else if (event.type === "done") {
            addDebug(`Done event: quotes=${accumulatedQuotes.length}, isQuoteOnlyMode=${isQuoteOnlyMode}`);
            console.log("[ChatInterface] Done event received");
            // Track response complete
            const responseTimeMs = Date.now() - requestStartTime;
            analytics.responseComplete({
              responseTimeMs,
              quoteCount,
              messageLength: responseLength,
              isQuoteSearch: containsQuotedText,
            });

            // In quote-only mode, show all quotes immediately
            if (isQuoteOnlyMode && accumulatedQuotes.length > 0) {
              addDebug(`Creating message with ${accumulatedQuotes.length} quotes`);
              console.log(
                "[ChatInterface] Quote-only mode: Displaying accumulated quotes:",
                accumulatedQuotes.length
              );
              const assistantMessage: MessageType = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "",
                segments: accumulatedQuotes,
                timestamp: new Date(),
              };

              setMessages((prev) => {
                const updated = [...prev, assistantMessage];
                const limited =
                  updated.length > MAX_CONVERSATION_HISTORY
                    ? updated.slice(-MAX_CONVERSATION_HISTORY)
                    : updated;
                setPlaceholder(getPlaceholder(limited.length));
                return limited;
              });
              setIsStreaming(false);
              addDebug(`Message displayed! Total messages: ${messages.length + 1}`);
            } else {
              addDebug(`Using animation mode instead`);
              console.log("[ChatInterface] Marking stream as done for animation");
              // Mark stream as done - message will be finalized when animation completes
              setStreamDone(true);
            }
          } else if (event.type === "error") {
            console.error("[ChatInterface] Error event:", event.data);
            throw new Error(event.data.message as string);
          }
        }
      }
      console.log("[ChatInterface] Stream processing complete");
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
      <MessageInput
        onSend={handleSend}
        disabled={isStreaming}
        placeholder={placeholder}
        hasConversation={hasConversation}
      />
    </motion.div>
  );

  return (
    <LayoutGroup>
      <div className="flex flex-col h-full relative">
        {/* DEBUG PANEL - TEMPORARY */}
        {debugInfo.length > 0 && (
          <div className="fixed top-4 right-4 z-50 max-w-sm bg-black/90 text-green-400 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <strong>DEBUG LOG</strong>
              <button
                onClick={() => setDebugInfo([])}
                className="text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            </div>
            {debugInfo.map((msg, i) => (
              <div key={i} className="mb-1">{msg}</div>
            ))}
          </div>
        )}

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
                    {messages.map((message) => (
                      <Message key={message.id} message={message} onSearch={handleSend} />
                    ))}
                    {/* Mode Indicator Badge - shown when streaming in quote search mode */}
                    {isStreaming && mode === "quote" && !hasStreamingContent && (
                      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 w-fit">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 text-[var(--lo1-gold)]"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-[var(--lo1-gold)]">Searching quotes...</span>
                      </div>
                    )}
                    {hasStreamingContent && (
                      <>
                        {mode === "quote" && (
                          <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/20 w-fit">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3.5 h-3.5 text-[var(--lo1-gold)]"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs text-[var(--lo1-stardust)]">Quote Search Results</span>
                          </div>
                        )}
                        <StreamingMessage
                          completedChunks={completedChunks}
                          currentChunk={currentChunk}
                          onChunkComplete={onChunkComplete}
                          onSearch={handleSend}
                        />
                      </>
                    )}
                    {showLoadingDots && (
                      <div className="mb-6 flex gap-1">
                        <span
                          className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                    )}
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
