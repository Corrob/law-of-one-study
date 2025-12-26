'use client';

import { Message as MessageType, MessageSegment } from '@/lib/types';
import QuoteCard from './QuoteCard';
import ConceptPopover from './ConceptPopover';
import { parseConceptsInText } from '@/lib/conceptParser';

interface MessageProps {
  message: MessageType;
  onSearch?: (term: string) => void;
}

export default function Message({ message, onSearch }: MessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#2a3366] text-white border border-[var(--lo1-celestial)]/20">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant messages: no box, just text with concept linking
  return (
    <div className="mb-6 text-[var(--lo1-text-light)] leading-relaxed">
      {message.segments && message.segments.length > 0 ? (
        message.segments.map((segment, index) => (
          <SegmentRenderer
            key={index}
            segment={segment}
            isFirst={index === 0}
            onSearch={onSearch}
          />
        ))
      ) : (
        onSearch ? (
          <LinkedText text={message.content} onSearch={onSearch} />
        ) : (
          message.content
        )
      )}
    </div>
  );
}

interface SegmentRendererProps {
  segment: MessageSegment;
  isFirst?: boolean;
  onSearch?: (term: string) => void;
}

function SegmentRenderer({ segment, isFirst = false, onSearch }: SegmentRendererProps) {
  if (segment.type === 'text') {
    const wrapperClass = isFirst ? 'min-h-[1lh]' : 'mt-3 block min-h-[1lh]';

    return (
      <div className={wrapperClass}>
        {onSearch ? (
          <LinkedText text={segment.content} onSearch={onSearch} />
        ) : (
          segment.content
        )}
      </div>
    );
  }

  if (segment.type === 'quote') {
    return <QuoteCard quote={segment.quote} />;
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
        seg.type === 'text' ? (
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
