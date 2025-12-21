'use client';

import { AnimationChunk } from '@/lib/types';
import QuoteCard from './QuoteCard';
import AnimatedQuoteCard from './AnimatedQuoteCard';
import AnimatedText from './AnimatedText';

interface StreamingMessageProps {
  completedChunks: AnimationChunk[];
  currentChunk: AnimationChunk | null;
  onChunkComplete: () => void;
}

export default function StreamingMessage({
  completedChunks,
  currentChunk,
  onChunkComplete,
}: StreamingMessageProps) {
  const allChunks = [...completedChunks, ...(currentChunk ? [currentChunk] : [])];

  return (
    <div className="mb-6 text-[var(--lo1-text-light)] leading-relaxed">
      {/* Completed chunks - render statically */}
      {completedChunks.map((chunk, index) => (
        <ChunkRenderer key={chunk.id} chunk={chunk} animate={false} isFirst={index === 0} />
      ))}

      {/* Current chunk - animate */}
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
}

function ChunkRenderer({ chunk, animate, isFirst = false, onComplete }: ChunkRendererProps) {
  if (chunk.type === 'text') {
    if (animate) {
      return (
        <span className={isFirst ? '' : 'mt-3 block'}>
          <AnimatedText
            content={chunk.content}
            onComplete={onComplete!}
            speed={50}
          />
        </span>
      );
    }
    return <span className={isFirst ? '' : 'mt-3 block'}>{chunk.content}</span>;
  }

  if (chunk.type === 'quote') {
    if (animate) {
      return (
        <AnimatedQuoteCard
          quote={chunk.quote}
          animate={true}
          onComplete={onComplete}
        />
      );
    }
    return <QuoteCard quote={chunk.quote} />;
  }

  return null;
}
