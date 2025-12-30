"use client";

import { AnimationChunk } from "@/lib/types";
import QuoteCard from "./QuoteCard";
import AnimatedQuoteCard from "./AnimatedQuoteCard";
import AnimatedMarkdown from "./AnimatedMarkdown";
import MarkdownRenderer from "./MarkdownRenderer";

interface StreamingMessageProps {
  completedChunks: AnimationChunk[];
  currentChunk: AnimationChunk | null;
  onChunkComplete: () => void;
  onSearch?: (term: string) => void;
}

export default function StreamingMessage({
  completedChunks,
  currentChunk,
  onChunkComplete,
  onSearch,
}: StreamingMessageProps) {
  return (
    <div className="mb-6 text-[var(--lo1-text-light)] leading-relaxed">
      {/* Completed chunks - render statically with concept linking */}
      {completedChunks.map((chunk, index) => (
        <ChunkRenderer
          key={chunk.id}
          chunk={chunk}
          animate={false}
          isFirst={index === 0}
          onSearch={onSearch}
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
}

function ChunkRenderer({
  chunk,
  animate,
  isFirst = false,
  onComplete,
  onSearch,
}: ChunkRendererProps) {
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
    if (animate) {
      return <AnimatedQuoteCard quote={chunk.quote} animate={true} onComplete={onComplete} />;
    }
    return <QuoteCard quote={chunk.quote} />;
  }

  return null;
}
