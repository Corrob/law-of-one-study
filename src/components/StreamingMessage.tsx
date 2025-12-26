"use client";

import { AnimationChunk } from "@/lib/types";
import QuoteCard from "./QuoteCard";
import AnimatedQuoteCard from "./AnimatedQuoteCard";
import AnimatedText from "./AnimatedText";
import ConceptPopover from "./ConceptPopover";
import { parseConceptsInText } from "@/lib/conceptParser";

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
      // During animation, render plain text (no concept linking)
      return (
        <div className={wrapperClass}>
          <AnimatedText content={chunk.content} onComplete={onComplete!} speed={50} />
        </div>
      );
    }

    // After completion, render with concept linking
    return (
      <div className={wrapperClass}>
        {onSearch ? <LinkedText text={chunk.content} onSearch={onSearch} /> : chunk.content}
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

interface LinkedTextProps {
  text: string;
  onSearch: (term: string) => void;
}

function LinkedText({ text, onSearch }: LinkedTextProps) {
  const segments = parseConceptsInText(text);

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.content}</span>
        ) : (
          <ConceptPopover
            key={i}
            term={seg.searchTerm}
            displayText={seg.displayText}
            onSearch={onSearch}
          />
        )
      )}
    </>
  );
}
