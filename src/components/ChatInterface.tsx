"use client";

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef, startTransition } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useTranslations } from "next-intl";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import WelcomeScreen from "./WelcomeScreen";
import GlobalPopover from "./GlobalPopover";
import { useAnimationQueue } from "@/hooks/useAnimationQueue";
import { useChatStream } from "@/hooks/useChatStream";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Message, MessageSegment } from "@/lib/types";
import { STREAM_RECOVERY_CONFIG } from "@/lib/config";

const INITIAL_PLACEHOLDER_COUNT = 4;
const FOLLOWUP_PLACEHOLDER_COUNT = 6;

export interface ChatInterfaceRef {
  reset: () => void;
  getMessages: () => Message[];
}

export interface ChatInterfaceProps {
  /** Callback fired when message count changes */
  onMessagesChange?: (count: number) => void;
  /** Callback fired when streaming state changes */
  onStreamingChange?: (isStreaming: boolean) => void;
  /** Initial query to send automatically */
  initialQuery?: string;
}

/**
 * Main chat interface component that orchestrates the conversation UI.
 *
 * Responsibilities:
 * - Layout and visual structure
 * - Scroll management
 * - Animation coordination between stream and display
 * - Welcome screen / conversation mode transitions
 *
 * Delegates to:
 * - useChatStream: Message state, API communication, SSE parsing
 * - useAnimationQueue: Chunk animation sequencing
 * - MessageList: Rendering messages and streaming content
 */
const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(function ChatInterface(
  { onMessagesChange, onStreamingChange, initialQuery },
  ref
) {
  const t = useTranslations("chat");
  const [placeholderKey, setPlaceholderKey] = useState("1");
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  // Use ref to track initial query sent (avoids StrictMode double-send)
  const initialQuerySentRef = useRef(false);

  // Get current language setting
  const { language } = useLanguage();

  // Helper to get random placeholder key
  const getRandomPlaceholderKey = useCallback((forFollowUp: boolean) => {
    const count = forFollowUp ? FOLLOWUP_PLACEHOLDER_COUNT : INITIAL_PLACEHOLDER_COUNT;
    return String(Math.floor(Math.random() * count) + 1);
  }, []);

  // Randomize placeholder after hydration (client-side only)
  useEffect(() => {
    setPlaceholderKey(getRandomPlaceholderKey(false));
  }, [getRandomPlaceholderKey]);

  // Get the translated placeholder
  const placeholder = isFollowUp
    ? t(`followUpPlaceholders.${placeholderKey}`)
    : t(`initialPlaceholders.${placeholderKey}`);

  // Chat stream management
  const {
    messages,
    isStreaming,
    streamDone,
    suggestions,
    sendMessage,
    finalizeMessage,
    reset: resetChat,
  } = useChatStream((depth) => {
    const forFollowUp = depth > 0;
    setIsFollowUp(forFollowUp);
    setPlaceholderKey(getRandomPlaceholderKey(forFollowUp));
  });

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
    forceFinalize,
    reset: resetQueue,
  } = useAnimationQueue();

  // Scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  // Scroll shadow state
  const [scrollShadow, setScrollShadow] = useState({ top: false, bottom: false });

  // Handle scroll to update shadows - wrapped in startTransition for non-blocking UI
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollable = scrollHeight > clientHeight;
    const atTop = scrollTop <= 10;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    // Use startTransition to mark shadow updates as non-urgent
    // This prevents scroll tracking from blocking user input
    startTransition(() => {
      setScrollShadow({
        top: isScrollable && !atTop,
        bottom: isScrollable && !atBottom,
      });
    });
  }, []);

  // Set up scroll listener with passive option for better scroll performance
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    scrollAnchorRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Handle sending a message
  const handleSend = useCallback(
    async (content: string) => {
      resetQueue();
      setTimeout(() => scrollToBottom("smooth"), 50);
      await sendMessage(content, addChunk, thinkingMode, language);
    },
    [sendMessage, addChunk, resetQueue, scrollToBottom, thinkingMode, language]
  );

  // Finalize message when stream is done AND all animations are complete
  useEffect(() => {
    if (streamDone && isFullyComplete) {
      finalizeMessage(allChunks);
      resetQueue();
    }
  }, [streamDone, isFullyComplete, allChunks, finalizeMessage, resetQueue]);

  // Force-finalize stalled animation queue (e.g., mobile app backgrounded and resumed)
  useEffect(() => {
    if (streamDone && !isFullyComplete) {
      const timeout = setTimeout(() => {
        forceFinalize();
      }, STREAM_RECOVERY_CONFIG.forceFinalizeDelayMs);
      return () => clearTimeout(timeout);
    }
  }, [streamDone, isFullyComplete, forceFinalize]);

  // Auto-send initial query if provided (e.g., from search "Ask about this")
  useEffect(() => {
    if (initialQuery && !initialQuerySentRef.current && !isStreaming) {
      initialQuerySentRef.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery, isStreaming, handleSend]);

  // Reset handler
  const handleReset = useCallback(() => {
    resetChat();
    resetQueue();
    setIsFollowUp(false);
    setPlaceholderKey(getRandomPlaceholderKey(false));
  }, [resetChat, resetQueue, getRandomPlaceholderKey]);

  // Expose reset and getMessages to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      reset: handleReset,
      getMessages: () => {
        if (allChunks.length === 0) return messages;

        // Guard against duplicates: if the last message is already a finalized
        // assistant message, chunks are stale (about to be reset)
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "assistant") return messages;

        // Include pending/in-progress chunks as an assistant message
        const segments: MessageSegment[] = allChunks.map((chunk) => {
          if (chunk.type === "text") {
            return { type: "text" as const, content: chunk.content };
          }
          return { type: "quote" as const, quote: chunk.quote };
        });

        const pendingAssistant: Message = {
          id: "export-pending",
          role: "assistant",
          content: segments
            .filter((s) => s.type === "text")
            .map((s) => s.content)
            .join(""),
          segments,
          timestamp: new Date(),
        };

        return [...messages, pendingAssistant];
      },
    }),
    [handleReset, messages, allChunks]
  );

  const hasConversation = messages.length > 0 || allChunks.length > 0;

  // Notify parent of message count changes
  useEffect(() => {
    onMessagesChange?.(messages.length);
  }, [messages.length, onMessagesChange]);

  // Notify parent of streaming state changes
  useEffect(() => {
    onStreamingChange?.(isStreaming);
  }, [isStreaming, onStreamingChange]);

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
      <GlobalPopover />
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
                  className="h-full flex flex-col"
                >
                  <WelcomeScreen
                    onSelectStarter={handleSend}
                    inputElement={inputElement}
                    thinkingMode={thinkingMode}
                    onThinkingModeChange={setThinkingMode}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="max-w-3xl mx-auto min-h-full flex flex-col"
                >
                  <MessageList
                    messages={messages}
                    completedChunks={completedChunks}
                    currentChunk={currentChunk}
                    isStreaming={isStreaming}
                    isAnimating={isAnimating}
                    queueLength={queueLength}
                    streamDone={streamDone}
                    suggestions={suggestions}
                    onChunkComplete={onChunkComplete}
                    onSearch={handleSend}
                  />
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
