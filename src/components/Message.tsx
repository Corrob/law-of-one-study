'use client';

import { Message as MessageType, MessageSegment } from '@/lib/types';
import QuoteCard from './QuoteCard';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
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

  // Assistant messages: no box, just text
  return (
    <div className="mb-6 text-[var(--lo1-text-light)] leading-relaxed">
      {message.segments && message.segments.length > 0 ? (
        message.segments.map((segment, index) => (
          <SegmentRenderer key={index} segment={segment} isFirst={index === 0} />
        ))
      ) : (
        message.content
      )}
    </div>
  );
}

interface SegmentRendererProps {
  segment: MessageSegment;
  isFirst?: boolean;
}

function SegmentRenderer({ segment, isFirst = false }: SegmentRendererProps) {
  if (segment.type === 'text') {
    return <span className={isFirst ? '' : 'mt-3 block'}>{segment.content}</span>;
  }

  if (segment.type === 'quote') {
    return <QuoteCard quote={segment.quote} />;
  }

  return null;
}
