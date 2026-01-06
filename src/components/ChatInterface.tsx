"use client";

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import WelcomeScreen from "./WelcomeScreen";
import OnboardingModal from "./OnboardingModal";
import GlobalPopover from "./GlobalPopover";
import { useAnimationQueue } from "@/hooks/useAnimationQueue";
import { useChatStream } from "@/hooks/useChatStream";
import { getPlaceholder, defaultPlaceholder } from "@/data/placeholders";

export interface ChatInterfaceRef {
  reset: () => void;
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
const ChatInterface = forwardRef<ChatInterfaceRef>(function ChatInterface(_, ref) {
  const [placeholder, setPlaceholder] = useState(defaultPlaceholder);

  // Randomize placeholder after hydration (client-side only)
  useEffect(() => {
    setPlaceholder(getPlaceholder(0));
  }, []);

  // Chat stream management
  const {
    messages,
    isStreaming,
    streamDone,
    suggestions,
    sendMessage,
    finalizeMessage,
    reset: resetChat,
  } = useChatStream((depth) => setPlaceholder(getPlaceholder(depth)));

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
      await sendMessage(content, addChunk);
    },
    [sendMessage, addChunk, resetQueue, scrollToBottom]
  );

  // Finalize message when stream is done AND all animations are complete
  useEffect(() => {
    if (streamDone && isFullyComplete) {
      finalizeMessage(allChunks);
      resetQueue();
    }
  }, [streamDone, isFullyComplete, allChunks, finalizeMessage, resetQueue]);

  // Reset handler
  const handleReset = useCallback(() => {
    resetChat();
    resetQueue();
    setPlaceholder(getPlaceholder(0));
  }, [resetChat, resetQueue]);

  // Expose reset function to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      reset: handleReset,
    }),
    [handleReset]
  );

  const hasConversation = messages.length > 0 || allChunks.length > 0;

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
      <OnboardingModal />
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
