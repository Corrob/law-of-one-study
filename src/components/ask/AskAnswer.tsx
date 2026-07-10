"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { renderCitationsToMarkdown } from "@/lib/ask/citations";

interface AskAnswerProps {
  /** Raw assistant text, may contain {{CITE:...}} markers. */
  content: string;
}

const LAWOFONE_HOST = "lawofone.info";

const markdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside mb-3 space-y-1.5 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside mb-3 space-y-1.5 pl-5" {...props}>
      {children}
    </ol>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }) => {
    const isCitation = typeof href === "string" && href.includes(LAWOFONE_HOST);
    if (isCitation) {
      // Citation chip → the authorized source on lawofone.info.
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline align-baseline mx-0.5 px-1.5 py-0.5 rounded text-xs font-medium
                     bg-[var(--lo1-gold)]/15 text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/25
                     no-underline transition-colors cursor-pointer"
          title="Read the original at lawofone.info"
        >
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--lo1-gold)] hover:underline cursor-pointer"
        {...props}
      >
        {children}
      </a>
    );
  },
};

/**
 * Renders an assistant answer: citation markers become links to lawofone.info,
 * then the result is rendered as Markdown. No Ra Material is reproduced verbatim
 * — only the assistant's own words plus source links.
 */
const AskAnswer = memo(function AskAnswer({ content }: AskAnswerProps) {
  const markdown = renderCitationsToMarkdown(content);
  return (
    <div className="text-[var(--lo1-text-light)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
});

export default AskAnswer;
