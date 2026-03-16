"use client";

import { memo, ReactNode } from "react";
import { useLocale } from "next-intl";
import { getRaMaterialUrl } from "@/lib/quote-utils";
import type { AvailableLanguage } from "@/lib/language-config";

/**
 * Regex to match inline Ra material references like (92.9) or (Ra 92.9)
 * Captures: session number and question number
 */
const REFERENCE_PATTERN = /\((?:Ra\s+)?(\d+)\.(\d+)\)/g;

interface ReferenceButtonProps {
  session: number;
  question: number;
  displayText: string;
}

/**
 * Clickable reference link that opens llresearch.org in a new tab
 */
const ReferenceLink = memo(function ReferenceLink({
  session,
  question,
  displayText,
}: ReferenceButtonProps) {
  const locale = useLocale() as AvailableLanguage;
  const url = getRaMaterialUrl(session, question, locale);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline cursor-pointer font-medium"
      title={`View Ra ${session}.${question}`}
    >
      {displayText}
    </a>
  );
});

/**
 * Parse text and replace inline references with clickable links
 *
 * Transforms patterns like "(92.9)" or "(Ra 92.9)" into clickable
 * links that open llresearch.org in a new tab.
 */
export function parseInlineReferences(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  // Reset regex state
  REFERENCE_PATTERN.lastIndex = 0;

  while ((match = REFERENCE_PATTERN.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const session = parseInt(match[1], 10);
    const question = parseInt(match[2], 10);
    const displayText = match[0]; // e.g., "(92.9)" or "(Ra 92.9)"

    // Add the clickable reference
    parts.push(
      <ReferenceLink
        key={`ref-${key++}`}
        session={session}
        question={question}
        displayText={displayText}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

interface InlineReferenceTextProps {
  children: string;
}

/**
 * Component that renders text with inline references as clickable links.
 * Use this to wrap text content that may contain Ra material references.
 */
const InlineReferenceText = memo(function InlineReferenceText({
  children,
}: InlineReferenceTextProps) {
  if (typeof children !== "string") {
    return <>{children}</>;
  }

  const parsed = parseInlineReferences(children);
  return <>{parsed}</>;
});

export default InlineReferenceText;
