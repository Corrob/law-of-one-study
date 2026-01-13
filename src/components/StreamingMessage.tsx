"use client";

import { AnimationChunk } from "@/lib/types";
import { debug } from "@/lib/debug";
import { useLanguage } from "@/contexts/LanguageContext";
import { type AvailableLanguage } from "@/lib/language-config";
import QuoteCard from "./QuoteCard";
import AnimatedQuoteCard from "./AnimatedQuoteCard";
import BilingualQuoteCard from "./chat/BilingualQuoteCard";
import AnimatedMarkdown from "./AnimatedMarkdown";
import MarkdownRenderer from "./MarkdownRenderer";
import AICompanionBadge from "./AICompanionBadge";

interface StreamingMessageProps {
  completedChunks: AnimationChunk[];
  currentChunk: AnimationChunk | null;
  onChunkComplete: () => void;
  onSearch?: (term: string) => void;
  isFirstAssistant?: boolean;
}

export default function StreamingMessage({
  completedChunks,
  currentChunk,
  onChunkComplete,
  onSearch,
  isFirstAssistant,
}: StreamingMessageProps) {
  const { language } = useLanguage();

  return (
    <div className="mb-6 text-[var(--lo1-text-light)] leading-relaxed">
      {isFirstAssistant && <AICompanionBadge />}
      {/* Completed chunks - render statically with concept linking */}
      {completedChunks.map((chunk, index) => (
        <ChunkRenderer
          key={chunk.id}
          chunk={chunk}
          animate={false}
          isFirst={index === 0}
          onSearch={onSearch}
          language={language}
        />
      ))}

      {/* Current chunk - animate (no concept linking during animation) */}
      {currentChunk && (
        <ChunkRenderer
          key={currentChunk.id}
          chunk={currentChunk}
          animate={true}
          isFirst={completedChunks.length === 0}
          onComplete={onChunkComplete}
          language={language}
        />
      )}
    </div>
  );
}

interface ChunkRendererProps {
  chunk: AnimationChunk;
  animate: boolean;
  isFirst?: boolean;
  onComplete?: () => void;
  onSearch?: (term: string) => void;
  language: string;
}

function ChunkRenderer({
  chunk,
  animate,
  isFirst = false,
  onComplete,
  onSearch,
  language,
}: ChunkRendererProps) {
  debug.log("[ChunkRenderer] Rendering chunk:", {
    type: chunk.type,
    animate,
    isFirst,
    hasQuote: chunk.type === "quote" ? !!chunk.quote : undefined,
    reference: chunk.type === "quote" ? chunk.quote?.reference : undefined,
  });

  if (chunk.type === "text") {
    // Use div instead of span for consistent block layout
    // Add min-height to prevent layout shift during content changes
    const wrapperClass = isFirst ? "min-h-[1lh]" : "mt-3 block min-h-[1lh]";

    if (animate) {
      // During animation, render markdown (no concept linking during animation)
      return (
        <div className={wrapperClass}>
          <AnimatedMarkdown content={chunk.content} onComplete={onComplete!} speed={50} />
        </div>
      );
    }

    // After completion, render with concept linking and markdown
    return (
      <div className={wrapperClass}>
        <MarkdownRenderer content={chunk.content} onSearch={onSearch} />
      </div>
    );
  }

  if (chunk.type === "quote") {
    debug.log("[ChunkRenderer] Rendering quote:", {
      animate,
      quoteText: chunk.quote.text.substring(0, 50),
      reference: chunk.quote.reference,
      language,
    });
    if (animate) {
      // AnimatedQuoteCard handles its own translation fetching
      return <AnimatedQuoteCard quote={chunk.quote} animate={true} onComplete={onComplete} />;
    }
    // Use BilingualQuoteCard for non-English to show "Show English original" toggle
    if (language !== 'en') {
      return <BilingualQuoteCard quote={chunk.quote} targetLanguage={language as AvailableLanguage} />;
    }
    return <QuoteCard quote={chunk.quote} />;
  }

  debug.warn("[ChunkRenderer] Unknown chunk type:", chunk);
  return null;
}
