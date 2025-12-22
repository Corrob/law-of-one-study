'use client';

import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Message as MessageType, MessageSegment, Quote } from '@/lib/types';
import Message from './Message';
import StreamingMessage from './StreamingMessage';
import MessageInput from './MessageInput';
import WelcomeScreen from './WelcomeScreen';
import { useAnimationQueue } from '@/hooks/useAnimationQueue';
import { getPlaceholder, defaultPlaceholder } from '@/data/placeholders';

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
  const parts = buffer.split('\n\n');

  // Last part might be incomplete
  const remaining = buffer.endsWith('\n\n') ? '' : parts.pop() || '';

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    let type = '';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) type = line.slice(7);
      if (line.startsWith('data: ')) data = line.slice(6);
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
  const [streamingQuotes, setStreamingQuotes] = useState<Quote[]>([]);
  const [placeholder, setPlaceholder] = useState(defaultPlaceholder);

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

    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scroll to bottom - only called when user sends a message
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollAnchorRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamDone(false);
    setStreamingQuotes([]);
    resetQueue();

    // Scroll to bottom when user sends message (moves their message to top)
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      let quotes: Quote[] = [];
      let chunkIdCounter = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSE(buffer);
        buffer = remaining;

        for (const event of events) {
          if (event.type === 'meta') {
            quotes = event.data.quotes as Quote[];
            setStreamingQuotes(quotes);
          } else if (event.type === 'chunk') {
            const chunkData = event.data as { type: 'text' | 'quote'; content?: string; index?: number };
            chunkIdCounter++;

            if (chunkData.type === 'text' && chunkData.content) {
              addChunk({
                id: `chunk-${chunkIdCounter}`,
                type: 'text',
                content: chunkData.content,
              });
            } else if (chunkData.type === 'quote' && chunkData.index !== undefined) {
              const quoteIndex = chunkData.index - 1; // Convert to 0-indexed
              if (quoteIndex >= 0 && quoteIndex < quotes.length) {
                addChunk({
                  id: `chunk-${chunkIdCounter}`,
                  type: 'quote',
                  quote: quotes[quoteIndex],
                });
              }
            }
          } else if (event.type === 'done') {
            // Mark stream as done - message will be finalized when animation completes
            setStreamDone(true);
          } else if (event.type === 'error') {
            throw new Error(event.data.message as string);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      resetQueue();
      setStreamingQuotes([]);
      setIsStreaming(false);
    }
  };

  // Finalize message when stream is done AND all animations are complete
  useEffect(() => {
    if (streamDone && isFullyComplete) {
      // Convert chunks to segments for the final message
      const segments: MessageSegment[] = allChunks.map((chunk) => {
        if (chunk.type === 'text') {
          return { type: 'text' as const, content: chunk.content };
        } else {
          return { type: 'quote' as const, quote: chunk.quote };
        }
      });

      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: segments
          .filter((s) => s.type === 'text')
          .map((s) => (s as { type: 'text'; content: string }).content)
          .join(''),
        segments,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        // Update placeholder for next message
        setPlaceholder(getPlaceholder(newMessages.length));
        return newMessages;
      });
      resetQueue();
      setStreamingQuotes([]);
      setStreamDone(false);
      setIsStreaming(false);
    }
  }, [streamDone, isFullyComplete, allChunks, resetQueue]);

  const handleReset = useCallback(() => {
    setMessages([]);
    resetQueue();
    setStreamingQuotes([]);
    setStreamDone(false);
    setIsStreaming(false);
    setPlaceholder(getPlaceholder(0));
  }, [resetQueue]);

  // Expose reset function to parent via ref
  useImperativeHandle(ref, () => ({
    reset: handleReset,
  }), [handleReset]);

  const hasConversation = messages.length > 0 || allChunks.length > 0;
  const hasStreamingContent = completedChunks.length > 0 || currentChunk !== null;
  // Show loading dots when: streaming with no content yet, OR waiting for more chunks
  const showLoadingDots = isStreaming && (
    !hasStreamingContent ||
    (!isAnimating && queueLength === 0 && !streamDone)
  );

  // Build scroll shadow classes
  const scrollShadowClasses = [
    'scroll-shadow-container',
    scrollShadow.top ? 'shadow-top' : '',
    scrollShadow.bottom ? 'shadow-bottom' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col h-full relative">
      {/* Starfield - only on welcome screen */}
      {!hasConversation && <div className="starfield" />}

      {/* Messages Area with scroll shadows */}
      <div className={`flex-1 overflow-hidden relative z-10 ${hasConversation ? scrollShadowClasses : ''}`}>
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto chat-scroll px-4 py-6"
        >
        {!hasConversation ? (
          <WelcomeScreen onSelectStarter={handleSend} />
        ) : (
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            {/* Messages container */}
            <div>
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {hasStreamingContent && (
                <StreamingMessage
                  completedChunks={completedChunks}
                  currentChunk={currentChunk}
                  onChunkComplete={onChunkComplete}
                />
              )}
              {showLoadingDots && (
                <div className="mb-6 flex gap-1">
                  <span
                    className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></span>
                </div>
              )}
            </div>
            {/* Flexible spacer - fills remaining space so messages stay near top */}
            <div className="flex-grow min-h-[200px]" />
            {/* Scroll anchor */}
            <div ref={scrollAnchorRef} className="h-1" />
          </div>
        )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--lo1-celestial)]/20 bg-[var(--lo1-indigo)]/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <MessageInput
            onSend={handleSend}
            disabled={isStreaming}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
});

export default ChatInterface;
