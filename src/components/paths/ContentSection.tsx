"use client";

import { memo } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentSection as ContentSectionType } from "@/lib/schemas/study-paths";

interface ContentSectionProps {
  section: ContentSectionType;
}

// Custom markdown components matching the existing pattern
const markdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p className="mb-4 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside mb-4 space-y-2 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside mb-4 space-y-2 pl-5" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => <li {...props}>{children}</li>,
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>{children}</em>
  ),
};

/**
 * Renders a content section with markdown formatting.
 * Used for plain language explanations within lessons.
 */
const ContentSection = memo(function ContentSection({ section }: ContentSectionProps) {
  return (
    <div className="text-[var(--lo1-text-light)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {section.markdown}
      </ReactMarkdown>
    </div>
  );
});

export default ContentSection;
