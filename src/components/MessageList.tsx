"use client";

import { Message as MessageType, AnimationChunk } from "@/lib/types";
import Message from "./Message";
import StreamingMessage from "./StreamingMessage";
import ThinkingIndicator from "./ThinkingIndicator";
import AICompanionBadge from "./AICompanionBadge";

interface MessageListProps {
  /** All completed messages in the conversation */
  messages: MessageType[];
  /** Chunks that have finished animating */
  completedChunks: AnimationChunk[];
  /** Currently animating chunk */
  currentChunk: AnimationChunk | null;
  /** Whether the stream is in progress */
  isStreaming: boolean;
  /** Whether there's an animation in progress */
  isAnimating: boolean;
  /** Number of chunks waiting in queue */
  queueLength: number;
  /** Whether the stream has finished sending data */
  streamDone: boolean;
  /** Follow-up suggestions to show */
  suggestions: string[];
  /** Callback when a chunk animation completes */
  onChunkComplete: () => void;
  /** Callback when user clicks a search term or suggestion */
  onSearch: (query: string) => void;
}

/**
 * Renders the list of chat messages including:
 * - Completed messages with suggestions
 * - Currently streaming message with animations
 * - Thinking indicator while waiting for content
 *
 * @example
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   completedChunks={completedChunks}
 *   currentChunk={currentChunk}
 *   isStreaming={isStreaming}
 *   onSearch={handleSend}
 *   // ...other props
 * />
 * ```
 */
export default function MessageList({
  messages,
  completedChunks,
  currentChunk,
  isStreaming,
  isAnimating,
  queueLength,
  streamDone,
  suggestions,
  onChunkComplete,
  onSearch,
}: MessageListProps) {
  const hasStreamingContent = completedChunks.length > 0 || currentChunk !== null;

  // Show loading dots when: streaming with no content yet, OR waiting for more chunks
  const showLoadingDots =
    isStreaming && (!hasStreamingContent || (!isAnimating && queueLength === 0 && !streamDone));

  // Check if there are any assistant messages yet
  const hasAssistantMessage = messages.some((m) => m.role === "assistant");

  return (
    <div>
      {messages.map((message, index) => {
        // Show suggestions only on the last assistant message when not streaming
        const isLastAssistant =
          message.role === "assistant" && index === messages.length - 1 && !isStreaming;
        // Show badge on first assistant message only
        const isFirstAssistant =
          message.role === "assistant" &&
          index === messages.findIndex((m) => m.role === "assistant");
        return (
          <Message
            key={message.id}
            message={message}
            onSearch={onSearch}
            suggestions={isLastAssistant ? suggestions : undefined}
            isFirstAssistant={isFirstAssistant}
          />
        );
      })}
      {hasStreamingContent && (
        <StreamingMessage
          completedChunks={completedChunks}
          currentChunk={currentChunk}
          onChunkComplete={onChunkComplete}
          onSearch={onSearch}
          isFirstAssistant={!hasAssistantMessage}
        />
      )}
      {showLoadingDots && (
        <div className="mb-6">
          {!hasAssistantMessage && !hasStreamingContent && <AICompanionBadge />}
          <ThinkingIndicator />
        </div>
      )}
    </div>
  );
}
