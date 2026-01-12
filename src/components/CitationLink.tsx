"use client";

import { memo } from "react";
import { useCitationModal } from "@/contexts/CitationModalContext";

interface CitationLinkProps {
  session: number;
  question: number;
  displayText: string;
}

/**
 * Clickable citation that opens a modal with the quote content.
 *
 * Citations like (Ra 50.7) are parsed from AI responses and wrapped
 * with this component. Clicking opens a modal that shows the full quote
 * with an option to view on lawofone.info.
 *
 * Modal state is managed by CitationModalContext to persist across
 * re-renders when new content streams in.
 *
 * Memoized to prevent re-renders during message streaming.
 */
const CitationLink = memo(function CitationLink({
  session,
  question,
  displayText,
}: CitationLinkProps) {
  const { openCitation } = useCitationModal();

  return (
    <button
      onClick={() => openCitation(session, question)}
      className="citation-link"
      title={`View Ra ${session}.${question}`}
    >
      {displayText}
    </button>
  );
});

export default CitationLink;
