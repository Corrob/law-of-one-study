"use client";

import { memo, ReactNode } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentSection as ContentSectionType } from "@/lib/schemas/study-paths";
import { parseInlineReferences } from "@/components/InlineReference";

interface ContentSectionProps {
  section: ContentSectionType;
}

/**
 * Process children to make inline references clickable.
 * Handles both string children and arrays of children.
 */
function processChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    return parseInlineReferences(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === "string") {
        const parsed = parseInlineReferences(child);
        // If parsing returned multiple elements, wrap in fragment with key
        if (Array.isArray(parsed) && parsed.length > 1) {
          return <span key={index}>{parsed}</span>;
        }
        return parsed;
      }
      return child;
    });
  }
  return children;
}

// Custom markdown components matching the existing pattern
const markdownComponents: Components = {
  h2: ({ children, ...props }) => (
    <h2
      className="text-lg font-semibold text-[var(--lo1-starlight)] mt-6 mb-3 first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-base font-semibold text-[var(--lo1-starlight)] mt-5 mb-2 first:mt-0"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-sm font-semibold text-[var(--lo1-starlight)] mt-4 mb-2 first:mt-0"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 last:mb-0 leading-relaxed" {...props}>
      {processChildren(children)}
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
  li: ({ children, ...props }) => <li {...props}>{processChildren(children)}</li>,
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>
      {processChildren(children)}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>{processChildren(children)}</em>
  ),
  // Table components for markdown tables
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-[var(--lo1-deep-purple)]/30" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-[var(--lo1-mystic-purple)]/20" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-[var(--lo1-deep-purple)]/10 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-3 py-2 text-left font-semibold text-[var(--lo1-starlight)] border-b border-[var(--lo1-mystic-purple)]/30" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-3 py-2 text-[var(--lo1-text-light)]" {...props}>
      {processChildren(children)}
    </td>
  ),
  // Center images horizontally
  img: ({ alt, ...props }) => (
    <span className="block text-center my-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- Markdown images have unknown dimensions */}
      <img alt={alt} className="inline-block max-w-full rounded-lg shadow-lg" {...props} />
    </span>
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
