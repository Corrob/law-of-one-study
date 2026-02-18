"use client";

import { memo } from "react";
import { useCitationModal } from "@/contexts/CitationModalContext";

interface RaCitationLinkProps {
  session: number;
  question: number;
  displayText: string;
}

interface ConfederationCitationLinkProps {
  confederationRef: string;
  entity: string;
  url: string;
  displayText: string;
}

type CitationLinkProps = RaCitationLinkProps | ConfederationCitationLinkProps;

function isConfederationProps(props: CitationLinkProps): props is ConfederationCitationLinkProps {
  return "confederationRef" in props;
}

/**
 * Clickable citation that opens a modal with the quote content.
 *
 * Supports both Ra Material citations (Ra 50.7) and Confederation
 * citations (Q'uo, 2024-01-24). Ra citations open a modal with the
 * full quote. Confederation citations open the transcript URL directly.
 *
 * Memoized to prevent re-renders during message streaming.
 */
const CitationLink = memo(function CitationLink(props: CitationLinkProps) {
  const { openCitation, openConfederationCitation } = useCitationModal();

  if (isConfederationProps(props)) {
    return (
      <button
        onClick={() => openConfederationCitation(props.confederationRef, props.url)}
        className="citation-link"
        title={`View ${props.entity} transcript`}
      >
        {props.displayText}
      </button>
    );
  }

  return (
    <button
      onClick={() => openCitation(props.session, props.question)}
      className="citation-link"
      title={`View Ra ${props.session}.${props.question}`}
    >
      {props.displayText}
    </button>
  );
});

export default CitationLink;
