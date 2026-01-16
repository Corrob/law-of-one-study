"use client";

import { Message as MessageType, MessageSegment } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { type AvailableLanguage } from "@/lib/language-config";
import QuoteCard from "./QuoteCard";
import BilingualQuoteCard from "./chat/BilingualQuoteCard";
import MarkdownRenderer from "./MarkdownRenderer";
import SuggestionChips from "./SuggestionChips";
import AICompanionBadge from "./AICompanionBadge";

interface MessageProps {
  message: MessageType;
  onSearch?: (term: string) => void;
  suggestions?: string[];
  isFirstAssistant?: boolean;
}

export default function Message({ message, onSearch, suggestions, isFirstAssistant }: MessageProps) {
  const { language } = useLanguage();
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4" data-testid="user-message">
        <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[var(--lo1-user-message)] text-[var(--lo1-starlight)] border border-[var(--lo1-celestial)]/20">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant messages: no box, just text with concept linking
  return (
    <div className="mb-6 text-[var(--lo1-text-light)] leading-relaxed" data-testid="assistant-message">
      {isFirstAssistant && <AICompanionBadge />}
      {message.segments && message.segments.length > 0 ? (
        message.segments.map((segment, index) => (
          <SegmentRenderer
            key={index}
            segment={segment}
            isFirst={index === 0}
            onSearch={onSearch}
            language={language}
          />
        ))
      ) : (
        <MarkdownRenderer content={message.content} onSearch={onSearch} locale={language as AvailableLanguage} />
      )}
      {suggestions && suggestions.length > 0 && onSearch && (
        <SuggestionChips suggestions={suggestions} onSelect={onSearch} />
      )}
    </div>
  );
}

interface SegmentRendererProps {
  segment: MessageSegment;
  isFirst?: boolean;
  onSearch?: (term: string) => void;
  language: string;
}

function SegmentRenderer({ segment, isFirst = false, onSearch, language }: SegmentRendererProps) {
  if (segment.type === "text") {
    const wrapperClass = isFirst ? "min-h-[1lh]" : "mt-3 block min-h-[1lh]";

    return (
      <div className={wrapperClass}>
        <MarkdownRenderer content={segment.content} onSearch={onSearch} locale={language as AvailableLanguage} />
      </div>
    );
  }

  if (segment.type === "quote") {
    // Use BilingualQuoteCard for non-English to show "Show English original" toggle
    if (language !== 'en') {
      return <BilingualQuoteCard quote={segment.quote} targetLanguage={language as AvailableLanguage} />;
    }
    return <QuoteCard quote={segment.quote} />;
  }

  return null;
}
